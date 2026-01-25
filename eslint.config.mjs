// @ts-check

import url from 'node:url';
import eslint from '@eslint/js';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import storybookPlugin from 'eslint-plugin-storybook';
import prettierConfig from 'eslint-config-prettier';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default tseslint.config(
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react': reactPlugin,
    },
  },

  // global ignores
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/fixtures/**',
    '**/__snapshots__/**',
    '**/coverage/**',
    '**/_data/**',
    '**/generated/**',
    '**/storybook-static/**',
    '**/.next/**',
    '**/migrations/**',
    '**/*.d.ts',
    '**/jest.config.js',
    '**/.storybook/**',
    '**/.docusaurus/**',
    '**/reports/**'
  ]),

  // extends
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,

  //
  // base config
  //
  {
    languageOptions: {
      parserOptions: {
        allowAutomaticSingleRunInference: true,
        project: ['tsconfig.json', 'tsconfig.react.json', 'packages/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
        warnOnUnsupportedTypeScriptVersion: true,
      },
    },
    rules: {

      'no-console': 'off',
      semi: ['error', 'always'],
      'logical-assignment-operators': 'error',
      'no-else-return': 'off',
      'no-process-exit': 'off',
      'no-fallthrough': ['error', { commentPattern: '.*intentional fallthrough.*' }],
      'no-implicit-coercion': ['error', { boolean: false }],
      'no-lonely-if': 'error',
      'no-unreachable-loop': 'error',
      'no-useless-call': 'error',
      'no-useless-computed-key': 'off',
      'no-useless-escape': 'off',
      'no-useless-concat': 'error',
      'no-var': 'error',
      'no-void': ['error', { allowAsStatement: true }],
      'one-var': ['error', 'never'],
      'operator-assignment': 'error',
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      'prefer-rest-params': 'error',

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'all',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['arrowFunctions'],
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      // turn off other type-aware rules
      'no-undef': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },


  // config for storybook
  {
    files: ['**/*.stories.tsx'],
    extends: [
      storybookPlugin.configs['flat/recommended']
    ],
  },

  // config for tests
  {
    files: ['**/*.test.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    }
  },

  // config for react packages
  {
    files: ['packages/lib-components/**/*.{ts,tsx,mts,cts,js,jsx}', 'packages/web-main/**/*.{ts,tsx,mts,cts,js,jsx}'],
    extends: [
      reactPlugin.configs.flat.recommended,
    ],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

);
