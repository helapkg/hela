/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const fs = require('fs')
const path = require('path')

const readFile = (fp) =>
  new Promise((resolve, reject) => {
    fs.readFile(fp, 'utf8', (er, res) => {
      if (er) return reject(er)
      resolve(res)
    })
  })

const writeFile = (fp, data) =>
  new Promise((resolve, reject) => {
    fs.writeFile(path.join(process.cwd(), fp), data, (er, res) => {
      if (er) return reject(er)
      resolve(res)
    })
  })

module.exports = ({ app }) => {
  console.log('Updating Renovate App config...')
  const helaFolder = path.dirname(__dirname)
  const localConfig = path.join(helaFolder, '.renovaterc.json')

  const writeRenovate = (config) =>
    writeFile('renovate.json', JSON.stringify(config, null, 2))

  readFile(localConfig).then(JSON.parse).then(writeRenovate)
  // shell('simple-commit-message')
}
