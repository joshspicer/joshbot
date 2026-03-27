#!/usr/bin/env bash
# Populates .joshbot/ folders with randomly named demo customization files.
# Usage: ./seed-customizations.sh [--force] [target-dir]
#   target-dir defaults to the current directory.
#   --force: delete existing .joshbot/ folders before seeding.
#
# Seeds both:
#   <target-dir>/.joshbot/  (workspace-level)
#   ~/.joshbot/             (user-level)

set -e

FORCE=false
TARGET="."

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    *) TARGET="$arg" ;;
  esac
done

WORKSPACE_BASE="$TARGET/.joshbot"
USER_BASE="$HOME/.joshbot"

# ── Clean ──────────────────────────────────────────────────────────────
for BASE in "$WORKSPACE_BASE" "$USER_BASE"; do
  if [ -d "$BASE" ]; then
    if [ "$FORCE" = true ]; then
      echo "Removing existing $BASE..."
      rm -rf "$BASE"
    else
      echo "Error: $BASE already exists. Use --force to delete and re-seed." >&2
      exit 1
    fi
  fi
done

ADJECTIVES=(clever swift brave quiet calm sharp bold keen cool wise)
NOUNS=(falcon raven otter badger condor heron panda cobra lemur crane)

pick() { local arr=("$@"); echo "${arr[$RANDOM % ${#arr[@]}]}"; }
name() { echo "$(pick "${ADJECTIVES[@]}")-$(pick "${NOUNS[@]}")"; }

# ── Seed workspace .joshbot/ ───────────────────────────────────────────
seed_dir() {
  local BASE="$1"
  local LABEL="$2"

  mkdir -p "$BASE/agents" "$BASE/skills" "$BASE/instructions" "$BASE/prompts"

  # Agents
  for i in $(seq 1 3); do
    N=$(name)
    cat > "$BASE/agents/$N.agent.md" <<EOF
---
description: Agent $N — a $LABEL agent
tools:
  - search/codebase
---

You are **$N**, a helpful coding agent.
EOF
  done

  # Skills
  for i in $(seq 1 2); do
    N=$(name)
    mkdir -p "$BASE/skills/$N"
    cat > "$BASE/skills/$N/SKILL.md" <<EOF
---
name: $N
description: Skill $N — a $LABEL skill
---

# $N

This skill does amazing things.
EOF
  done

  # Instructions
  for i in $(seq 1 3); do
    N=$(name)
    cat > "$BASE/instructions/$N.instructions.md" <<EOF
---
description: Instructions for $N ($LABEL)
applyTo: "**/*.ts"
---

When working on TypeScript files, remember the $N guidelines.
EOF
  done

  # Prompts
  for i in $(seq 1 2); do
    N=$(name)
    cat > "$BASE/prompts/$N.prompt.md" <<EOF
---
description: Prompt $N ($LABEL)
---

Hey assistant, please $N the code for me.
EOF
  done

  echo "Seeded $BASE ($LABEL) with:"
  echo "  $(ls "$BASE/agents" | wc -l | tr -d ' ') agents"
  echo "  $(ls "$BASE/skills" | wc -l | tr -d ' ') skills"
  echo "  $(ls "$BASE/instructions" | wc -l | tr -d ' ') instructions"
  echo "  $(ls "$BASE/prompts" | wc -l | tr -d ' ') prompts"
}

seed_dir "$WORKSPACE_BASE" "workspace"
seed_dir "$USER_BASE" "user"
