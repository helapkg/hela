/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

module.exports = ({ exec }) => {
  console.log('Running `fresh` command...')

  exec([
    'rm -rf dest node_modules package-lock.json',
    'npm prune',
    'npm install',
  ])
}
