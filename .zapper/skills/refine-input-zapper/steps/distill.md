# Distill

Turns the input gathered in the `zapper-gather` temporary folder (see
[gather-input.md](gather-input.md)) into the files of `.zapper/input/`. This step is the only one
that copies images and other assets into `.zapper/input/`. Read
[../references/input-layout.md](../references/input-layout.md) first: it is the contract for every
file written here. Start each new file from its template in [../assets/](../assets/), and use
[../references/example-story.md](../references/example-story.md) as the quality bar for stories.

## Content rules

- **Preserve existing changes.** The files may have been changed since the last run, by the team or
  by other agents. Start from their current content, keep those changes, and change only what the
  new input requires.
- **Never invent.** Write only what the input states or the team confirmed. Missing or ambiguous
  information becomes a question for the walkthrough; if it stays unanswered, it becomes a
  hypothesis in the affected story, or an open question in `architecture.md`.
- **Unbloated.** Each file holds only what later stages need. Link to large sources (code,
  documents) instead of copying them.
- **Snapshot, do not point.** Criteria are written out in full and mockups are copied into the
  story's `assets/`. The only exception is code, which is linked by path.
- **Code and prototypes: distill and reference.** Extract screens, flows and business rules into
  acceptance criteria, screenshot prototype screens into the story's `assets/`, record conventions
  in `architecture.md`, and link source paths.
- **Architecture: constraints only.** Record what the input imposes (stack, structure, conventions,
  integrations, diagrams). Never choose a technology or design a solution.

## Order

1. **Scope** (`scope.md`): the goal, what is in and out, and the starting point.
2. **Architecture** (`architecture.md`) and **non-functional requirements**
   (`non-functional-requirements.md`).
3. **Stories**, see below.
4. **Global assets**: copy project-wide diagrams, PDFs and other sources into `assets/` and link
   them from the files above.
5. **README.md**: update the stories table and the open hypotheses counts, and set
   `status: draft`.

## Stories

1. **Find the user goals.** One story per user goal. Split a source story that covers several
   distinct goals or screens; merge source stories that describe the same goal.
2. **Name the story** following the slug rule in the layout reference.
3. **Write the description**: the user story, plus only the context needed to read the criteria.
4. **Write the acceptance criteria**, the most important part. Each criterion:
   - describes one observable behaviour a test can check;
   - uses concrete values (labels, limits, messages) from the input;
   - avoids implementation detail unless the input imposes it;
   - has no ID and is not written in Gherkin.
5. **Copy the mockups** the story needs into its `assets/`, duplicating any image another story also
   uses.
6. **Add hypotheses** only for what the input leaves open, each with the reason it is open.
7. **Write the Origin line.**

When the input is large, distill one story per subagent: pass it the layout reference, the story
template, the example story and the input for that story only, and have it report the files it
wrote.
