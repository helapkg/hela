/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

module.exports = ({ adds, exec }) => {
  console.log('Running `test` command...')
  exec([`nyc --reporter lcov ${adds}`, 'nyc report'])
}
