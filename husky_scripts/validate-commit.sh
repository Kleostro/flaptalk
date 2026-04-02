#!/usr/bin/env bash

set -euo pipefail

./apps/web/node_modules/.bin/commitlint --edit "$1"
