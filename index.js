/*!
 * koa-better-body <https://github.com/tunnckoCore/koa-better-body>
 *
 * Copyright (c) 2014-2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

'use strict'

var utils = require('./utils')

module.exports = function koaBetterBody (options) {
  options = utils.defaultOptions(options)

  return function * plugin (next) {
    if (!options.strict || !utils.isValid(this.method)) {
      return yield * next
    }

    try {
      utils.setParsers(this)
      yield * utils.parseBody(this, options, next)
    } catch (err) {
      if (!options.onerror) throw err
      options.onerror(err, this)
    }

    yield * next
  }
}
