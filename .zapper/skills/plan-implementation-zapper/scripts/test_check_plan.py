"""Regression tests for the portable plan checker; no project dependencies."""

from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

from check_plan import check, requirement_ids, Report


class PlanCheckerTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory(prefix="zapper-plan-check-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.plan = self.root / ".zapper" / "run" / "plan"
        self.feature = (
            self.root / ".zapper" / "behaviour-driven-development" / "stories"
            / "cart" / "cart.feature"
        )
        self.write(self.feature, """# language: fr
Fonctionnalité: Panier
  # @cart-R99 is not an active tag
  @cart-R01 @cart-R02
  Scénario: Ajouter
    Alors le panier contient le produit
""")
        self.write(self.plan / "README.md", """---
status: draft
---
# Implementation plan
## Building blocks
| # | Block | Depends on | Requirements | Hypotheses |
| --- | --- | --- | --- | --- |
| 1 | [BDD](bdd-runner/bdd-runner.md) | — | none | 0 |
| 2 | [Cart](cart/cart.md) | 1 | cart-R01…cart-R02 | 1 |
""")
        self.write(self.plan / "decisions.md", """# Decisions
## D01: Session
- **Status**: approved
- **Category**: scope
- **Approval**: Reviewer, 2026-11-12
""")
        self.write(self.plan / "bdd-runner" / "bdd-runner.md", """# BDD runner
## Purpose
Run the suite.
## Requirements
None.
## Depends on
None.
## Contracts and invariants
Owns the runner.
## Touchpoints
Existing test infrastructure.
## Completion evidence
Run contract exists.
""")
        self.write(self.plan / "cart" / "cart.md", """# Cart
## Purpose
Add products.
## Requirements
cart-R01…cart-R02
## Scenarios
[Cart](../../../behaviour-driven-development/stories/cart/cart.feature):
`@cart-R01`, `@cart-R02`
## Depends on
[BDD](../bdd-runner/bdd-runner.md)
## Contracts and invariants
Cart owns quantities; D01 applies.
## Touchpoints
Existing product page.
## Completion evidence
Owned scenarios pass.
## Hypotheses
[Hypotheses](hypotheses.md): cart-H01. Add its TODO at the rule placement.
""")
        self.write(self.plan / "cart" / "hypotheses.md", """# Hypotheses
## cart-H01: Limit
- **Marker**: `TODO(cart-H01): Assumed 10 units. Confirm with the PO.`
- **Where**: quantity rule.
""")

    def write(self, path, text):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def change(self, relative, old, new):
        path = self.plan / relative
        text = path.read_text(encoding="utf-8")
        self.assertIn(old, text)
        self.write(path, text.replace(old, new))

    def assert_error(self, expected):
        report = check(self.root)
        self.assertTrue(any(expected in error for error in report.errors), report.errors)
        return report

    def test_valid_plan_is_read_only(self):
        before = {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        report = check(self.root)
        self.assertEqual([], report.errors)
        self.assertEqual([], report.warnings)
        self.assertEqual(before, {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()})

    def test_missing_sources_are_errors(self):
        self.feature.unlink()
        self.assert_error("No feature sources")

    def test_relocated_features_follow_features_path(self):
        moved = self.root / "tests" / "features" / "cart.feature"
        self.write(moved, self.feature.read_text(encoding="utf-8"))
        self.feature.unlink()
        self.write(
            self.root / ".zapper" / "behaviour-driven-development" / "README.md",
            "---\nstatus: approved\nfeatures-path: tests/features   # moved by the runner\n---\n",
        )
        self.change(
            "cart/cart.md",
            "../../../behaviour-driven-development/stories/cart/cart.feature",
            "../../../../tests/features/cart.feature",
        )
        self.assertEqual([], check(self.root).errors)

    def test_missing_plan_is_error(self):
        with TemporaryDirectory(prefix="zapper-empty-") as root:
            self.assertTrue(check(Path(root)).errors)

    def test_requirement_ranges_and_non_numeric_keys(self):
        report = Report()
        self.assertEqual(
            {"shopping-cart-R01", "shopping-cart-R02", "shopping-cart-R03"},
            requirement_ids("shopping-cart-R01...shopping-cart-R03", report, "test"),
        )
        requirement_ids("cart-R03…cart-R01", report, "test")
        requirement_ids("cart-R01…other-R02", report, "test")
        self.assertEqual(2, len(report.errors))

    def test_missing_coverage_and_unknown_requirement(self):
        self.change("cart/cart.md", "cart-R01…cart-R02", "cart-R01, cart-R03")
        self.assert_error("Requirement coverage: missing=['cart-R02'], unknown=['cart-R03']")
        self.assert_error("index coverage differs")

    def add_nfr_block(self, strategy):
        self.write(
            self.root / ".zapper" / "behaviour-driven-development" / "stories"
            / "nfr-performance" / "nfr-performance.feature",
            "Feature: Performance\n  @nfr-performance-R01\n  Scenario: Fast list\n"
            "    Then the list loads in 2 seconds\n",
        )
        path = self.plan / "README.md"
        self.write(path, path.read_text(encoding="utf-8")
                   + "| 3 | [Perf](perf/perf.md) | 1 | nfr-performance-R01 | 0 |\n")
        self.write(self.plan / "perf" / "perf.md", f"""# Perf
## Purpose
Keep lists fast.
## Requirements
nfr-performance-R01
## Scenarios
[Perf](../../../behaviour-driven-development/stories/nfr-performance/nfr-performance.feature):
`@nfr-performance-R01`
## Depends on
[BDD](../bdd-runner/bdd-runner.md)
## Contracts and invariants
Lists are paged on the server.
{strategy}## Touchpoints
Existing list endpoint.
## Completion evidence
Owned scenarios pass.
""")
        self.write(self.plan / "perf" / "hypotheses.md", "# Hypotheses\n")

    def test_nfr_requirement_needs_a_strategy(self):
        self.add_nfr_block("")
        self.assert_error("Non-functional strategy does not address nfr-performance-R01")

    def test_nfr_strategy_must_name_the_requirement(self):
        self.add_nfr_block("## Non-functional strategy\nPaging and an index.\n")
        self.assert_error("Non-functional strategy does not address nfr-performance-R01")

    def test_nfr_strategy_addresses_the_requirement(self):
        self.add_nfr_block(
            "## Non-functional strategy\nnfr-performance-R01: server-side paging, index on title.\n"
        )
        self.assertEqual([], check(self.root).errors)

    def test_missing_scenario_owner(self):
        self.change("cart/cart.md", "`@cart-R01`, `@cart-R02`", "`@cart-R01`")
        self.assert_error("cart-R02: expected one scenario owner, got []")

    def test_scenario_owner_must_link_feature(self):
        self.change(
            "cart/cart.md",
            "[Cart](../../../behaviour-driven-development/stories/cart/cart.feature):",
            "Cart:",
        )
        self.assert_error("missing feature link for owned tag cart-R01")

    def test_scenario_ranges_are_not_explicit_tags(self):
        self.change("cart/cart.md", "`@cart-R01`, `@cart-R02`", "`@cart-R01` to `@cart-R02`")
        self.assert_error("must list explicit owned tags")

    def test_duplicate_scenario_owner(self):
        self.change("bdd-runner/bdd-runner.md", "## Depends on",
                    "## Scenarios\n`@cart-R01`\n## Depends on")
        self.assert_error("expected one scenario owner, got ['bdd-runner', 'cart']")

    def test_split_scenario_tag_group(self):
        text = (self.plan / "README.md").read_text(encoding="utf-8")
        text += "| 3 | [Other](other/other.md) | 1 | cart-R02 | 0 |\n"
        self.write(self.plan / "README.md", text)
        other = (self.plan / "cart" / "cart.md").read_text(encoding="utf-8")
        other = other.replace("cart-R01…cart-R02", "cart-R02")
        other = other.replace("`@cart-R01`, `@cart-R02`", "`@cart-R02`")
        other = other.split("## Hypotheses")[0]
        self.write(self.plan / "other" / "other.md", other)
        self.change("cart/cart.md", "`@cart-R01`, `@cart-R02`", "`@cart-R01`")
        self.assert_error("different owners")

    def test_unknown_dependency(self):
        self.change("README.md", "| 1 | cart-R01", "| 9 | cart-R01")
        self.assert_error("unknown dependency 9")

    def test_cycle_and_order(self):
        self.change("README.md", "| — | none", "| 2 | none")
        self.assert_error("Dependency cycle")
        self.assert_error("must precede")

    def test_dependency_links_must_match(self):
        self.change("cart/cart.md", "[BDD](../bdd-runner/bdd-runner.md)", "None.")
        self.assert_error("dependency links differ")

    def test_requirement_block_needs_runner(self):
        self.change("README.md", "| 1 | cart-R01", "| — | cart-R01")
        self.assert_error("missing bdd-runner dependency")

    def test_broken_and_encoded_local_links(self):
        target = self.root / "source file.md"
        self.write(target, "# Source")
        path = self.plan / "cart" / "cart.md"
        text = path.read_text(encoding="utf-8")
        self.write(path, text + "\n[Source](../../../../source%20file.md#heading)\n")
        self.assertEqual([], check(self.root).errors)
        target.unlink()
        self.assert_error("broken local link")

    def test_planned_project_link_is_only_a_warning(self):
        path = self.plan / "cart" / "cart.md"
        self.write(path, path.read_text(encoding="utf-8")
                   + "\n[Future](../../../../src/new.py) (planned)\n")
        report = check(self.root)
        self.assertEqual([], report.errors)
        self.assertTrue(any("not verified" in warning for warning in report.warnings))

    def test_planned_link_cannot_hide_missing_plan_or_escape_workspace(self):
        path = self.plan / "cart" / "cart.md"
        self.write(path, path.read_text(encoding="utf-8")
                   + "\n[Missing](missing.md) (planned)\n"
                   + "[Outside](../../../../../outside.py) (planned)\n")
        report = self.assert_error("planned link must target")
        self.assertEqual(2, len([e for e in report.errors if "planned link" in e]))

    def test_planned_link_cannot_excuse_missing_source(self):
        path = self.plan / "cart" / "cart.md"
        self.write(path, path.read_text(encoding="utf-8")
                   + "\n[Input](../../../input/missing.md) (planned)\n")
        self.assert_error("planned link must target")

    def test_child_requires_index_and_backlink(self):
        self.write(self.plan / "cart" / "contract.md", "# Contract\n")
        self.assert_error("not listed under Children")
        self.assert_error("has no parent link")
        path = self.plan / "cart" / "cart.md"
        self.write(path, path.read_text(encoding="utf-8")
                   + "\n## Children\n[Contract](contract.md)\n")
        self.write(self.plan / "cart" / "contract.md", "# Contract\n[Cart](cart.md)\n")
        self.assertEqual([], check(self.root).errors)

    def test_extra_root_file_and_nested_folder(self):
        self.write(self.plan / "notes.md", "# Notes")
        self.write(self.plan / "cart" / "nested" / "file.md", "# Nested")
        self.assert_error("Unexpected plan entry: notes.md")
        self.assert_error("unexpected child nested")

    def test_hypothesis_counts_markers_and_references(self):
        self.change("cart/hypotheses.md", "TODO(cart-H01)", "TODO(cart-H02)")
        self.assert_error("missing/mismatched TODO")
        self.assert_error("unknown hypothesis cart-H02")
        self.change("README.md", "| 1 |\n", "| 2 |\n")
        self.assert_error("hypothesis count differs")

    def test_duplicate_hypothesis_ids(self):
        path = self.plan / "cart" / "hypotheses.md"
        self.write(path, path.read_text(encoding="utf-8") * 2)
        self.assert_error("Duplicate hypothesis ID cart-H01")

    def test_unknown_decision_and_unresolved_placeholder(self):
        self.change("cart/cart.md", "D01 applies.", "D02 applies. NEW-1")
        self.assert_error("unknown decision D02")
        self.assert_error("unresolved NEW-ID")

    def test_decision_status_and_approval(self):
        self.change("decisions.md", "approved", "proposed")
        self.change("decisions.md", "Reviewer, 2026-11-12", "")
        self.assert_error("not approved/rejected")
        self.assert_error("missing approver and ISO date")

    def test_date_alone_is_not_an_approver(self):
        self.change("decisions.md", "Reviewer, 2026-11-12", "2026-11-12")
        self.assert_error("missing approver and ISO date")

    def test_invalid_calendar_date(self):
        self.change("decisions.md", "2026-11-12", "2026-13-40")
        self.assert_error("invalid approval date")

    def test_rejected_decision_cannot_be_consumed(self):
        self.change("decisions.md", "approved", "rejected")
        self.assert_error("reference to unapproved/unknown decision D01")

    def test_decision_category_must_be_known(self):
        self.change("decisions.md", "Category**: scope", "Category**: <architecture | scope>")
        self.assert_error("unknown Category <architecture | scope>")

    def test_decision_without_category_or_scope_only_warns(self):
        self.change("decisions.md", "- **Category**: scope\n", "")
        report = check(self.root)
        self.assertEqual([], report.errors)
        self.assertTrue(any("D01: missing Category" in w for w in report.warnings))
        self.assertTrue(any("no approved decision with Category scope" in w for w in report.warnings))

    def test_rejected_decision_does_not_cover_the_scope(self):
        self.change("decisions.md", "approved", "rejected")
        report = check(self.root)
        self.assertTrue(any("no approved decision with Category scope" in w for w in report.warnings))

    def test_duplicate_block_numbers_and_slugs(self):
        path = self.plan / "README.md"
        self.write(path, path.read_text(encoding="utf-8")
                   + "| 2 | [Cart](cart/cart.md) | 1 | cart-R01…cart-R02 | 1 |\n")
        self.assert_error("Duplicate block numbers")
        self.assert_error("Duplicate block slugs")

    def test_size_target_warns_without_failing(self):
        path = self.plan / "cart" / "cart.md"
        self.write(path, path.read_text(encoding="utf-8") + "\n" * 151)
        report = check(self.root)
        self.assertEqual([], report.errors)
        self.assertTrue(any("justify essential contracts" in w for w in report.warnings))

    def test_cli_exit_codes_and_unreadable_input(self):
        script = Path(__file__).with_name("check_plan.py")
        valid = subprocess.run(
            [sys.executable, str(script), "--workspace", str(self.root)],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(0, valid.returncode, valid.stdout + valid.stderr)
        self.assertIn("0 error(s)", valid.stdout)
        self.feature.write_bytes(b"\xff")
        invalid = subprocess.run(
            [sys.executable, str(script), "--workspace", str(self.root)],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(1, invalid.returncode)
        self.assertIn("ERROR: Cannot validate plan", invalid.stdout)
        self.assertNotIn("Traceback", invalid.stderr)


if __name__ == "__main__":
    unittest.main()
