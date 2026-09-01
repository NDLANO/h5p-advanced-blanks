import eslintConfigNdlaH5P from 'eslint-config-ndla-h5p';
// eslint-disable-next-line import/no-extraneous-dependencies
import eslint from '@eslint/js';
// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.json.d.ts'],
  },

  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigNdlaH5P.configs['flat/recommended'],

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
