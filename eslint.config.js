import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '.next/', 'out/', 'build/', '*.log'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // This is a small library; keep linting strict but not noisy.
      // Add/override rules here as needed.
    },
  },
  prettier,
];
