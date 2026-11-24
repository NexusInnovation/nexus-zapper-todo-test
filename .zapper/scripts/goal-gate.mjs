#!/usr/bin/env node
// Copilot CLI hook: /goal refuses to start unless every stage artifact is approved (ADO 76725).
// Dependency-free: `node .zapper/scripts/goal-gate.mjs <mark|check|clear>`, the hook payload on stdin.
//   mark  (userPromptSubmitted): remembers the session when the prompt launches `/goal ... .zapper/goal.md`
//   check (preToolUse): while the gate is not met, denies every tool of a marked session except read-only ones
//   clear (sessionEnd): forgets the session
// Only the sessions that launched the goal are gated: the stages that produce the artifacts keep working.
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GOAL_PROMPT = /^\s*\/goal\b[^\n]*\.zapper[\\/]goal\.md/i;
const READ_ONLY_TOOLS = new Set(["view", "glob", "grep", "rg", "ask_user", "skill", "report_intent"]);

const ARTIFACTS = [
  { name: "Project configuration", file: ".zapper/config.md", stage: "workspace-check-zapper (config template)" },
  { name: "Refined input", file: ".zapper/input/README.md", stage: "refine-input-zapper" },
  { name: "BDD suite", file: ".zapper/behaviour-driven-development/README.md", stage: "generate-bdd-zapper" },
  {
    name: "Regression baseline",
    file: ".zapper/regression-baseline/README.md",
    stage: "regression-baseline-zapper",
    passed: true,
  },
  { name: "Implementation plan", file: ".zapper/run/plan/README.md", stage: "plan-implementation-zapper" },
];

function frontmatterValue(text, key) {
  const frontmatter = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  const value = new RegExp(`^${key}:[ \\t]*([^\\s#][^\\n#]*?)[ \\t]*(?:#.*)?$`, "m").exec(frontmatter)?.[1];
  return value?.replace(/^["']|["']$/g, "");
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

// Returns what blocks the start of a run, one sentence per problem; empty when the run may start.
export function gateProblems(workspace) {
  const problems = [];
  for (const { name, file, stage, passed } of ARTIFACTS) {
    const text = readIfExists(join(workspace, file));
    if (text === null) problems.push(`${name} is missing (${file}): run ${stage}.`);
    else if (frontmatterValue(text, "status") !== "approved") {
      problems.push(`${name} is not approved (${file} must show status: approved): run ${stage}.`);
    } else if (passed && frontmatterValue(text, "baseline") !== "passed") {
      problems.push(`${name} has not passed (${file} must show baseline: passed): run ${stage}.`);
    }
  }
  const decisions = readIfExists(join(workspace, ".zapper/run/plan/decisions.md"));
  if (decisions === null) {
    problems.push("The decision log of the plan is missing (.zapper/run/plan/decisions.md): run plan-implementation-zapper.");
  } else if (/\*\*Status\*\*:\s*proposed\b/i.test(decisions)) {
    problems.push("A decision of the plan is still proposed (.zapper/run/plan/decisions.md): approve it in the plan.");
  }
  return problems;
}

export function refusal(problems) {
  return (
    `Zapper refuses to start the goal: ${problems.join(" ")} ` +
    "Stop now, tell the human to run the workspace-check-zapper skill, and do not work around this."
  );
}

// The repository root: the closest parent of `from` that holds `.zapper/goal.md`.
export function findWorkspace(from, fallback) {
  for (let dir = resolve(from); ; dir = dirname(dir)) {
    if (existsSync(join(dir, ".zapper", "goal.md"))) return dir;
    if (dirname(dir) === dir) return fallback;
  }
}

const sessionKey = (payload) => String(payload.sessionId ?? payload.session_id ?? "").replace(/[^\w-]/g, "");
const toolOf = (payload) => String(payload.toolName ?? payload.tool_name ?? "").toLowerCase();

function log(workspace, entry) {
  try {
    const dir = join(workspace, ".zapper", "run");
    mkdirSync(dir, { recursive: true });
    const line = JSON.stringify({ time: new Date().toISOString(), hook: "goal-gate", ...entry });
    appendFileSync(join(dir, "hooks.log.jsonl"), `${line}\n`);
  } catch {
    // The log must never decide the outcome of the gate.
  }
}

// Runs one hook event and returns what the hook prints on stdout (empty: no decision).
// Only the start of the run is gated. The session is released once the gate holds, so the later
// operations of a session (sign-off, then a plan update that sets the status back to draft) keep
// working, and by the next prompt that is not a goal launch, so the human can prepare the missing
// stages in the same session after a refusal.
export function handle(event, payload, { workspace, stateDir }) {
  const key = sessionKey(payload);
  if (!key) return "";
  const marker = join(stateDir, key);

  if (event === "clear") {
    rmSync(marker, { force: true });
    return "";
  }

  if (event === "mark") {
    if (!GOAL_PROMPT.test(String(payload.prompt ?? ""))) {
      rmSync(marker, { force: true });
      return "";
    }
    const problems = gateProblems(workspace);
    if (problems.length === 0) rmSync(marker, { force: true });
    else {
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(marker, new Date().toISOString());
    }
    log(workspace, { event: "userPromptSubmitted", result: problems.length ? "refused" : "passed", detail: problems });
    return "";
  }

  if (!existsSync(marker) || READ_ONLY_TOOLS.has(toolOf(payload))) return "";
  let reason;
  try {
    const problems = gateProblems(workspace);
    if (problems.length === 0) {
      rmSync(marker, { force: true });
      return "";
    }
    reason = refusal(problems);
  } catch (error) {
    reason = `Zapper refuses to start the goal: the approval gate could not be checked (${error.message}).`;
  }
  log(workspace, { event: "preToolUse", tool: toolOf(payload), result: "denied", detail: reason });
  return JSON.stringify({ permissionDecision: "deny", permissionDecisionReason: reason });
}

function main() {
  const event = process.argv[2];
  if (!["mark", "check", "clear"].includes(event)) {
    console.error("Usage: goal-gate.mjs <mark|check|clear>, hook payload on stdin");
    return 2;
  }
  let payload = {};
  try {
    payload = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    // An unreadable payload leaves the session ungated rather than blocking every tool.
  }
  const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const workspace = findWorkspace(payload.cwd ?? process.cwd(), scriptRoot);
  const stateDir = join(tmpdir(), "zapper-goal-sessions");
  const output = handle(event, payload, { workspace, stateDir });
  if (output) process.stdout.write(output);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exit(main());
