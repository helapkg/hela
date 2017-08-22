/*!
 * hela <https://github.com/tunnckoCore/hela>
 *
 * Copyright (c) 2017 Charlike Mike Reagent <open.source.charlike@gmail.com> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

const fs = require('fs')
const path = require('path')

const readJson = (fp) =>
  new Promise((resolve, reject) => {
    fs.readFile(fp, 'utf8', (er, str) => {
      if (er) {
        return reject(er)
      }
      resolve(JSON.parse(str))
    })
  })

const writeJson = (fp, data) =>
  new Promise((resolve, reject) => {
    fs.writeFile(fp, JSON.stringify(data, null, 2), (er) => {
      if (er) {
        return reject(er)
      }
      resolve()
    })
  })

module.exports = ({ app }) => {
  console.log('Adding default hela scripts...')

  const pkgJson = path.join(process.cwd(), 'package.json')

  readJson(pkgJson)
    .then((pkg) => {
      pkg.scripts = {
        fresh: 'hela fresh',
        contrib: 'hela contrib',
        renovate: 'hela renovate',
        lint: 'hela lint -c .eslintrc.json',
        test: 'hela test node test.js',
        precommit: 'hela precommit',
        commit: 'hela commit',
        postcommit: 'git push',
        'semantic-release': 'hela release',
      }
      return writeJson(pkgJson, pkg)
    })
    .then(() => {
      console.log('Package npm scripts are updated.')
    })
    .catch((er) => {
      console.error('Task "init" failed!')
      app.emit('error', er)
    })
}
