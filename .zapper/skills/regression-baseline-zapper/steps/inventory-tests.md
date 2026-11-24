# Inventory tests

Finds the existing tests that cover each area and judges how much of the area they cover. Layout
and fields: [../references/baseline-layout.md](../references/baseline-layout.md).

## 1. Find the existing tests

For each area, search every level of the project's test pyramid from the entry points of the area:
unit, integration, API, end-to-end, and any existing Gherkin. Find the test locations from the
project itself (test projects, CI pipeline, package manifests, repository instructions).

Record each test by path and by what it asserts, in one line. Read the assertions: a file name that
mentions the area proves nothing.

Also record, per test location, how it is run (the command or the CI step) and whether it needs
infrastructure (a database, a browser, a running application). The
[wiring step](wire-and-verify.md) needs them to build the regression command.

## 2. Judge the coverage

| Verdict     | When                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| `covered`   | Existing tests assert the observable behaviour of the area, including the edge and error cases the code shows         |
| `partial`   | Existing tests assert some of the behaviour; say which part is not asserted                                           |
| `uncovered` | No existing test asserts the behaviour                                                                                |

- A test that only renders, smoke-checks or imports does not cover behaviour.
- A skipped, disabled or commented-out test covers nothing; list it with that remark.
- Judge the behaviour that stays unchanged. Behaviour listed under **Changed by the scope** is out
  of the verdict.
- Apply the same bar to every area. Do not mark an area `covered` to avoid writing scenarios, and
  do not mark it `uncovered` to avoid reading tests.

## 3. Output

Per area: the existing tests, the verdict with its one-line reason, and for `partial` and
`uncovered` the list of behaviours to describe, to hand to
[write-scenarios.md](write-scenarios.md).
