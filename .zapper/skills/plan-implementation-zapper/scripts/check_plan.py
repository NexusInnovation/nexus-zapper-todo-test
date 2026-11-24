"""Read-only mechanical validation of the portable Zapper plan format."""

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit


KEY = r"[a-z0-9]+(?:-[a-z0-9]+)*"
REQ = rf"{KEY}-R\d{{2}}"
HYP = rf"{KEY}-H\d{{2}}"
LINK = re.compile(r"(?<!!)\[[^\]\n]+\]\((<[^>\n]+>|[^)\s]+)\)")
RANGE = re.compile(rf"\b({REQ})(?:\s*(?:…|\.\.\.|–|\bto\b)\s*({REQ}))?")
DECISION_CATEGORIES = {
    "architecture", "dependency", "schema-contract", "data-access", "security", "infra", "scope",
}


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def require(self, condition: bool, message: str) -> None:
        if not condition:
            self.errors.append(message)


@dataclass
class Block:
    number: int
    slug: str
    path: Path
    dependencies: set[int]
    requirements: set[str]
    hypothesis_count: int


def section(text: str, heading: str) -> str:
    match = re.search(
        rf"^## {re.escape(heading)}\s*\n(.*?)(?=^## |\Z)", text, re.M | re.S
    )
    return match.group(1) if match else ""


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def requirement_ids(text: str, report: Report, label: str) -> set[str]:
    result = set()
    for match in RANGE.finditer(text):
        first, last = match.groups()
        if not last:
            result.add(first)
            continue
        prefix, start = first.rsplit("-R", 1)
        end_prefix, end = last.rsplit("-R", 1)
        if prefix != end_prefix or int(start) > int(end):
            report.errors.append(f"{label}: invalid requirement range {match.group(0)}")
            continue
        result.update(f"{prefix}-R{number:02}" for number in range(int(start), int(end) + 1))
    return result


def local_links(path: Path, text: str):
    for match in LINK.finditer(text):
        target = match.group(1).strip("<>")
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        line_end = text.find("\n", match.end())
        tail = text[match.end():line_end if line_end != -1 else len(text)]
        planned = bool(re.match(r"\s+\(planned\)(?:\s|$)", tail))
        yield (path.parent / unquote(parsed.path)).resolve(), planned


def feature_groups(path: Path) -> list[set[str]]:
    groups = []
    pending: set[str] = set()
    for line in read(path).splitlines() + [""]:
        stripped = line.strip()
        if stripped.startswith("@"):
            pending.update(re.findall(rf"@({REQ})\b", stripped.split("#", 1)[0]))
        elif stripped and not stripped.startswith("#"):
            if pending:
                groups.append(pending)
                pending = set()
    if pending:
        groups.append(pending)
    return groups


def features_path(workspace: Path) -> Path:
    """Folder of the .feature files: `features-path` of the BDD README, else `stories`."""
    suite = workspace / ".zapper" / "behaviour-driven-development"
    readme = suite / "README.md"
    if readme.is_file():
        frontmatter = re.match(r"\A---\s*\n(.*?)\n---", read(readme), re.S)
        value = re.search(
            r"^features-path:[ \t]*([^\s#][^\n#]*?)[ \t]*(?:#[^\n]*)?$",
            frontmatter.group(1) if frontmatter else "", re.M,
        )
        if value:
            return (workspace / value.group(1).strip("\"'")).resolve()
    return suite / "stories"


