/*!
 * koa-better-serve <https://github.com/tunnckoCore/koa-better-serve>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const test = require('mukla')
const hela = require('./index')

test('hela', () => {
  const app = hela({ _: [] }, './tasks')
  test.strictEqual(typeof app, 'object')
})
