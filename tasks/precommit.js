/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

module.exports = ({ exec }) => {
  console.log('Running `precommit` command...')
  exec([
    'git status --porcelain',
    'npm start lint',
    'npm test',
    'git add --all',
  ])
}
