#!/usr/bin/env bash
# Populates a .joshbot/ folder with randomly named demo customization files.
# Usage: ./seed-customizations.sh [target-dir]
#   target-dir defaults to the current directory.

set -e

TARGET="${1:-.}"
BASE="$TARGET/.joshbot"

mkdir -p "$BASE/agents" "$BASE/skills" "$BASE/instructions" "$BASE/prompts"

ADJECTIVES=(clever swift brave quiet calm sharp bold keen cool wise)
NOUNS=(falcon raven otter badger condor heron panda cobra lemur crane)

pick() { local arr=("$@"); echo "${arr[$RANDOM % ${#arr[@]}]}"; }
name() { echo "$(pick "${ADJECTIVES[@]}")-$(pick "${NOUNS[@]}")"; }

# Agents
for i in $(seq 1 3); do
  N=$(name)
  cat > "$BASE/agents/$N.agent.md" <<EOF
---
description: Agent $N — a demo agent created by seed script
tools:
  - codebase
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
description: Skill $N — a demo skill created by seed script
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
description: Instructions for $N
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
description: Prompt $N
---

Hey assistant, please $N the code for me.
EOF
done

echo "Seeded .joshbot/ in $TARGET with:"
echo "  $(ls "$BASE/agents" | wc -l | tr -d ' ') agents"
echo "  $(ls "$BASE/skills" | wc -l | tr -d ' ') skills"
echo "  $(ls "$BASE/instructions" | wc -l | tr -d ' ') instructions"
echo "  $(ls "$BASE/prompts" | wc -l | tr -d ' ') prompts"
