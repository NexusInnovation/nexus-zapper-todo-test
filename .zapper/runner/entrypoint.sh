#!/usr/bin/env bash
# Zapper runner entrypoint: prepares the workspace, then launches `/goal` unattended.
# Inputs (environment, set by Start-ZapperRun.ps1 or `docker run`):
#   ZAPPER_REPOSITORY  HTTPS clone URL, or a mounted local repository path (local test)
#   ZAPPER_BASE_REF    branch the run starts from (holds the approved artifacts)
#   ZAPPER_BRANCH      feature branch of the run (created or resumed, never the default branch)
#   ZAPPER_RUN_ID      run identifier; outputs go to $ZAPPER_OUTPUT/$ZAPPER_RUN_ID
#   ZAPPER_MODE        goal (default) or preflight (everything except /goal, plus a Copilot smoke test)
#   ZAPPER_MODEL, ZAPPER_MAX_AI_CREDITS, ZAPPER_OUTPUT (default /mnt/zapper)
#   COPILOT_GITHUB_TOKEN, GIT_TOKEN, and the variables of `runner.env` and `runner.secrets`
set -euo pipefail

log() { printf '[zapper-runner %(%H:%M:%S)T] %s\n' -1 "$*"; }
fail() { log "ERROR: $*"; exit 2; }

: "${ZAPPER_REPOSITORY:?}" "${ZAPPER_BASE_REF:?}" "${ZAPPER_BRANCH:?}" "${ZAPPER_RUN_ID:?}"
: "${COPILOT_GITHUB_TOKEN:?COPILOT_GITHUB_TOKEN is required}"
MODE="${ZAPPER_MODE:-goal}"
OUT="${ZAPPER_OUTPUT:-/mnt/zapper}/${ZAPPER_RUN_ID}"
REPO=/workspace/repo
mkdir -p "$OUT/logs"
exec > >(tee -a "$OUT/runner.log") 2>&1

