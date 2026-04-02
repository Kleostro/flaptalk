#!/usr/bin/env bash

set -euo pipefail

is_branch_checkout="${3:-0}"

if [ "$is_branch_checkout" != "1" ]; then
  exit 0
fi

current_branch="$(git branch --show-current)"

if [ -z "$current_branch" ]; then
  exit 0
fi

reflog_subject="$(git reflog show --format=%gs -n 1 "refs/heads/$current_branch" 2>/dev/null || true)"
reflog_count="$(git reflog show --format=%gs "refs/heads/$current_branch" 2>/dev/null | wc -l | tr -d ' ')"

if [[ "$reflog_subject" != branch:\ Created\ from* ]]; then
  exit 0
fi

if [ "${reflog_count:-0}" != "1" ]; then
  exit 0
fi

if node ./scripts/validate-branch-scope.cjs --branch "$current_branch" --source working-tree; then
  exit 0
fi

previous_branch="$(git rev-parse --abbrev-ref @{-1} 2>/dev/null || true)"

if [ -n "$previous_branch" ] && [ "$previous_branch" != "@{-1}" ] && [ "$previous_branch" != "$current_branch" ]; then
  git checkout "$previous_branch" >/dev/null 2>&1 || true
fi

git branch -D "$current_branch" >/dev/null 2>&1 || true

echo "Branch creation was reverted because the branch name does not match the detected scope."
exit 1
