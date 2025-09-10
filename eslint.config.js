import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    languageOptions: {
      ...c.languageOptions,
      parserOptions: {
        ...c.languageOptions?.parserOptions,
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),
  {
    plugins: { astro },
    files: ['**/*.astro'],
    languageOptions: {
      parser: astro.parsers['.astro'],
      ecmaVersion: 'latest',
    },
    rules: {},
  },
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
