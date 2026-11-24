// Run with: node --test .zapper/scripts/zapper-config.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { getPath, parseFrontmatter, parseYaml } from "./zapper-config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "zapper-config.mjs");
const TEMPLATE = join(
  HERE,
  "..",
  "skills",
  "workspace-check-zapper",
  "assets",
  "config.md",
);

describe("zapper config", () => {
  it("parses nested maps, lists of scalars and lists of maps", () => {
    const yaml = [
      "status: approved # comment",
      "commands:",
      "  build:",
      '    - "dotnet build # not a comment"',
      "  e2e: none",
      "runner:",
      "  cpu: 3",
      "  enabled: true",
      "  sidecars:",
      "    - name: mssql",
      "      port: 1433",
      "      env:",
      '        ACCEPT_EULA: "Y"',
      "    - name: azurite",
      "  setup:",
      "  - 'echo it''s'",
      "  empty: []",
    ].join("\n");
    assert.deepEqual(parseYaml(yaml), {
      status: "approved",
      commands: { build: ["dotnet build # not a comment"], e2e: "none" },
      runner: {
        cpu: 3,
        enabled: true,
        sidecars: [
          { name: "mssql", port: 1433, env: { ACCEPT_EULA: "Y" } },
          { name: "azurite" },
        ],
        setup: ["echo it's"],
        empty: [],
      },
    });
  });

  it("reads a dotted path", () => {
    assert.equal(getPath({ a: { b: [1] } }, "a.b.0"), 1);
    assert.equal(getPath({ a: {} }, "a.c"), undefined);
  });

  it("parses the configuration template", () => {
    const config = parseFrontmatter(readFileSync(TEMPLATE, "utf8"));
    assert.equal(config.status, "draft");
    assert.ok(Array.isArray(config.commands.build));
    assert.ok(Array.isArray(config.runner.sidecars));
    assert.ok(config.runner.azure["resource-group"]);
  });

  it("prints values from the command line", () => {
    const root = mkdtempSync(join(tmpdir(), "zapper-config-"));
    try {
      mkdirSync(join(root, ".zapper"), { recursive: true });
      writeFileSync(join(root, ".zapper", "goal.md"), "# Goal\n");
      writeFileSync(
        join(root, ".zapper", "config.md"),
        "---\nstatus: draft\nrunner:\n  setup:\n    - a\n    - b\n---\n",
      );
      const cli = (...args) =>
        execFileSync("node", [SCRIPT, ...args], {
          cwd: root,
          encoding: "utf8",
          stdio: "pipe",
        });
      assert.equal(cli("status").trim(), "draft");
      assert.equal(
        cli("runner.setup", "--lines").trim().split(/\r?\n/).join(","),
        "a,b",
      );
      assert.deepEqual(JSON.parse(cli("runner")), { setup: ["a", "b"] });
      assert.throws(
        () => cli("runner.missing"),
        (error) => error.status === 1,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
