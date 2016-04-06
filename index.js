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

    utils.parseBody(this)

    var fields = typeof options.fields === 'string' ? options.fields : 'fields'
    var files = typeof options.files === 'string' ? options.files : 'files'

    if (options.detectJSON(this) || this.request.is(options.extendTypes.json)) {
      this.app.jsonStrict = typeof options.jsonStrict === 'boolean' ? options.jsonStrict : true
      this.body = this.request[fields] = yield this.request.json(options.jsonLimit)
      return yield * next
    }
    if (this.request.is(options.extendTypes.form || options.extendTypes.urlencoded)) {
      this.body = this.request[fields] = yield this.request.urlencoded(options.formLimit)
      return yield * next
    }
    if (this.request.is(options.extendTypes.text)) {
      this.body = options.buffer
        ? yield this.request.buffer(options.bufferLimit || options.textLimit)
        : yield this.request.text(options.textLimit)
      return yield * next
    }
    if (this.request.is(options.extendTypes.multipart)) {
      var result = yield this.request.multipart(options, this)
      this.request[fields] = result.fields
      this.request[files] = result.files
      this.body = !options.fields ? this.request[fields] : undefined
      return yield * next
    }

    yield * next
  }
}
