# Results: Non-functional: Accessibility

Run: 2026-11-25T04:06:59Z · Command: `pnpm --dir src/frontend bdd`

| Requirement | Scenarios | Status |
| ----------- | --------- | ------ |
| nfr-accessibility-R01 | 6 | passed |

Manual scenarios (excluded from the run command by `not @manual`, not run):
- Audit WCAG 2.1 AA manuel: an automated scan covers only part of WCAG 2.1 AA; reading order, label relevance and screen reader output need a human audit with NVDA or VoiceOver and the WCAG 2.1 AA checklist.
