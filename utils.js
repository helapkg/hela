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
require('koa-body-parsers', 'parse')

/**
 * Restore `require`
 */

require = fn // eslint-disable-line no-undef, no-native-reassign

utils.parseBody = function parseBody (ctx) {
  utils.parse(ctx)
  ctx.request.multipart = utils.multipart
  return ctx
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

/**
 * Expose `utils` modules
 */

module.exports = utils
