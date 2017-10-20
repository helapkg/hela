const builtins = require('builtin-modules')
const pkg = require('./package.json')

module.exports = {
  input: 'test/index.mjs',
  output: {
    file: 'dist/test.js',
    format: 'cjs',
  },
  external: Object.keys(pkg.dependencies)
    .concat(Object.keys(pkg.devDependencies))
    .concat(builtins),
}
