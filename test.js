/*!
 * koa-better-body <https://github.com/tunnckoCore/koa-better-body>
 *
 * Copyright (c) 2014-2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

/* jshint asi:true */

'use strict'

var test = require('assertit')
var betterBody = require('./index')
var request = require('supertest')
var koa = require('koa')

// TODO: write tests

test('should parse a json body', function (done) {
  var server = koa().use(betterBody()).callback()

  request(server)
    .post('/')
    .send({
      message: 'lol'
    })
    .expect(200)
    .expect(/"message"/)
    .expect(/"lol"/, done)
})

test('should parse a urlencoded body', function (done) {
  var server = koa().use(betterBody()).callback()

  request(server)
    .post('/')
    .send('a=b&c=d')
    .expect(200)
    .expect(/"a":"b"/)
    .expect(/"c":"d"/, done)
})
