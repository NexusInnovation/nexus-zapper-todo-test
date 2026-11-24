---
status: draft
---

# Implementation plan

High-level plan of this Zapper generation, maintained by the `plan-implementation-zapper` skill.
Once approved, the plan is read-only to agents: change it through the skill, which sets the status
back to `draft` first.

Sources: [refined input](../../input/README.md) ·
[BDD suite](../../behaviour-driven-development/README.md) · [decisions](decisions.md)

## Overview

<How the solution is put together in a few sentences: the main building blocks, how they talk to
each other and the main flows. Add a Mermaid diagram only when it helps.>

## Building blocks

In implementation order: a block comes after every block it depends on. Blocks whose dependencies
are done can be implemented in parallel.

| #   | Block                                        | Depends on | Requirements                     | Hypotheses |
| --- | -------------------------------------------- | ---------- | -------------------------------- | ---------- |
| 1   | [<Block name>](<block-slug>/<block-slug>.md) | —          | <story-key>-R01, <story-key>-R02 | <count>    |
