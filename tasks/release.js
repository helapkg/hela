/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const fs = require('fs')

module.exports = ({ shell }) => {
  console.log('Running `release` command...')
  shell(['semantic-release pre', 'npm publish', 'semantic-release post'])
}
