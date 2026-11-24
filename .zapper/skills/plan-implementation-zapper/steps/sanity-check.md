# Cross-block sanity check (subagent)

One independent review pass after block drafting, before final approval. This is a coherence
check, not another implementation design or a second exhaustive code audit.

## Inputs and ownership

Use one reviewer agent that did not write the blocks, in a separate context. Use the configured
reviewer/model preference when available; do not assume a different agent means a different model
or silently override model settings. If delegation is unavailable, report the limitation and ask
how to proceed; do not claim independent review.

Pass the plan paths, scoped global constraints, approved decisions, requirement/scenario sources,
shared-contract owner map and mechanical-check findings. Do not pass full audit transcripts.
The reviewer reads the plan, then consults only the source passages needed to substantiate a finding.
It writes no plan files and does not approve decisions.

**Subagent prompt:**

> Perform one bounded cross-block sanity check. Find only material inconsistencies:
> - conflicting producer/consumer contracts, ownership gaps or missing dependencies;
> - duplicated responsibilities, fixtures or capabilities that should have a single owner;
> - requirements omitted, weakened or made unverifiable by an assumption;
> - unsafe assumptions about persistence, retries, byte identity or operation completion;
> - decisions or project constraints bypassed by a TODO or fallback.
> Suggest reuse or a shared capability only when it eliminates a concrete duplication; do not
> introduce speculative abstractions. Do not inventory implementation files, redesign local
> internals, re-audit the repository or comment on style.
> Return PASS or FINDINGS, each with affected blocks, evidence/reference, impact and the smallest
> correction or arbitration needed. State any unverified risk; stop after this pass.

## Integrate once

- The coordinator applies targeted corrections. Use the existing block writer for same-block
  follow-ups when useful; do not start a second set of writers or reviewers.
- A shared capability has one owner and one contract definition; consumers link to it. Do not
  automatically create a new block for every potential reuse.
- Reopen the human gate only for changes to approved responsibilities, dependencies, contracts,
  requirement ownership or decisions. Continue independent work while arbitration is pending.
- Run mechanical checks again after fixes. Verify the affected source passages only; do not start
  a review/perfection loop. If a material finding cannot be settled with bounded investigation,
  present it to the team and leave `status: draft`.
- Record the review outcome in the session and summarize it to the user. No new report file in
  the plan folder; final approval requires all material findings to be addressed.
