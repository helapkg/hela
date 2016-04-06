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
    var res = {}
    utils.parse(this)
    this.request.multipart = utils.multipart

    if (options.detectJSON(this) || this.request.is(options.extendTypes.json)) {
      this.app.jsonStrict = typeof options.jsonStrict === 'boolean' ? options.jsonStrict : true
      res.fields = yield this.request.json(options.jsonLimit)
    } else if (this.request.is(options.extendTypes.form || options.extendTypes.urlencoded)) {
      res.fields = yield this.request.urlencoded(options.formLimit)
    } else if (this.request.is(options.extendTypes.text)) {
      this.body = yield this.request.text(options.textLimit)
      return yield * next
    } else if (this.request.is(options.extendTypes.multipart)) {
      var result = yield this.request.multipart(options, this)
      res.fields = result.fields
      res.files = result.files
    } else {
      this.body = yield this.request.buffer(options.bufferLimit || options.textLimit)
      return yield * next
    }

    var fields = typeof options.fields === 'string' ? options.fields : 'fields'
    var files = typeof options.files === 'string' ? options.files : 'files'

    this.request[fields] = res.fields
    this.request[files] = res.files

    if (!options.fields) {
      this.body = res.fields
    }

    yield * next
  }
}
