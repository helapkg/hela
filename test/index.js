/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

import test from 'ava'
import { hela } from '../src/index.js'

test('should be function', async (t) => {
  const tasks = await hela()

  t.deepEqual(typeof tasks, 'object')
  t.deepEqual(typeof tasks.lint, 'function')
})
