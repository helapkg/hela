/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const fs = require('fs')
const path = require('path')
const get = require('simple-get')

// eslint-disable-next-line
const url = 'https://cdn.rawgit.com/tunnckoCore/contributing/master/CONTRIBUTING.md'

module.exports = ({ app }) => {
  console.log('Updating CONTRIBUTING.md file...')

  const onerror = (er) => app.emit('error', er)

  get(url, (er, res) => {
    if (er) return onerror(er)

    const newContrib = path.join(process.cwd(), 'CONTRIBUTING.md')

    const src = res.once('error', onerror)
    const dest = fs.createWriteStream(newContrib).once('error', onerror)

    src.pipe(dest)
  })
}
