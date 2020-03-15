// const myConfig = require('./.eslintrc');

// const airbnbBaseConfig = require('eslint-config-airbnb-base');
// const utils = require('./packages/eslint/src/utils');

// console.log(convertExtends(require('@tunnckocore/eslint-config').extends));

/*

'eslint-config-airbnb-base/rules/best-practices',
'eslint-config-airbnb-base/rules/errors',
'eslint-config-airbnb-base/rules/node',
'eslint-config-airbnb-base/rules/style',
'eslint-config-airbnb-base/rules/variables',
'eslint-config-airbnb-base/rules/es6',
'eslint-config-airbnb-base/rules/imports',
'eslint-config-airbnb-base/rules/strict',

'plugin:prettier/recommended',
'prettier',
'@tunnckocore/eslint-config/mdx',
'@tunnckocore/eslint-config/jest',
'@tunnckocore/eslint-config/node',
'@tunnckocore/eslint-config/promise',
'plugin:promise/recommended',
'@tunnckocore/eslint-config/unicorn',
'plugin:unicorn/recommended',

*/

module.exports = [
  'eslint:recommended',
  require('eslint-config-airbnb-base/rules/best-practices'),
  require('eslint-config-airbnb-base/rules/errors'),
  require('eslint-config-airbnb-base/rules/node'),
  require('eslint-config-airbnb-base/rules/style'),
  require('eslint-config-airbnb-base/rules/variables'),
  require('eslint-config-airbnb-base/rules/es6'),
  require('eslint-config-airbnb-base/rules/imports'),
  require('eslint-config-airbnb-base/rules/strict'),
  {
    name: 'enabled-prettier',
    plugins: {
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      ...require('eslint-config-prettier').rules,
      'prettier/prettier': 'error',
    },
  },
  {
    name: 'tunnckocore-base-config',
    plugins: {
      'no-use-extend-native': require('eslint-plugin-no-use-extend-native'),
    },
    rules: require('@tunnckocore/eslint-config/base').rules,
  },
  // require('@tunnckocore/eslint-config/mdx'),
  // require('@tunnckocore/eslint-config/jest'),
  {
    name: 'node-plugin-and-rules',
    plugins: {
      node: require('eslint-plugin-node'),
    },
    rules: {
      'node/no-deprecated-api': 'error',
      'node/no-exports-assign': 'error',
      'node/no-unpublished-bin': 'error',

      // Redundant with import/no-extraneous-dependencies
      // 'node/no-extraneous-import': 'error',
      // 'node/no-extraneous-require': 'error',

      // Redundant with import/no-unresolved
      // 'node/no-missing-import': 'error',
      // 'node/no-missing-require': 'error',

      'node/no-unsupported-features/es-builtins': 'error',
      'node/no-unsupported-features/es-syntax': 'off',
      'node/no-unsupported-features/node-builtins': 'error',
      'no-process-exit': 'off',
      'node/process-exit-as-throw': 'error',
      'node/shebang': 'error',

      'node/exports-style': 'off',
      'node/file-extension-in-import': [
        'error',
        'never',
        {
          '.css': 'always',
          '.scss': 'always',
          '.sass': 'always',
          '.less': 'always',
          '.json': 'always',
        },
      ],
      'node/prefer-global/buffer': 'error',
      'node/prefer-global/console': 'error',
      'node/prefer-global/process': 'error',

      // These below will be enabled in XO when it targets Node.js 10
      'node/prefer-global/text-decoder': 'error',
      'node/prefer-global/text-encoder': 'error',
      'node/prefer-global/url-search-params': 'error',
      'node/prefer-global/url': 'error',
      'node/prefer-promises/dns': 'error',
      'node/prefer-promises/fs': 'error',
    },
  },
  {
    name: 'promise-plugin-and-rules',
    plugins: {
      promise: require('eslint-plugin-promise'),
    },
    rules: {
      ...require('eslint-plugin-promise').configs.recommended.rules,

      // These below are to ensure not changes
      // inside upstream XO and the plugin:promise/recommended configs
      'promise/catch-or-return': 'off',
      'promise/always-return': 'off',
      'promise/no-native': 'off',
      'promise/no-nesting': 'off',
      'promise/no-promise-in-callback': 'off',
      'promise/no-callback-in-promise': 'off',
      'promise/avoid-new': 'off',
      'promise/prefer-await-to-then': 'error',
      'promise/prefer-await-to-callbacks': 'error',

      // These are the same as in XO CLI, but they are not in the eslint-config-xo
      'promise/no-return-wrap': ['error', { allowReject: true }],
      'promise/param-names': 'error',
      'promise/no-new-statics': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/valid-params': 'error',
    },
  },
  {
    name: 'unicorn-plugin-and-rules',
    plugins: {
      unicorn: require('eslint-plugin-unicorn'),
    },
    rules: {
      ...require('eslint-plugin-unicorn').configs.recommended.rules,

      // It is too much annoyance for me. It's a good thing, but generally
      // after so many years we already name things properly,
      // so please don't mess with me and don't correct me.
      'unicorn/prevent-abbreviations': 'off',

      // These below are intentional & explicit overrides of XO and Unicorn

      // ! needed for `unicorn/no-unreadable-array-destructuring`
      'prefer-destructuring': ['error', { object: true, array: false }],
      'unicorn/no-unreadable-array-destructuring': 'error', // default in recommended

      'unicorn/no-unused-properties': 'error',
      // Disallow unsafe regular expressions.
      // Don't allow potential catastrophic crashes, slow behaving and downtimes.
      // You still can disable that and do whatever you want,
      // but that will be explicit and visible.
      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/no-unsafe-regex.md
      'unicorn/no-unsafe-regex': 'error',

      // Enforce importing index files with `.` instead of `./index`. (fixable)
      // But we should be explicit. We know it is working without that,
      // but at least it is good for newcomers.
      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/import-index.md
      'unicorn/import-index': 'off',

      // Enforce proper Error subclassing. (fixable)
      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/custom-error-definition.md
      'unicorn/custom-error-definition': 'error',

      // Pretty useful rule, but it depends.
      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/filename-case.md
      'unicorn/filename-case': 'off',

      // It is pretty common to name it `err`, and there is almost no reason to be any other.
      // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/catch-error-name.md
      'unicorn/catch-error-name': ['error', { name: 'err' }],

      // Doesn't work well in node-land. We have `.on/.off` emitters in Nodejs.
      'unicorn/prefer-add-event-listener': 'off',
      'unicorn/no-process-exit': 'error',
    },
  },
  {
    parser: 'babel-eslint',
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    settings: require('@tunnckocore/eslint-config/settings'),
  },
].concat({
  name: 'lint-sources',
  files: 'packages/*/src/**/*.js',

  rules: {
    'import/no-unresolved': 'off',
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
    // strict: ['error', 'always'],
  },
});
// module.exports = utils.createItemsFromExtends(myConfig.extends).concat({
//   name: 'lint-sources',
//   files: 'packages/*/src/**/*.js',
//   ...myConfig,
//   // rules: {
//   //   ...myConfig.rules,
//   //   'import/no-unresolved': 'off',
//   //   'import/no-dynamic-require': 'off',
//   //   'global-require': 'off',
//   // },
// });