# Git credentials live in a private file so GIT_TOKEN can be hidden from the agent's shell.
git config --global user.name "Zapper runner"
git config --global user.email "zapper-runner@users.noreply.github.com"
git config --global init.defaultBranch main
if [ -n "${GIT_TOKEN:-}" ] && [[ "$ZAPPER_REPOSITORY" == https://* ]]; then
  host="$(printf '%s' "$ZAPPER_REPOSITORY" | sed -E 's#https://([^/]+)/.*#\1#')"
  umask 077
  printf 'https://x-access-token:%s@%s\n' "$GIT_TOKEN" "$host" > /root/.git-credentials
  umask 022
  git config --global credential.helper store
fi
unset GIT_TOKEN

finish() {
  local status=$?
  set +e
  if [ -d "$REPO/.git" ]; then
    cd "$REPO"
    if [ "$MODE" = "goal" ] && [ "$(git branch --show-current)" = "$ZAPPER_BRANCH" ]; then
      [ -n "$(git status --porcelain)" ] && log "Uncommitted changes left by the run (kept in the output copy, not committed)."
      git push origin "$ZAPPER_BRANCH" >/dev/null 2>&1 && log "Pushed $ZAPPER_BRANCH." || log "Nothing pushed (no remote access or nothing new)."
    fi
    git status --porcelain > "$OUT/git-status.txt"
    git log --oneline "origin/$ZAPPER_BASE_REF..HEAD" > "$OUT/commits.txt" 2>/dev/null
    rsync -a --exclude hooks.log.jsonl .zapper/run/ "$OUT/run/" 2>/dev/null
    [ -f .zapper/run/hooks.log.jsonl ] && cp .zapper/run/hooks.log.jsonl "$OUT/run/"
  fi
  [ -d /root/.copilot/session-state ] && rsync -a /root/.copilot/session-state/ "$OUT/session-state/"
  log "Finished with exit code $status. Outputs: $OUT"
  printf '%s\n' "$status" > "$OUT/exit-code"
  exit "$status"
}
trap finish EXIT

log "Run $ZAPPER_RUN_ID ($MODE): $ZAPPER_BASE_REF -> $ZAPPER_BRANCH"
if [ -d "$ZAPPER_REPOSITORY/.git" ]; then
  # Local test: copy the mounted working tree (tracked and untracked, not ignored) with its history.
  mkdir -p "$REPO"
  git config --global --add safe.directory "$ZAPPER_REPOSITORY"
  (cd "$ZAPPER_REPOSITORY" && git ls-files -co --exclude-standard -z | rsync -a --from0 --files-from=- ./ "$REPO/")
  rsync -a "$ZAPPER_REPOSITORY/.git/" "$REPO/.git/"
  git config --global --add safe.directory "$REPO"
  cd "$REPO"
  git remote set-url origin "$ZAPPER_REPOSITORY" 2>/dev/null || git remote add origin "$ZAPPER_REPOSITORY"
else
  git clone --no-tags --branch "$ZAPPER_BASE_REF" "$ZAPPER_REPOSITORY" "$REPO"
  cd "$REPO"
fi

config() { node .zapper/scripts/zapper-config.mjs "$@"; }
default_branch="$(config default-branch)" || fail ".zapper/config.md is missing on $ZAPPER_BASE_REF."
[ "$ZAPPER_BRANCH" = "$default_branch" ] && fail "The run branch must not be the default branch ($default_branch)."
if git ls-remote --exit-code --heads origin "$ZAPPER_BRANCH" >/dev/null 2>&1; then
  git fetch origin "$ZAPPER_BRANCH" && git switch "$ZAPPER_BRANCH" 2>/dev/null || git switch -c "$ZAPPER_BRANCH" --track "origin/$ZAPPER_BRANCH"
  log "Resuming the existing branch $ZAPPER_BRANCH."
else
  git switch -c "$ZAPPER_BRANCH"
fi

ready="$(config runner.ready 2>/dev/null || true)"
if [ -n "$ready" ] && [ "$ready" != "none" ]; then
  log "Waiting for the sidecars: $ready"
  for attempt in $(seq 1 60); do
    bash -c "$ready" >/dev/null 2>&1 && break
    [ "$attempt" = 60 ] && fail "The sidecars are not ready after 5 minutes."
    sleep 5
  done
fi

while IFS= read -r step; do
  [ -z "$step" ] && continue
  log "Setup: $step"
  bash -c "$step" || fail "Setup step failed: $step"
done < <(config runner.setup --lines 2>/dev/null || true)

log "Approval gate (rows 1 to 5 of workspace-check-zapper)."
gate_status=0
node .zapper/scripts/goal-gate.mjs preflight || gate_status=$?

model="${ZAPPER_MODEL:-auto}"
common=(--plugin-dir .zapper --trust-folder --allow-all --no-ask-user --no-auto-update
        --secret-env-vars GIT_TOKEN --log-dir "$OUT/logs")

if [ "$MODE" = "preflight" ]; then
  log "Copilot CLI smoke test (authentication, model access, plugin)."
  copilot "${common[@]}" --model "${ZAPPER_SMOKE_MODEL:-claude-haiku-4.5}" -p "Reply with the single word OK." --share "$OUT/preflight-session.md"
  log "Preflight done. Gate status: $gate_status (0 = ready for /goal)."
  exit 0
fi

[ "$gate_status" = 0 ] || fail "The approval gate refuses the run; see above. Run workspace-check-zapper locally."
cap="${ZAPPER_MAX_AI_CREDITS:-$(config runner.max-ai-credits)}"
log "Launching /goal (model $model, soft cap $cap AI credits)."
copilot "${common[@]}" --model "$model" --share "$OUT/session.md" \
  -p "/goal Achieve the objective of .zapper/goal.md --max-ai-credits $cap"
