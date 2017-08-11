/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const { shell } = require('execa')

module.exports = ({ app }) => {
  shell("sed -i 's/src/dest/' test.js").catch((er) => app.emit('error', er))
}
