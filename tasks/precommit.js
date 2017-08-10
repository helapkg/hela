/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const f = require('fs')

module.exports = ({ shell }) => {
  console.log('Running `precommit` command...')
  shell(['npm run lint', 'npm test', 'git add --all'])
}
