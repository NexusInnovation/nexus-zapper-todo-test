# Results: Non-functional: Performance

Run: 2026-11-25T04:06:59Z · Command: `pnpm --dir src/frontend bdd`

| Requirement | Scenarios | Status |
| ----------- | --------- | ------ |
| nfr-performance-R01 | 2 | passed |

Measured: first usable list after 329 ms on 100 000 Todos (threshold: < 2 000 ms). The value is printed by the run (`nfr-performance-R01: first usable list after … ms`); the Cucumber JSON does not carry it.
