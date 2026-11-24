#!/usr/bin/env node
// Fails when `.zapper/goal.md` exceeds the length the goal condition allows (4000 characters).
// Dependency-free so it runs anywhere Node does: `node .zapper/scripts/check-goal-length.mjs`.
// Optional argument: the goal file to check (default: ../goal.md next to this script).
// With --staged, checks goal.md as staged in the Git index (pre-commit hook).
// Line breaks count as one character, whatever the checkout's line endings.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LIMIT = 4000;
const TARGET = 3900;

const stagedOnly = process.argv.includes("--staged");
const fileArg = process.argv.slice(2).find((arg) => arg !== "--staged");

function readGoal() {
  if (stagedOnly) {
    const git = (args) => execFileSync("git", args, { encoding: "utf8" });
    const root = git(["rev-parse", "--show-toplevel"]).trim();
    return execFileSync("git", ["show", ":.zapper/goal.md"], { cwd: root, encoding: "utf8" });
  }
  const path = resolve(fileArg ?? join(dirname(fileURLToPath(import.meta.url)), "..", "goal.md"));
  if (!existsSync(path)) {
    console.error(`Goal file not found: ${path}`);
    process.exit(2);
  }
  return readFileSync(path, "utf8");
}

const length = [...readGoal().replaceAll("\r\n", "\n")].length;

if (length > LIMIT) {
  console.error(`FAIL goal.md is ${length} characters (limit ${LIMIT})`);
  process.exit(1);
}
if (length > TARGET) console.warn(`WARN goal.md is ${length} characters (target <= ${TARGET})`);
else console.log(`OK   goal.md: ${length} characters`);