// module.exports = [
//   // {
//   //   files: 'packages/*/src/**/*.js',
//   //   plugins: {
//   //     unicorn: require('eslint-plugin-unicorn'),
//   //     'custom-plugin': require('./custom-eslint-plugin'),
//   //   },
//   //   languageOptions: {
//   //     // directly requiring the parser
//   //     // parser: require('babel-eslint'),

//   //     // or: through the loaded plugin
//   //     parser: 'custom-plugin/eslint-esnext',
//   //     ecmaVersion: 2020,
//   //     sourceType: 'module',
//   //   },
//   //   rules: {
//   //     ...require('eslint-config-airbnb').rules,
//   //     'unicorn/no-process-exit': ['error'],
//   //     'unicorn/consistent-function-scoping': 'off',
//   //     semi: 'error',
//   //   },
//   // },
//   // {
//   //   files: '**/__tests__/**/*.{js,jsx}',
//   //   plugins: {
//   //     unicorn: require('eslint-plugin-unicorn'),
//   //     'custom-plugin': require('./custom-eslint-plugin'),
//   //     react: require('eslint-plugin-react'),
//   //   },
//   //   languageOptions: {
//   //     // directly requiring the parser
//   //     // parser: require('babel-eslint'),

//   //     // or: through the loaded plugin
//   //     parser: 'custom-plugin/eslint-esnext',
//   //     ecmaVersion: 2020,
//   //     sourceType: 'module',
//   //   },
//   //   rules: {
//   //     ...require('eslint-config-airbnb').rules,
//   //     'unicorn/no-process-exit': ['error'],
//   //     'unicorn/consistent-function-scoping': 'off',
//   //     semi: 'error',
//   //     'react/jsx-uses-react': 'error',
//   //     'global-require': 'error',
//   //   },
//   // },
//   {
//     name: 'loading-babel-eslint-parser-through-custom-plugin',
//     plugins: {
//       'custom-plugin': require('./custom-eslint-plugin'),
//     },
//   },

//   // example using the custom loaded parser
//   {
//     name: 'use-parser-from-custom-plugin',
//     plugins: {
//       baw: require('eslint-plugin-import'),
//     },
//     languageOptions: {
//       globals: {
//         qwqwqw: true,
//       },
//       // directly requiring the parser
//       // parser: require('babel-eslint'),

//       // or: through the loaded plugin
//       parser: 'custom-plugin/eslint-esnext',
//     },
//   },
//   {
//     name: 'lint-sources',
//     files: 'packages/*/src/**/*.js',
//     ...myConfig,
//   },
//   {
//     name: 'lang-options',
//     languageOptions: {
//       ecmaVersion: 2020,
//       sourceType: 'commonjs',
//     },
//   },
//   {
//     name: 'lint-tests',
//     files: '**/__tests__/**/*.{js,jsx}',
//     ...myConfig,
//     // {
//     //   plugins: {
//     //     react: require('eslint-plugin-react'),
//     //   },
//     //   rules: {
//     //     'react/jsx-uses-react': 'error',
//     //     'global-require': 'error',
//     //   },
//     // },
//   },
// ];
