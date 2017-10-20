/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

import test from 'mukla'
import { hela } from '../src/'

test('should be function', async () => {
  const tasks = await hela()

  test.strictEqual(typeof tasks, 'object')
  test.strictEqual(typeof tasks.lint, 'function')
})
