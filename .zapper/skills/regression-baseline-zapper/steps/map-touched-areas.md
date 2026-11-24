# Map touched areas

Finds the existing behaviour the scope touches and cuts it into areas. It is a bounded audit: stop
once every touched behaviour belongs to an area. Nothing is written to `.zapper/` here.

## Working notes

Keep notes in a unique, session-scoped temporary folder, never in the repository: the candidate
areas with their entry points. They are disposable and never referenced from the baseline.

## 1. What the scope changes

Read `.zapper/input/scope.md`, `architecture.md` and every story of `.zapper/input/stories/`, and
the requirement tags and scenario names of `.zapper/behaviour-driven-development/`. Note, per
story, the screens, flows, endpoints, modules, data and shared components it modifies, extends or
removes. The BDD suite only tells new behaviour from existing behaviour: it is not a source of
areas.

## 2. Where it lives today

Locate each of them in the codebase with the available code intelligence, then search. Also
follow the shared code one level: a component, endpoint, contract, schema or module the scope
changes is a touchpoint of every existing behaviour that consumes it.

- Behaviour that already exists at `HEAD` is in scope for the baseline.
- Behaviour that does not exist yet is new: the BDD suite covers it, not this stage.
- Behaviour the scope deliberately replaces is recorded under **Changed by the scope**, with its
  requirement IDs. It is not protected by a scenario: its existing tests may be updated during the
  run.

When the repository has nothing that matches (empty repository, greenfield), say so: the baseline
has no area. Record that in the walkthrough instead of inventing areas.

## 3. Cut into areas

- One area per cohesive behaviour a person can name: a screen or flow, an endpoint family, a
  module capability, a job. Not per file, not per story: two stories touching the same screen share
  one area.
- Split an area that would need more than about ten scenarios or spans unrelated behaviours;
  merge areas that always change together.
- Stop at what is observable. Internal helpers belong to the area that exposes them.
- On an update, match each area with the existing `inventory.md` by meaning: it keeps its ID.
  Only an area that matches none is new.

## 4. Open questions

List what the code does not settle (an entry point that is ambiguous, a behaviour nobody can
describe, a shared component with many consumers). Raise them in the [walkthrough](walkthrough.md),
never guess.