def check(workspace: Path) -> Report:
    workspace = workspace.resolve()
    plan = workspace / ".zapper" / "run" / "plan"
    suite = features_path(workspace)
    report = Report()
    for path in (plan / "README.md", plan / "decisions.md"):
        report.require(path.is_file(), f"Missing required file: {path}")
    features = sorted(suite.rglob("*.feature"))
    report.require(bool(features), f"No feature sources in {suite}")
    if report.errors:
        return report

    source_groups = {path.resolve(): feature_groups(path) for path in features}
    groups = [group for feature in source_groups.values() for group in feature]
    source_ids = set().union(*groups) if groups else set()
    report.require(bool(source_ids), "Feature sources contain no requirement tags")
    documents = {path.resolve(): read(path) for path in plan.rglob("*.md")}
    index = documents[(plan / "README.md").resolve()]
    status = re.match(r"\A---\s*\nstatus: (draft|approved)\s*\n", index)
    report.require(bool(status), "README.md: missing draft/approved frontmatter status")

    blocks = []
    for line in section(index, "Building blocks").splitlines():
        if not re.match(r"^\|\s*\d+\s*\|", line):
            continue
        cells = [cell.strip() for cell in re.split(r"(?<!\\)\|", line.strip())[1:-1]]
        if len(cells) != 5:
            report.errors.append(f"README.md: expected five cells in block row: {line}")
            continue
        number, name, dependencies, requirements, count = cells
        link = LINK.search(name)
        if not link or not count.isdigit():
            report.errors.append(f"README.md: invalid block link or hypothesis count: {line}")
            continue
        target = link.group(1).strip("<>")
        slug = Path(target).parent.name
        report.require(
            target == f"{slug}/{slug}.md" and bool(re.fullmatch(KEY, slug)),
            f"README.md: invalid block path {target}",
        )
        report.require(
            bool(re.fullmatch(r"(?:\d+(?:\s*,\s*\d+)*|—|-|none)", dependencies)),
            f"{slug}: dependencies must be block numbers, comma separated, or —",
        )
        blocks.append(Block(
            int(number), slug, (plan / target).resolve(),
            {int(value) for value in re.findall(r"\d+", dependencies)},
            requirement_ids(requirements, report, slug), int(count),
        ))

    report.require(bool(blocks), "README.md: no building block rows")
    numbers = Counter(block.number for block in blocks)
    slugs = Counter(block.slug for block in blocks)
    report.require(all(n == 1 for n in numbers.values()), "Duplicate block numbers")
    report.require(all(n == 1 for n in slugs.values()), "Duplicate block slugs")
    report.require(
        bool(blocks) and blocks[0].slug == "bdd-runner", "bdd-runner must be the first block"
    )
    known_paths = {block.path for block in blocks}
    for item in plan.iterdir():
        if item.name == ".gitkeep":
            continue
        report.require(
            item.name in ("README.md", "decisions.md") if item.is_file()
            else item.name in slugs,
            f"Unexpected plan entry: {item.name}",
        )
    graph = {block.number: block.dependencies for block in blocks}
    positions = {block.number: i for i, block in enumerate(blocks)}
    for block in blocks:
        for dependency in block.dependencies:
            report.require(dependency in graph, f"{block.slug}: unknown dependency {dependency}")
            report.require(
                positions.get(dependency, len(blocks)) < positions[block.number],
                f"{block.slug}: dependency {dependency} must precede its consumer",
            )
    visiting, visited = set(), set()

    def visit(number: int) -> None:
        if number in visiting:
            report.errors.append(f"Dependency cycle involving block {number}")
            return
        if number in visited:
            return
        visiting.add(number)
        for dependency in graph.get(number, set()):
            if dependency in graph:
                visit(dependency)
        visiting.remove(number)
        visited.add(number)

    for number in graph:
        visit(number)

    owners: dict[str, list[str]] = defaultdict(list)
    coverage: set[str] = set()
    for block in blocks:
        text = documents.get(block.path)
        if text is None:
            report.errors.append(f"{block.slug}: missing principal block file")
            continue
        for heading in ("Purpose", "Requirements", "Depends on", "Contracts and invariants",
                        "Touchpoints", "Completion evidence"):
            report.require(bool(section(text, heading)), f"{block.slug}: missing {heading}")
        covered = requirement_ids(section(text, "Requirements"), report, block.slug)
        coverage.update(covered)
        report.require(covered == block.requirements, f"{block.slug}: index coverage differs")
        strategy = section(text, "Non-functional strategy")
        for requirement in sorted(r for r in covered if r.startswith("nfr-")):
            report.require(
                requirement in requirement_ids(strategy, report, block.slug),
                f"{block.slug}: Non-functional strategy does not address {requirement}",
            )
        scenarios = section(text, "Scenarios")
        owned = set(re.findall(rf"@({REQ})\b", scenarios))
        report.require(
            not re.search(rf"@{REQ}`?\s*(?:…|\.\.\.|–|\bto\b)\s*`?@?{REQ}", scenarios),
            f"{block.slug}: Scenarios must list explicit owned tags, not ranges",
        )
        report.require(owned <= covered, f"{block.slug}: owns tags outside its Requirements")
        scenario_links = {path for path, planned in local_links(block.path, scenarios) if not planned}
        for requirement in owned:
            report.require(
                any(path in scenario_links and any(requirement in group for group in feature)
                    for path, feature in source_groups.items()),
                f"{block.slug}: missing feature link for owned tag {requirement}",
            )
        if covered:
            report.require(
                any(b.slug == "bdd-runner" and b.number in block.dependencies for b in blocks),
                f"{block.slug}: missing bdd-runner dependency",
            )
        if block.slug == "bdd-runner":
            report.require(not covered and not owned, "bdd-runner must not own requirements")
        for requirement in owned:
            owners[requirement].append(block.slug)
        dependencies = {
            path for path, _ in local_links(block.path, section(text, "Depends on"))
            if path in known_paths
        }
        expected = {b.path for b in blocks if b.number in block.dependencies}
        report.require(dependencies == expected, f"{block.slug}: dependency links differ from index")
        lines = len(text.splitlines())
        if lines > 150:
            report.warnings.append(f"{block.slug}: {lines} lines; justify essential contracts")
        for child in block.path.parent.iterdir():
            if child.name in (block.path.name, "hypotheses.md"):
                continue
            report.require(child.is_file() and child.suffix == ".md",
                           f"{block.slug}: unexpected child {child.name}")
            if child.is_file() and child.suffix == ".md":
                child = child.resolve()
                report.require(
                    child in {p for p, _ in local_links(block.path, section(text, "Children"))},
                    f"{block.slug}: child {child.name} is not listed under Children",
                )
                report.require(
                    block.path in {p for p, _ in local_links(child, documents[child])},
                    f"{block.slug}: child {child.name} has no parent link",
                )

    report.require(coverage == source_ids,
                   f"Requirement coverage: missing={sorted(source_ids - coverage)}, "
                   f"unknown={sorted(coverage - source_ids)}")
    for requirement in sorted(source_ids | owners.keys()):
        report.require(len(owners[requirement]) == 1,
                       f"{requirement}: expected one scenario owner, got {owners[requirement]}")
    for group in groups:
        group_owners = {owner for requirement in group for owner in owners[requirement]}
        report.require(len(group_owners) == 1,
                       f"Tags sharing a feature tag group have different owners: {sorted(group)}")

    hypotheses: dict[str, Path] = {}
    for block in blocks:
        path = (block.path.parent / "hypotheses.md").resolve()
        text = documents.get(path, "")
        entries = list(re.finditer(rf"^## ({HYP}):[^\n]*", text, re.M))
        report.require(len(entries) == block.hypothesis_count,
                       f"{block.slug}: hypothesis count differs from index")
        report.require(
            len(entries) == len(re.findall(r"^## ", text, re.M)),
            f"{block.slug}: invalid hypothesis heading/ID",
        )
        for i, entry in enumerate(entries):
            identifier = entry.group(1)
            body = text[entry.end():entries[i + 1].start() if i + 1 < len(entries) else len(text)]
            report.require(identifier not in hypotheses, f"Duplicate hypothesis ID {identifier}")
            hypotheses[identifier] = path
            markers = re.findall(r"TODO\(([^)]+)\):[^\n`]+", body)
            report.require(markers == [identifier], f"{identifier}: missing/mismatched TODO marker")
            report.require(bool(re.search(r"\*\*Marker\*\*:\s*\S", body)),
                           f"{identifier}: missing Marker field")
            report.require(bool(re.search(r"\*\*Where\*\*:\s*\S", body)),
                           f"{identifier}: missing code placement")

    decisions = documents[(plan / "decisions.md").resolve()]
    entries = list(re.finditer(r"^## (D\d{2}):[^\n]*", decisions, re.M))
    decision_states = {}
    categories = set()
    for i, entry in enumerate(entries):
        identifier = entry.group(1)
        body = decisions[entry.end():entries[i + 1].start() if i + 1 < len(entries) else len(decisions)]
        report.require(identifier not in decision_states, f"Duplicate decision ID {identifier}")
        state = re.search(r"\*\*Status\*\*:\s*(approved|rejected)\b", body)
        decision_states[identifier] = state.group(1) if state else "unresolved"
        report.require(bool(state), f"{identifier}: decision is not approved/rejected")
        category = re.search(r"\*\*Category\*\*:[ \t]*([^\s|][^\n]*?)[ \t]*$", body, re.M)
        if not category:
            report.warnings.append(f"{identifier}: missing Category")
        elif category.group(1) not in DECISION_CATEGORIES:
            report.errors.append(f"{identifier}: unknown Category {category.group(1)}")
        elif state and state.group(1) == "approved":
            categories.add(category.group(1))
        approval = re.search(
            r"\*\*Approval\*\*:[ \t]*(\S[^\n]*?)[ \t]+(\d{4}-\d{2}-\d{2})\b", body
        )
        report.require(bool(approval), f"{identifier}: missing approver and ISO date")
        if approval:
            try:
                date.fromisoformat(approval.group(2))
            except ValueError:
                report.errors.append(f"{identifier}: invalid approval date")
    report.require(len(entries) == len(re.findall(r"^## ", decisions, re.M)),
                   "decisions.md: invalid decision heading/ID")
    if "scope" not in categories:
        report.warnings.append("decisions.md: no approved decision with Category scope (screens, routes, modules in and out)")

    for path, text in documents.items():
        label = str(path.relative_to(plan))
        report.require(not re.search(r"\bNEW-\d+\b", text), f"{label}: unresolved NEW-ID")
        for identifier in set(re.findall(rf"\b({HYP})\b", text)):
            report.require(identifier in hypotheses, f"{label}: unknown hypothesis {identifier}")
        if path not in ((plan / "README.md").resolve(), (plan / "decisions.md").resolve()):
            for identifier in set(re.findall(r"\bD\d{2}\b", text)):
                report.require(decision_states.get(identifier) == "approved",
                               f"{label}: reference to unapproved/unknown decision {identifier}")
        for target, planned in local_links(path, text):
            if planned:
                source_roots = (
                    workspace / ".zapper" / "input",
                    workspace / ".zapper" / "behaviour-driven-development",
                )
                report.require(
                    target.is_relative_to(workspace) and not target.is_relative_to(plan)
                    and not any(target.is_relative_to(root) for root in source_roots),
                    f"{label}: planned link must target a project file outside the plan and sources",
                )
                report.warnings.append(f"{label}: declared future file (not verified): {target}")
            else:
                report.require(target.exists(), f"{label}: broken local link: {target}")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path.cwd())
    args = parser.parse_args()
    try:
        report = check(args.workspace)
    except (OSError, UnicodeError, ValueError) as error:
        print(f"ERROR: Cannot validate plan: {error}")
        return 1
    for error in report.errors:
        print(f"ERROR: {error}")
    for warning in report.warnings:
        print(f"WARNING: {warning}")
    print(f"Mechanical check: {len(report.errors)} error(s), {len(report.warnings)} warning(s).")
    print("Limits: no semantic validation, remote URLs, Markdown anchors or code feasibility checks.")
    return 1 if report.errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
