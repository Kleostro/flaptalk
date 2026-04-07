#!/usr/bin/env bash

set -euo pipefail

./node_modules/.bin/commitlint --edit "$1"
