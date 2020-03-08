'use strict';

// module.exports = {
//   name: "name",
//   files: ["*.js"],
//   ignores: ["*.test.js"],
//   settings: {},
//   languageOptions: {
//       ecmaVersion: 2020,
//       sourceType: "module",
//       globals: {},
//       parser: object || "string",
//       parserOptions: {},
//       linterOptions: {
//           reportUnusedDisableDirectives: "string"
//       }
//   }
//   processor: object || "string",
//   plugins: {}
//   rules: {}
// };

const {
  DEFAULT_FILES,
  DEFAULT_IGNORE,
} = require('./packages/eslint/src/constants');

module.exports = [
  /*
    gets converted to

    {
      plugins: {
        'eslint:recommended': require('somehow-load-eslint-internal-rules')
      }
    }
   */
  // 'eslint:recommended',
  {
    name: 'loading-babel-eslint-parser-through-custom-plugin',
    plugins: {
      'custom-plugin': require('./custom-eslint-plugin'),
    },
  },

  // consider linting src/index.jsx - both configs should apply for it
  // so, what will the ConfigArray#getConfig(filename) return??
  {
    files: '**/*.{js,jsx}',
    plugins: {
      unicorn: require('eslint-plugin-unicorn'),
    },
    rules: {
      'unicorn/no-process-exit': ['error'],
      'unicorn/consistent-function-scoping': 'error',
      semi: 'error',
    },
  },
  {
    files: '**/*.jsx',
    plugins: {
      react: require('eslint-plugin-react'),
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'global-require': 'error',
    },
  },

  {
    name: 'some-tunnckocore-config',
    files: DEFAULT_FILES,
    ignores: DEFAULT_IGNORE,
    languageOptions: {
      globals: {},
      // directly requiring the parser
      // parser: require('babel-eslint'),

      // or: through the loaded plugin
      parser: 'custom-plugin/eslint-esnext',

      // or require-ing of the plugin directly
      // parser: require('./custom-eslint-plugin').parsers['eslint-esnext'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          generators: false,
          objectLiteralDuplicateProperties: false,
        },
      },
    },
    plugins: {},
    rules: {
      semi: ['error', 'always'],
      'global-require': ['error', 'always'],
    },
  },
];
