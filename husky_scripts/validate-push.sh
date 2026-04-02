#!/usr/bin/env bash

set -euo pipefail

if node ./scripts/validate-branch-scope.cjs; then
  exit 0
fi

current_branch="$(git branch --show-current)"

echo ""
echo "Push was rejected because the branch name does not match the detected scope."
echo "Rename the branch and try again."
echo "Example:"
echo "git branch -m \"$current_branch\" \"fix/FTB-01-01/rename_me\""
exit 1
