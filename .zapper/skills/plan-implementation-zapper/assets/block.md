# <Block name>

## Purpose

<One or two sentences: the responsibility of the block. In a child file, start with "Part of
[<Block name>](<block-slug>.md).">

## Requirements

- <story-key>-R01, <story-key>-R02

## Scenarios

Write the step definitions of these scenarios, reusing the shared steps of the BDD runner block, and
run them by tag until they pass.

- [<story-slug>.feature](../../../behaviour-driven-development/stories/<story-slug>/<story-slug>.feature):
  `@<story-key>-R01`

## Depends on

- [BDD runner](../bdd-runner/bdd-runner.md)
- [<Block name>](../<block-slug>/<block-slug>.md)

## Contracts and invariants

- <Required behavior and shared inputs/outputs/errors owned here; consumers link here.>
- <Contract consumed from another block, by link; do not redefine it.>
- <Leave internal decomposition to the implementer.>

## Non-functional strategy

- nfr-<category>-R01: <How the design satisfies it: paging and filtering strategy, indexes, the
  mechanism that guarantees the property, and where it is verified. Link the contract defined in
  its owning block. Remove this section when the block covers no non-functional requirement.>

## Touchpoints

### Modules and components

- <Module or component>: <what changes; suggest principal existing entry points, not a file inventory>

### Frontend pages

- <Page> (`<route>`): <what is added or changed>

### API endpoints

| Method   | Route     | Parameters                   | Response | Purpose   |
| -------- | --------- | ---------------------------- | -------- | --------- |
| <METHOD> | `<route>` | <name: type, where it is in> | <shape>  | <purpose> |

### Data

| Entity or table | Access                 | Source system                       |
| --------------- | ---------------------- | ----------------------------------- |
| <Name>          | <read, write, created> | <new, existing, legacy or external> |

### Integrations

- <External system>: <what is exchanged and how it is reached>

### Configuration

- <Setting>: <where it lives and what it controls>

## Conventions and references

- Skill `<project-skill>`: <what it governs in this block>
- [<Doc or code path>](relative-path): <why it matters, for example the feature to model on>
- [D01](../decisions.md): <what the decision imposes here>

## Completion evidence

- <Owned scenarios and focused regression/contract checks; no test code or file inventory>

## Children

- [<Child name>](<child-slug>.md)

## Hypotheses

[hypotheses.md](hypotheses.md): <key>-H01. Implement the assumed answer and add its TODO at the
specified rule placement.
