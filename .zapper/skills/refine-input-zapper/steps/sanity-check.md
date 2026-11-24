# Sanity check

Final pass over the whole of `.zapper/input/`, run after every item was walked through and before
asking for approval. Corrections made during the walkthrough can leave contradictions, orphan
files or overlapping stories behind; this pass finds them. Fix what you find, then report what
changed.

## 1. Consistency

- Re-read every file. No two files, and no two stories, contradict each other (scope, rules,
  values, labels).
- `scope.md`, `architecture.md` and `non-functional-requirements.md` still match the stories after
  the corrections: an item moved out of scope appears in no criterion, and every dependency named
  in a story is reflected in the scope.
- Every answer given during the walkthrough was applied everywhere it matters, not only in the
  file being reviewed when it was given.

## 2. Story scope overlap

- Each user goal and each behaviour is owned by one story only. When two stories touch the same
  screen, each criterion states which story delivers it and which one only shows it (for example a
  control that is displayed disabled in one story and enabled in another).
- Every behaviour a story mentions as delivered by another story has a matching criterion in that
  other story.
- Criteria are not duplicated between stories. A story that grew past about 10 criteria was
  offered a split, and the answer is recorded.

## 3. Assets

- Every image linked by a story exists in that story's `assets/`, and every file in `assets/` is
  linked by its story: delete unused files.
- Each asset is relevant to its story. Remove images that belong to another story, are out of
  scope, are redundant, or are outdated by a newer source (for example a screen superseded by the
  latest design).
- A mockup needed by two stories is copied into both; a story never links outside its own folder.
- Nothing refers to scratch files, fetch scripts or other temporary material, and no such file
  was left in the repository.

## 4. Hypotheses and counts

- Every remaining hypothesis states why it is open; those the team settled were turned into facts
  and removed.
- The open hypotheses counts in `README.md` match the story files, and the **Stories** table lists
  every story with its current title and link.
- Open questions that the walkthrough produced for the plan stage are in `architecture.md`.

## 5. Report

Tell the user what the pass changed (files edited, assets removed or added, contradictions
resolved) and anything it could not settle, then ask for the approval.
