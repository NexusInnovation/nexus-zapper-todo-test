---
name: refine-input-zapper
description: "Turns raw project input (tracker stories from Azure DevOps, GitHub Issues or Jira, mockups, architecture diagrams, a vibe-coded prototype, a partial codebase) into Zapper's refined input folder .zapper/input/: scope, architecture constraints, non-functional requirements and one folder per story with acceptance criteria and mockups. The team reviews it in a guided walkthrough; re-runs keep the changes made to the files.
  USE FOR: zapper refine input, prepare the input of a generation, refine raw input, update the refined input after new input or a rejected report, review or approve it, zapper stage 2.
  DO NOT USE FOR: refining a work item inside Azure DevOps (use `refine-nexus` instead), generating a project backlog or CSV from documents (use `create-high-level-backlog-apm` instead), writing BDD requirements or Gherkin scenarios, planning the implementation."
---

# Refine input (Zapper)

Produces and maintains `.zapper/input/`, the refined input every later Zapper stage reads. The
format of that folder is defined in [references/input-layout.md](references/input-layout.md);
templates live in [assets/](assets/) and a filled-in story in
[references/example-story.md](references/example-story.md).

## Available Operations

| Operation | Description                                                                     | Flow                               |
| --------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| Refine    | First run: build `.zapper/input/` from raw input, then walk the team through it | [flows/refine.md](flows/refine.md) |
| Update    | Re-run: fold new input or feedback into the existing input, keep prior changes  | [flows/update.md](flows/update.md) |
| Review    | Walk the team through the existing input and record its approval               | [flows/review.md](flows/review.md) |

## Shared Steps

| Step         | Description                                              | File                                           |
| ------------ | -------------------------------------------------------- | ---------------------------------------------- |
| Gather input | Conversational intake and fetching of the raw sources    | [steps/gather-input.md](steps/gather-input.md) |
| Distill      | Content rules and writing of the refined input files     | [steps/distill.md](steps/distill.md)           |
| Walkthrough  | Guided human review, corrections and the approval marker | [steps/walkthrough.md](steps/walkthrough.md)   |
| Sanity check | Final consistency, story overlap and asset pass before approval | [steps/sanity-check.md](steps/sanity-check.md) |

## Routing

If the intent is not clear from the request, look at `.zapper/input/`:

- Empty (nothing but `.gitkeep`) → **Refine**.
- Has content and the user brings new input or feedback → **Update**.
- Has content and the user only wants to review or approve it → **Review**.

When still ambiguous, ask: "Do you want to **refine** new input, **update** the existing refined
input, or **review** it?"
