[ 'src/api.js' ]
{ cwd: '/home/charlike/github/hela/packages/eslint' }
import {
  rules: {
    'no-unresolved': { meta: [Object], create: [Function: create] },
    named: { meta: [Object], create: [Function: create] },
    default: { meta: [Object], create: [Function: create] },
    namespace: { meta: [Object], create: [Function: namespaceRule] },
    'no-namespace': { meta: [Object], create: [Function: create] },
    export: { meta: [Object], create: [Function: create] },
    'no-mutable-exports': { meta: [Object], create: [Function: create] },
    extensions: { meta: [Object], create: [Function: create] },
    'no-restricted-paths': { meta: [Object], create: [Function: noRestrictedPaths] },
    'no-internal-modules': { meta: [Object], create: [Function: noReachingInside] },
    'group-exports': { meta: [Object], create: [Function: create] },
    'no-relative-parent-imports': { meta: [Object], create: [Function: noRelativePackages] },
    'no-self-import': { meta: [Object], create: [Function: create] },
    'no-cycle': { meta: [Object], create: [Function: create] },
    'no-named-default': { meta: [Object], create: [Function: create] },
    'no-named-as-default': { meta: [Object], create: [Function: create] },
    'no-named-as-default-member': { meta: [Object], create: [Function: create] },
    'no-anonymous-default-export': { meta: [Object], create: [Function: create] },
    'no-unused-modules': { meta: [Object], create: [Function: create] },
    'no-commonjs': { meta: [Object], create: [Function: create] },
    'no-amd': { meta: [Object], create: [Function: create] },
    'no-duplicates': { meta: [Object], create: [Function: create] },
    first: { meta: [Object], create: [Function: create] },
    'max-dependencies': { meta: [Object], create: [Function: create] },
    'no-extraneous-dependencies': { meta: [Object], create: [Function: create] },
    'no-absolute-path': { meta: [Object], create: [Function: create] },
    'no-nodejs-modules': { meta: [Object], create: [Function: create] },
    'no-webpack-loader-syntax': { meta: [Object], create: [Function: create] },
    order: { meta: [Object], create: [Function: importOrderRule] },
    'newline-after-import': { meta: [Object], create: [Function: create] },
    'prefer-default-export': { meta: [Object], create: [Function: create] },
    'no-default-export': { meta: [Object], create: [Function: create] },
    'no-named-export': { meta: [Object], create: [Function: create] },
    'no-dynamic-require': { meta: [Object], create: [Function: create] },
    unambiguous: { meta: [Object], create: [Function: create] },
    'no-unassigned-import': { create: [Function: create], meta: [Object] },
    'no-useless-path-segments': { meta: [Object], create: [Function: create] },
    'dynamic-import-chunkname': { meta: [Object], create: [Function: create] },
    'exports-last': { meta: [Object], create: [Function: create] },
    'no-deprecated': { meta: [Object], create: [Function: create] },
    'imports-first': { meta: [Object], create: [Function: create] }
  },
  configs: {
    recommended: { plugins: [Array], rules: [Object], parserOptions: [Object] },
    errors: { plugins: [Array], rules: [Object] },
    warnings: { plugins: [Array], rules: [Object] },
    'stage-0': { plugins: [Array], rules: [Object] },
    react: { settings: [Object], parserOptions: [Object] },
    'react-native': { settings: [Object] },
    electron: { settings: [Object] },
    typescript: { settings: [Object] }
  }
}
prettier {
  configs: {
    recommended: { extends: [Array], plugins: [Array], rules: [Object] }
  },
  rules: { prettier: { meta: [Object], create: [Function: create] } }
}
no-use-extend-native {
  rules: { 'no-use-extend-native': [Function] },
  rulesConfig: { 'no-use-extend-native': 2 }
}
node {
  configs: {
    'recommended-module': {
      globals: [Object],
      parserOptions: [Object],
      plugins: [Array],
      rules: [Object]
    },
    'recommended-script': {
      globals: [Object],
      parserOptions: [Object],
      plugins: [Array],
      rules: [Object]
    },
    recommended: [Getter]
  },
  rules: {
    'exports-style': { meta: [Object], create: [Function: create] },
    'file-extension-in-import': { meta: [Object], create: [Function: create] },
    'no-callback-literal': { meta: [Object], create: [Function: create] },
    'no-deprecated-api': { meta: [Object], create: [Function: create] },
    'no-exports-assign': { meta: [Object], create: [Function: create] },
    'no-extraneous-import': { meta: [Object], create: [Function: create] },
    'no-extraneous-require': { meta: [Object], create: [Function: create] },
    'no-missing-import': { meta: [Object], create: [Function: create] },
    'no-missing-require': { meta: [Object], create: [Function: create] },
    'no-unpublished-bin': { meta: [Object], create: [Function: create] },
    'no-unpublished-import': { meta: [Object], create: [Function: create] },
    'no-unpublished-require': { meta: [Object], create: [Function: create] },
    'no-unsupported-features/es-builtins': { meta: [Object], create: [Function: create] },
    'no-unsupported-features/es-syntax': { meta: [Object], create: [Function: create] },
    'no-unsupported-features/node-builtins': { meta: [Object], create: [Function: create] },
    'prefer-global/buffer': { meta: [Object], create: [Function: create] },
    'prefer-global/console': { meta: [Object], create: [Function: create] },
    'prefer-global/process': { meta: [Object], create: [Function: create] },
    'prefer-global/text-decoder': { meta: [Object], create: [Function: create] },
    'prefer-global/text-encoder': { meta: [Object], create: [Function: create] },
    'prefer-global/url-search-params': { meta: [Object], create: [Function: create] },
    'prefer-global/url': { meta: [Object], create: [Function: create] },
    'prefer-promises/dns': { meta: [Object], create: [Function: create] },
    'prefer-promises/fs': { meta: [Object], create: [Function: create] },
    'process-exit-as-throw': { meta: [Object], create: [Function: create] },
    shebang: { meta: [Object], create: [Function: create] },
    'no-hide-core-modules': { meta: [Object], create: [Function: create] },
    'no-unsupported-features': { meta: [Object], create: [Function: create] }
  }
}
promise {
  rules: {
    'param-names': { meta: [Object], create: [Function: create] },
    'no-return-wrap': { meta: [Object], create: [Function: create] },
    'always-return': { meta: [Object], create: [Function: create] },
    'catch-or-return': { meta: [Object], create: [Function: create] },
    'prefer-await-to-callbacks': { meta: [Object], create: [Function: create] },
    'prefer-await-to-then': { meta: [Object], create: [Function: create] },
    'no-native': { meta: [Object], create: [Function: create] },
    'no-callback-in-promise': { meta: [Object], create: [Function: create] },
    'no-promise-in-callback': { meta: [Object], create: [Function: create] },
    'no-nesting': { meta: [Object], create: [Function: create] },
    'avoid-new': { meta: [Object], create: [Function: create] },
    'no-new-statics': { meta: [Object], create: [Function: create] },
    'no-return-in-finally': { meta: [Object], create: [Function: create] },
    'valid-params': { meta: [Object], create: [Function: create] }
  },
  rulesConfig: {
    'param-names': 1,
    'always-return': 1,
    'no-return-wrap': 1,
    'no-native': 0,
    'catch-or-return': 1
  },
  configs: { recommended: { plugins: [Array], rules: [Object] } }
}
unicorn {
  rules: {
    'catch-error-name': { create: [Function: create], meta: [Object] },
    'consistent-function-scoping': { create: [Function: create], meta: [Object] },
    'custom-error-definition': { create: [Function: create], meta: [Object] },
    'error-message': { create: [Function: create], meta: [Object] },
    'escape-case': { create: [Function: create], meta: [Object] },
    'expiring-todo-comments': { create: [Function: create], meta: [Object] },
    'explicit-length-check': { create: [Function: create], meta: [Object] },
    'filename-case': { create: [Function: create], meta: [Object] },
    'import-index': { create: [Function: create], meta: [Object] },
    'new-for-builtins': { create: [Function: create], meta: [Object] },
    'no-abusive-eslint-disable': { create: [Function: create], meta: [Object] },
    'no-array-instanceof': { create: [Function: create], meta: [Object] },
    'no-console-spaces': { create: [Function: create], meta: [Object] },
    'no-fn-reference-in-iterator': { create: [Function: create], meta: [Object] },
    'no-for-loop': { create: [Function: create], meta: [Object] },
    'no-hex-escape': { create: [Function: create], meta: [Object] },
    'no-keyword-prefix': { create: [Function: create], meta: [Object] },
    'no-nested-ternary': { create: [Function: create], meta: [Object] },
    'no-new-buffer': { create: [Function: create], meta: [Object] },
    'no-process-exit': { create: [Function: create], meta: [Object] },
    'no-unreadable-array-destructuring': { create: [Function: create], meta: [Object] },
    'no-unsafe-regex': { create: [Function: create], meta: [Object] },
    'no-unused-properties': { create: [Function: create], meta: [Object] },
    'no-zero-fractions': { create: [Function: create], meta: [Object] },
    'number-literal-case': { create: [Function: create], meta: [Object] },
    'prefer-add-event-listener': { create: [Function: create], meta: [Object] },
    'prefer-dataset': { create: [Function: create], meta: [Object] },
    'prefer-event-key': { create: [Function: create], meta: [Object] },
    'prefer-exponentiation-operator': { create: [Function: create], meta: [Object] },
    'prefer-flat-map': { create: [Function: create], meta: [Object] },
    'prefer-includes': { create: [Function: create], meta: [Object] },
    'prefer-modern-dom-apis': { create: [Function: create], meta: [Object] },
    'prefer-negative-index': { create: [Function: create], meta: [Object] },
    'prefer-node-append': { create: [Function: create], meta: [Object] },
    'prefer-node-remove': { create: [Function: create], meta: [Object] },
    'prefer-query-selector': { create: [Function: create], meta: [Object] },
    'prefer-reflect-apply': { create: [Function: create], meta: [Object] },
    'prefer-spread': { create: [Function: create], meta: [Object] },
    'prefer-starts-ends-with': { create: [Function: create], meta: [Object] },
    'prefer-string-slice': { create: [Function: create], meta: [Object] },
    'prefer-text-content': { create: [Function: create], meta: [Object] },
    'prefer-trim-start-end': { create: [Function: create], meta: [Object] },
    'prefer-type-error': { create: [Function: create], meta: [Object] },
    'prevent-abbreviations': { create: [Function: create], meta: [Object] },
    'regex-shorthand': { create: [Function: create], meta: [Object] },
    'throw-new-error': { create: [Function: create], meta: [Object] }
  },
  configs: {
    recommended: {
      env: [Object],
      parserOptions: [Object],
      plugins: [Array],
      rules: [Object]
    }
  }
}
