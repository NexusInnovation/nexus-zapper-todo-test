// Run with: node --test .zapper/scripts/goal-gate.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { findWorkspace, gateProblems, handle } from "./goal-gate.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "goal-gate.mjs");
const GOAL =
  "/goal Achieve the objective of .zapper/goal.md --max-ai-credits 100";

describe("goal gate", () => {
  let root;
  let stateDir;

  const write = (file, text) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  const approveAll = () => {
    write(".zapper/config.md", "---\nstatus: approved\n---\n");
    write(".zapper/input/README.md", "---\nstatus: approved\n---\n");
    write(
      ".zapper/behaviour-driven-development/README.md",
      "---\nstatus: approved\n---\n",
    );
    write(
      ".zapper/behaviour-driven-development/stories/s01.feature",
      "Feature: S01\n",
    );
    write(
      ".zapper/regression-baseline/README.md",
      "---\nstatus: approved\nbaseline: passed\n---\n",
    );
    write(".zapper/run/plan/README.md", "---\nstatus: approved\n---\n");
    write(
      ".zapper/run/plan/decisions.md",
      "## D01: Choice\n\n- **Status**: approved\n",
    );
  };
  const run = (event, payload) =>
    handle(
      event,
      { sessionId: "s1", ...payload },
      { workspace: root, stateDir },
    );
  const tool = (toolName) => run("check", { toolName });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "zapper-gate-"));
    stateDir = join(root, "state");
    write(".zapper/goal.md", "# Goal\n");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("lets the run start when every artifact is approved", () => {
    approveAll();
    assert.deepEqual(gateProblems(root), []);
    run("mark", { prompt: GOAL });
    assert.equal(tool("powershell"), "");
  });

  it("does not gate the later operations of a session that started the goal", () => {
    approveAll();
    run("mark", { prompt: GOAL });
    write(".zapper/run/plan/README.md", "---\nstatus: draft\n---\n");
    assert.equal(tool("edit"), "");
  });

  it("releases a refused session when the human moves on to another prompt", () => {
    run("mark", { prompt: GOAL });
    assert.equal(JSON.parse(tool("edit")).permissionDecision, "deny");
    run("mark", { prompt: "Run the plan-implementation-zapper skill" });
    assert.equal(tool("edit"), "");
  });

  it("refuses an approved BDD suite without a .feature file", () => {
    approveAll();
    write(
      ".zapper/behaviour-driven-development/README.md",
      "---\nstatus: approved\nfeatures-path: tests/bdd/features\n---\n",
    );
    assert.match(gateProblems(root).join("\n"), /no \.feature file/);
    write("tests/bdd/features/area/s01.feature", "Feature: S01\n");
    assert.deepEqual(gateProblems(root), []);
  });

  it("refuses when the decision log of the plan is missing", () => {
    approveAll();
    rmSync(join(root, ".zapper/run/plan/decisions.md"));
    assert.match(
      gateProblems(root).join("\n"),
      /decision log of the plan is missing/,
    );
  });

  it("releases a refused session once the artifacts are approved", () => {
    run("mark", { prompt: GOAL });
    assert.equal(JSON.parse(tool("edit")).permissionDecision, "deny");
    approveAll();
    assert.equal(tool("edit"), "");
    write(".zapper/run/plan/README.md", "---\nstatus: draft\n---\n");
    assert.equal(tool("edit"), "");
  });

  for (const [file, expected] of [
    [".zapper/input/README.md", "Refined input is not approved"],
    [
      ".zapper/behaviour-driven-development/README.md",
      "BDD suite is not approved",
    ],
    [
      ".zapper/regression-baseline/README.md",
      "Regression baseline is not approved",
    ],
    [".zapper/run/plan/README.md", "Implementation plan is not approved"],
  ]) {
    it(`refuses while ${file} is a draft`, () => {
      approveAll();
      write(file, "---\nstatus: draft\n---\n");
      run("mark", { prompt: GOAL });
      const decision = JSON.parse(tool("edit"));
      assert.equal(decision.permissionDecision, "deny");
      assert.match(decision.permissionDecisionReason, new RegExp(expected));
    });
  }

  it("refuses a missing artifact, a failing baseline and a proposed decision", () => {
    approveAll();
    rmSync(join(root, ".zapper/input/README.md"));
    write(
      ".zapper/regression-baseline/README.md",
      "---\nstatus: approved\nbaseline: failed\n---\n",
    );
    write(
      ".zapper/run/plan/decisions.md",
      "## D01: Choice\n\n- **Status**: proposed\n",
    );
    const problems = gateProblems(root).join("\n");
    assert.match(problems, /Refined input is missing/);
    assert.match(problems, /baseline: passed/);
    assert.match(problems, /decision of the plan is still proposed/);
  });

  it("keeps read-only tools available while refusing", () => {
    run("mark", { prompt: GOAL });
    assert.equal(tool("view"), "");
    assert.equal(JSON.parse(tool("powershell")).permissionDecision, "deny");
    assert.equal(JSON.parse(tool("task")).permissionDecision, "deny");
  });

  it("gates only the session that launched the goal", () => {
    run("mark", { prompt: "Update the plan" });
    assert.equal(tool("edit"), "");
    run("mark", { prompt: GOAL, sessionId: "other" });
    assert.equal(tool("edit"), "");
    assert.notEqual(run("check", { sessionId: "other", toolName: "edit" }), "");
  });

  it("stops gating once the session ends", () => {
    run("mark", { prompt: GOAL });
    run("clear", {});
    assert.equal(tool("edit"), "");
  });

  it("finds the workspace from a sub-folder", () => {
    mkdirSync(join(root, "src", "app"), { recursive: true });
    assert.equal(findWorkspace(join(root, "src", "app"), "fallback"), root);
  });

  it("gates the autopilot rewrite of the goal prompt", () => {
    const rewritten =
      "The user set this explicit autopilot objective with /autopilot:\n\nAchieve the objective of .zapper/goal.md\n\nWork autonomously";
    run("mark", { prompt: rewritten });
    assert.equal(JSON.parse(tool("edit")).permissionDecision, "deny");
  });

  it("does not gate a prompt that only mentions the goal file", () => {
    run("mark", { prompt: "Explain what .zapper/goal.md asks for" });
    assert.equal(tool("edit"), "");
  });

  it("reports the preflight result through the exit code", () => {
    const preflight = () =>
      execFileSync("node", [SCRIPT, "preflight"], {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe",
      });
    assert.throws(
      preflight,
      (error) => error.status === 1 && /refuses to start/.test(error.stderr),
    );
    approveAll();
    assert.match(preflight(), /ready/);
  });

  it("works as a command hook reading the payload on stdin", () => {
    const payload = (extra) =>
      JSON.stringify({ sessionId: "cli", cwd: root, ...extra });
    const hook = (event, extra) =>
      execFileSync("node", [SCRIPT, event], {
        input: payload(extra),
        encoding: "utf8",
      });
    hook("mark", { prompt: GOAL });
    assert.equal(
      JSON.parse(hook("check", { toolName: "bash" })).permissionDecision,
      "deny",
    );
    hook("clear", {});
    assert.equal(hook("check", { toolName: "bash" }), "");
  });
});
