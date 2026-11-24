# Gather input

Collects the raw input through the conversation and fetches its content into the system temporary
folder. Nothing is written to `.zapper/input/` here.

## 1. Ask for the sources

Unless the user already listed them, ask what the input is. Raw input can be any mix of:

- Tracker work items or queries (stories, features, epics; for example Azure DevOps, GitHub
  Issues or Jira), including the images embedded in their description, acceptance criteria and
  comments
- Architecture diagrams
- Mockup images
- A vibe-coded prototype (path or URL)
- A partial existing codebase (path)
- Feedback from a later stage, for example a rejected output report or a question raised while
  writing BDD scenarios or the plan

In the **Update** flow, start by showing the **Origin** lines of the existing stories as a
reminder, and ask what changed.

## 2. Fetch each source

For every source, in this order:

1. **Use a tool already available in the session** that fits the source: a skill, an MCP server,
   a CLI (`az`, `gh`, …), the browser or file reads.
2. **If none fits, ask the user** how to get it.
3. **If the user does not know**, write a small fetch script and run it.

Everything fetched (text, images, page renders of a PDF, scripts, scratch files) is stored in a
`zapper-gather` folder inside the system temporary folder, never in the repository (not in
`.zapper/input/` nor in `.zapper/run/`). It is the only place gather writes to: the distill step
copies what the input needs into the final `assets/` folders. These files are disposable and never
referenced from `.zapper/input/`.

Per source type:

| Source               | What to bring back                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Work items           | Title, description, acceptance criteria, relevant comments, and **every embedded image as a file**     |
| Images and diagrams  | The files themselves                                                                                   |
| Prototype            | The screens and flows; a screenshot of each relevant screen and state, taken with a browser tool       |
| Codebase             | Structure, conventions and the behaviour relevant to the scope; file paths to link, never copied code |
| Stage feedback       | Each rejection reason or question, with what it points at                                              |

Text with images stripped out is incomplete: when an embedded image cannot be fetched, say so and
ask the user for it instead of continuing without it.

## 3. Confirm what was gathered

Before distilling, give the user a short summary: each source, what was fetched, and anything that
failed or was skipped. Ask whether anything is missing. Do not dump raw content into the chat.
