/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

const test = require('mukla')
const { hela, exec, shell } = require('../src/index.js')

test('should be async function and resolve an object with tasks', async () => {
  const tasks = await hela()

  test.strictEqual(typeof tasks, 'object')
  test.strictEqual(typeof tasks.lint, 'function')
})

test('default export has execa-pro `exec` and `shell` methods', (done) => {
  test.strictEqual(typeof exec, 'function')
  test.strictEqual(typeof shell, 'function')
  done()
})
