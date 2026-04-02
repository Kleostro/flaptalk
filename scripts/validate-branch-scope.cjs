#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

const BRANCH_PATTERN =
  /^(ci|chore|docs|feat|fix|perf|refactor|style|test)\/(FT|FTB|FTW)-0[1-9]-\d{2}\/[a-z_]+$/;
const ALLOWED_STATIC_BRANCHES = new Set(['main', 'develop']);
const ALLOWED_BRANCH_PREFIXES = ['sprint-'];

function parseArgs(argv) {
  const args = {
    branch: '',
    files: [],
    base: '',
    head: 'HEAD',
    source: 'diff',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--branch') {
      args.branch = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (arg === '--files') {
      args.files = (argv[index + 1] ?? '')
        .split(',')
        .map((file) => file.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (arg === '--base') {
      args.base = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (arg === '--head') {
      args.head = argv[index + 1] ?? 'HEAD';
      index += 1;
      continue;
    }

    if (arg === '--source') {
      args.source = argv[index + 1] ?? 'diff';
      index += 1;
    }
  }

  return args;
}

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function getCurrentBranch() {
  return runGit(['branch', '--show-current']);
}

function getDiffFiles(range) {
  const diff = runGit(['diff', '--name-only', range]);
  return diff
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function getBaseCandidates() {
  return ['origin/develop', 'develop', 'origin/main', 'main'];
}

function resolveRevision(candidate) {
  try {
    return runGit(['rev-parse', '--verify', candidate]);
  } catch {
    return '';
  }
}

function getMergeBase(base, head) {
  try {
    return runGit(['merge-base', base, head]);
  } catch {
    return '';
  }
}

function getBranchBaseRef(head) {
  const candidates = getBaseCandidates();

  for (const candidate of candidates) {
    const resolvedBase = resolveRevision(candidate);

    if (!resolvedBase) {
      continue;
    }

    const mergeBase = getMergeBase(candidate, head);

    if (mergeBase) {
      return mergeBase;
    }
  }

  return '';
}

function getChangedFiles(base, head) {
  if (base) {
    const mergeBase = getMergeBase(base, head) || resolveRevision(base);

    if (!mergeBase) {
      return [];
    }

    return getDiffFiles(`${mergeBase}...${head}`);
  }

  const branchBase = getBranchBaseRef(head);

  if (!branchBase) {
    return [];
  }

  return getDiffFiles(`${branchBase}...${head}`);
}

function getWorkingTreeFiles() {
  const files = new Set();
  const commands = [
    ['diff', '--name-only', '--cached'],
    ['diff', '--name-only'],
    ['ls-files', '--others', '--exclude-standard'],
  ];

  for (const command of commands) {
    const output = runGit(command);

    for (const file of output
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)) {
      files.add(file);
    }
  }

  return [...files];
}

function getRequiredPrefix(files) {
  const hasApiChanges = files.some((file) => file.startsWith('apps/api/'));
  const hasWebChanges = files.some((file) => file.startsWith('apps/web/'));
  const hasProjectWideChanges = files.some(
    (file) => !file.startsWith('apps/api/') && !file.startsWith('apps/web/'),
  );

  if (hasProjectWideChanges || (hasApiChanges && hasWebChanges) || !files.length) {
    return 'FT';
  }

  if (hasApiChanges) {
    return 'FTB';
  }

  if (hasWebChanges) {
    return 'FTW';
  }

  return 'FT';
}

function isBranchNameValid(branch, requiredPrefix) {
  if (
    ALLOWED_STATIC_BRANCHES.has(branch) ||
    ALLOWED_BRANCH_PREFIXES.some((prefix) => branch.startsWith(prefix))
  ) {
    return {
      valid: true,
      reason: '',
    };
  }

  if (!BRANCH_PATTERN.test(branch)) {
    return {
      valid: false,
      reason:
        'Branch name must match "<type>/<prefix>-<sprint>-<task>/<description>", for example "feat/FTB-01-03/add_users_endpoint".',
    };
  }

  const [prefix] = branch.split('/')[1].split('-');

  if (prefix !== requiredPrefix) {
    return {
      valid: false,
      reason: `Branch prefix "${prefix}" does not match required prefix "${requiredPrefix}" for the changed files.`,
    };
  }

  return {
    valid: true,
    reason: '',
  };
}

function main() {
  const {
    branch: branchArg,
    files: fileArgs,
    base,
    head,
    source,
  } = parseArgs(process.argv.slice(2));

  const branch = branchArg || process.env.GITHUB_HEAD_REF || getCurrentBranch();
  const files = fileArgs.length
    ? fileArgs
    : source === 'working-tree'
      ? getWorkingTreeFiles()
      : getChangedFiles(base, head);

  if (source === 'working-tree' && !files.length) {
    console.log('Branch validation skipped.');
    console.log(`Branch: ${branch}`);
    console.log('No local changes detected, so required prefix cannot be inferred yet.');
    return;
  }

  const requiredPrefix = getRequiredPrefix(files);
  const result = isBranchNameValid(branch, requiredPrefix);

  if (!result.valid) {
    console.error('Branch validation failed.');
    console.error(`Branch: ${branch}`);
    console.error(`Required prefix: ${requiredPrefix}`);
    console.error(`Files: ${files.length ? files.join(', ') : '(not detected)'}`);
    console.error(result.reason);
    process.exit(1);
  }

  console.log('Branch validation passed.');
  console.log(`Branch: ${branch}`);
  console.log(`Required prefix: ${requiredPrefix}`);
}

main();
