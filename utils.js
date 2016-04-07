'use strict'

/**
 * Module dependencies
 */

var utils = require('lazy-cache')(require)

/**
 * Temporarily re-assign `require` to trick browserify and
 * webpack into reconizing lazy dependencies.
 *
 * This tiny bit of ugliness has the huge dual advantage of
 * only loading modules that are actually called at some
 * point in the lifecycle of the application, whilst also
 * allowing browserify and webpack to find modules that
 * are depended on but never actually called.
 */

var fn = require
require = utils // eslint-disable-line no-undef, no-native-reassign

/**
 * Lazily required module dependencies
 */

require('extend-shallow', 'extend')
require('formidable')
require('koa-body-parsers', 'bodyParsers')

/**
 * Restore `require`
 */

require = fn // eslint-disable-line no-undef, no-native-reassign

utils.defaultOptions = function defaultOptions (options) {
  options = typeof options === 'object' ? options : {}
  var types = utils.defaultTypes(options.extendTypes)
  options = utils.extend({
    fields: false,
    files: false,
    multipart: false,
    textLimit: false,
    formLimit: false,
    jsonLimit: false,
    jsonStrict: true,
    detectJSON: false,
    bufferLimit: false,
    strict: true
  }, options)
  options.extendTypes = types
  options.onerror = options.onЕrror || options.onerror
  options.onerror = typeof options.onerror === 'function' ? options.onerror : false

  if (typeof options.detectJSON !== 'function') {
    options.detectJSON = function detectJSON () {
      return false
    }
  }

  return options
}

utils.defaultTypes = function defaultTypes (types) {
  types = typeof types === 'object' ? types : {}
  return utils.extend({
    multipart: [
      'multipart/form-data'
    ],
    text: [
      'text/*'
    ],
    form: [
      'application/x-www-form-urlencoded'
    ],
    json: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report'
    ]
  }, types)
}

utils.isValid = function isValid (method) {
  return ['GET', 'HEAD', 'DELETE'].indexOf(method.toUpperCase()) === -1
}

utils.setParsers = function setParsers (ctx) {
  utils.bodyParsers(ctx)
  ctx.request.multipart = utils.multipart
}

utils.multipart = function multipart (options, ctx) {
  if (typeof ctx !== 'object') {
    ctx = options
    options = {}
  }
  options = utils.defaultOptions(options)

  return function thunk (done) {
    var form = options.IncomingForm instanceof utils.formidable.IncomingForm
      ? options.IncomingForm
      : new utils.formidable.IncomingForm(options)

    form.parse(ctx.req, function callback (err, fields, files) {
      if (err) return done(err)
      done(null, { fields: fields, files: files })
    })
  }
}

/* eslint complexity: [2, 12] */
utils.parseBody = function * parseBody (ctx, options, next) {
  var fields = typeof options.fields === 'string' ? options.fields : 'fields'
  var files = typeof options.files === 'string' ? options.files : 'files'

  if (options.detectJSON(ctx) || ctx.request.is(options.extendTypes.json)) {
    ctx.app.jsonStrict = typeof options.jsonStrict === 'boolean' ? options.jsonStrict : true
    ctx.body = ctx.request[fields] = yield ctx.request.json(options.jsonLimit)
    return yield * next
  }
  if (ctx.request.is(options.extendTypes.form || options.extendTypes.urlencoded)) {
    var res = yield ctx.request.urlencoded(options.formLimit)
    ctx.body = ctx.request[fields] = res
    return yield * next
  }
  if (ctx.request.is(options.extendTypes.text)) {
    ctx.body = options.buffer
      ? yield ctx.request.buffer(options.bufferLimit || options.textLimit)
      : yield ctx.request.text(options.textLimit)
    return yield * next
  }
  if (ctx.request.is(options.extendTypes.multipart)) {
    var result = yield ctx.request.multipart(options, ctx)
    ctx.body = ctx.request[fields] = result.fields
    ctx.request[files] = result.files
    return yield * next
  }
}

/**
 * Expose `utils` modules
 */

module.exports = utils
