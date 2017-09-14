/**
 * @author Charlike Mike Reagent <open.source.charlike@gmail.com>
 * @copyright 2017 @tunnckoCore/team and contributors
 * @license MIT
 */
import test from 'mukla'
import { hela } from '../src/index.js'

test('should be function', async () => {
  const tasks = await hela()

  test.strictEqual(typeof tasks, 'object')
  test.strictEqual(typeof tasks.lint, 'function')
})
