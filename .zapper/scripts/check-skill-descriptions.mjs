#!/usr/bin/env node
// Fails when a Zapper skill `description` exceeds the Copilot CLI limit (1024 characters).
// Dependency-free so it runs anywhere Node does: `node .zapper/scripts/check-skill-descriptions.mjs`.
// Optional argument: the skills folder to check (default: ../skills next to this script).
// With --staged, checks the SKILL.md files as staged in the Git index (pre-commit hook).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LIMIT = 1024;
const TARGET = 900;

// Joins lines the way YAML folds them: a line break becomes one space, a blank line becomes a newline.
function fold(lines) {
  let result = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") result += "\n";
    else result += result === "" || result.endsWith("\n") ? line : ` ${line}`;
  }
  return result;
}

function findClosingQuote(text, quote) {
  for (let i = 1; i < text.length; i++) {
    if (quote === '"' && text[i] === "\\") i++;
    else if (quote === "'" && text[i] === "'" && text[i + 1] === "'") i++;
    else if (text[i] === quote) return i;
  }
  return -1;
}

function unescapeDoubleQuoted(body) {
  const escapes = { n: "\n", t: "\t" };
  return body.replace(/\\(.)/g, (_, ch) => escapes[ch] ?? ch);
}

// Returns the `description` the way Copilot CLI reads it from the frontmatter, or null when unreadable.
function readDescription(skillText) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(skillText);
  if (!match) return null;

  const lines = match[1].split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith("description:"));
  if (start === -1) return null;

  const continuation = [];
  for (let i = start + 1; i < lines.length && (/^\s/.test(lines[i]) || lines[i] === ""); i++) {
    continuation.push(lines[i]);
  }

  const inline = lines[start].slice("description:".length).trim();
  if (/^[>|][+-]?\d*$/.test(inline)) {
    const body = inline.startsWith("|") ? continuation.map((line) => line.trim()).join("\n") : fold(continuation);
    return body.trim();
  }

  const value = fold([inline, ...continuation]);
  const quote = value[0];
  if (quote !== '"' && quote !== "'") return value;

  const end = findClosingQuote(value, quote);
  if (end === -1) return null;
  const body = value.slice(1, end);
  return quote === '"' ? unescapeDoubleQuoted(body) : body.replaceAll("''", "'");
}

const stagedOnly = process.argv.includes("--staged");
const folderArg = process.argv.slice(2).find((arg) => arg !== "--staged");

// Pre-commit mode: the commit contains the indexed blobs, not the working-tree files.
function stagedSkillFiles() {
  const git = (args) => execFileSync("git", args, { encoding: "utf8" });
  const root = git(["rev-parse", "--show-toplevel"]).trim();
  return git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z", "--", ".zapper/skills/*/SKILL.md"])
    .split("\0")
    .filter(Boolean)
    .map((path) => ({
      name: path.split("/").at(-2),
      text: execFileSync("git", ["show", `:${path}`], { cwd: root, encoding: "utf8" }),
    }));
}

function workingTreeSkillFiles() {
  const skillsDir = resolve(folderArg ?? join(dirname(fileURLToPath(import.meta.url)), "..", "skills"));
  if (!existsSync(skillsDir)) {
    console.error(`Skills folder not found: ${skillsDir}`);
    process.exit(2);
  }
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(skillsDir, entry.name, "SKILL.md")))
    .map((entry) => ({ name: entry.name, text: readFileSync(join(skillsDir, entry.name, "SKILL.md"), "utf8") }));
}

let failed = false;
for (const { name, text } of stagedOnly ? stagedSkillFiles() : workingTreeSkillFiles()) {
  const description = readDescription(text);
  if (description === null) {
    console.error(`FAIL ${name}: no readable frontmatter description`);
    failed = true;
  } else if (description.length > LIMIT) {
    console.error(`FAIL ${name}: description is ${description.length} characters (limit ${LIMIT})`);
    failed = true;
  } else if (description.length > TARGET) {
    console.warn(`WARN ${name}: description is ${description.length} characters (target <= ${TARGET})`);
  } else {
    console.log(`OK   ${name}: ${description.length} characters`);
  }
}

process.exit(failed ? 1 : 0);
