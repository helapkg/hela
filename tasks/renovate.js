/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const fs = require('fs')
const path = require('path')

module.exports = ({ app }) => {
  console.log('Updating Renovate App config...')
  const helaFolder = path.dirname(__dirname)
  const localConfig = path.join(helaFolder, '.renovaterc.json')

  const newConfig =
    helaFolder === process.cwd()
      ? path.join(helaFolder, 'renovate.json')
      : path.join(helaFolder, '..', '..', 'renovate.json')

  const onerror = (er) => app.emit('error', er)

  const src = fs.createReadStream(localConfig).once('error', onerror)
  const dest = fs.createWriteStream(newConfig).once('error', onerror)

  src.pipe(dest)
}
