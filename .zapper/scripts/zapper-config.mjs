#!/usr/bin/env node
// Reads the YAML frontmatter of .zapper/config.md without dependencies (the subset the template uses:
// nested maps, lists of scalars or maps, quoted and plain scalars, comments).
//   node .zapper/scripts/zapper-config.mjs [dotted.path] [--lines]
// Prints JSON for a map or a list, the raw value for a scalar, one item per line with --lines.
// Exits 1 when the file or the path is missing.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { findWorkspace } from "./goal-gate.mjs";

function stripComment(text) {
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "#" && (i === 0 || /\s/.test(text[i - 1])))
      return text.slice(0, i).trimEnd();
  }
  return text.trimEnd();
}

function scalar(text) {
  const value = text.trim();
  if (value.startsWith('"')) return JSON.parse(value);
  if (value.startsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  if (value === "[]") return [];
  if (value === "{}") return {};
  if (value === "true" || value === "false") return value === "true";
  if (value === "null" || value === "~") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

const KEY = /^([A-Za-z0-9_.-]+):(?:\s+(.*))?$/;
const isItem = (line) => line.text === "-" || line.text.startsWith("- ");

export function parseYaml(source) {
  const lines = source
    .split(/\r?\n/)
    .map((raw) => ({
      indent: raw.length - raw.trimStart().length,
      text: stripComment(raw.trim()),
    }))
    .filter((line) => line.text !== "");
  let i = 0;

  function block(indent) {
    return isItem(lines[i]) ? list(indent) : map(indent);
  }

  function value(rest, indent) {
    if (rest !== undefined && rest !== "") return scalar(rest);
    const next = lines[i];
    if (next && next.indent > indent) return block(next.indent);
    if (next && next.indent === indent && isItem(next)) return list(indent);
    return null;
  }

  function map(indent) {
    const result = {};
    while (
      i < lines.length &&
      lines[i].indent === indent &&
      !isItem(lines[i])
    ) {
      const match = KEY.exec(lines[i].text);
      if (!match) throw new Error(`Unsupported YAML line: ${lines[i].text}`);
      i++;
      result[match[1]] = value(match[2], indent);
    }
    return result;
  }

  function list(indent) {
    const result = [];
    while (i < lines.length && lines[i].indent === indent && isItem(lines[i])) {
      const item = lines[i].text.slice(1).trimStart();
      if (item === "") {
        i++;
        result.push(
          lines[i] && lines[i].indent > indent ? block(lines[i].indent) : null,
        );
      } else if (
        KEY.test(item) &&
        !item.startsWith('"') &&
        !item.startsWith("'")
      ) {
        // A map item: its first key sits two columns right of the dash, like the keys below it.
        lines[i] = { indent: indent + 2, text: item };
        result.push(map(indent + 2));
      } else {
        i++;
        result.push(scalar(item));
      }
    }
    return result;
  }

  return lines.length ? block(lines[0].indent) : {};
}

export function parseFrontmatter(text) {
  const frontmatter = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
  return frontmatter === undefined ? null : parseYaml(frontmatter);
}

export function readConfig(workspace) {
  const file = join(workspace, ".zapper", "config.md");
  return existsSync(file) ? parseFrontmatter(readFileSync(file, "utf8")) : null;
}

export function getPath(object, path) {
  if (!path) return object;
  return path
    .split(".")
    .reduce((node, key) => (node == null ? undefined : node[key]), object);
}

function main() {
  const args = process.argv.slice(2);
  const lines = args.includes("--lines");
  const path = args.find((arg) => !arg.startsWith("--"));
  const workspace = findWorkspace(process.cwd(), process.cwd());
  const config = readConfig(workspace);
  if (config === null) {
    console.error(
      `No .zapper/config.md frontmatter under ${resolve(workspace)}.`,
    );
    return 1;
  }
  const value = getPath(config, path);
  if (value === undefined) {
    console.error(`${path} is not set in .zapper/config.md.`);
    return 1;
  }
  if (lines && Array.isArray(value)) {
    for (const item of value)
      console.log(typeof item === "string" ? item : JSON.stringify(item));
  } else if (value !== null && typeof value === "object")
    console.log(JSON.stringify(value, null, 2));
  else console.log(String(value ?? ""));
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  process.exit(main());
