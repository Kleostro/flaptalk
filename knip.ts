process.env.DATABASE_URL ??= 'postgresql://knip:knip@localhost:5432/knip';

const config = {
  ignore: ['apps/api/src/generated/**', 'apps/web/types/eslint-plugin-import.d.ts'],
  ignoreDependencies: ['pg', 'bun-types', '@commitlint/cli', 'lint-staged', 'prettier'],
  rules: {
    exports: 'off',
  },
  workspaces: {
    '.': {
      entry: [
        'package.json',
        '.github/workflows/*.yml',
        '.husky/*',
        'scripts/**/*.cjs',
        'husky_scripts/**/*.sh',
      ],
    },
    'apps/api': {
      project: ['src/**/*.ts'],
    },
    'apps/web': {
      project: [
        'src/**/*.ts',
        'src/**/*.html',
        'src/**/*.scss',
        'eslint-rules/**/*.js',
        'types/**/*.d.ts',
      ],
    },
  },
};

export default config;
