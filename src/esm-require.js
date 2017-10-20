/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

const isObject = require('isobject')

function esmInteropRequire (id, opts) {
  const ex = require('@std/esm')(module, opts)(id)
  return isObject(ex) && 'default' in ex ? ex.default : ex
}

module.exports = esmInteropRequire
