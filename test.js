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
var isBuffer = require('is-buffer')
var request = require('supertest')
var koa = require('koa')

var app = koa().use(betterBody())

// TODO: write tests

test('parse json body', function () {
  test('should parse a json body', function (done) {
    request(app.callback())
      .post('/')
      .send({
        message: 'lol'
      })
      .expect(200)
      .expect(/"message"/)
      .expect(/"lol"/, done)
  })
  test('should throw on json non-object body in strict mode (default)', function (done) {
    request(app.callback())
      .post('/')
      .type('json')
      .send('"lol"')
      .expect(400, done)
  })
  test('should not throw on non-objects in non-strict mode', function (done) {
    var server = koa().use(betterBody({jsonStrict: false}))
    request(server.callback())
      .post('/')
      .type('json')
      .send('"foobar"')
      .expect(200)
      .expect(/foobar/, done)
  })
})

test('parse urlencoded (forms) body', function () {
  test('should parse a urlencoded body', function (done) {
    var server = koa().use(betterBody())
    server.use(function * () {
      test.strictEqual(typeof this.request.fields, 'object')
      test.strictEqual(typeof this.body, 'object')
      test.deepEqual(this.body, {a: 'b', c: 'd'})
      test.deepEqual(this.request.fields, {a: 'b', c: 'd'})
    })
    request(server.callback())
      .post('/')
      .type('application/x-www-form-urlencoded')
      .send('a=b&c=d')
      .expect(200)
      .expect(/"a":"b"/)
      .expect(/"c":"d"/, done)
  })
  test('should throw if the body is too large', function (done) {
    var server = koa().use(betterBody({formLimit: '2b'}))
    request(server.callback())
      .post('/')
      .type('application/x-www-form-urlencoded')
      .send('a=b&c=d')
      .expect(413, done)
  })
})

test('parse text body', function () {
  test('should get the raw text body', function (done) {
    app.use(function * () {
      test.strictEqual(this.request.fields, undefined)
      test.strictEqual(typeof this.body, 'string')
      test.strictEqual(this.body, 'message=lol')
    })
    request(app.callback())
      .post('/')
      .type('text')
      .send('message=lol')
      .expect(200)
      .expect('message=lol', done)
  })
  test('should throw if the body is too large', function (done) {
    var server = koa().use(betterBody({textLimit: '2b'}))
    request(server.callback())
      .post('/')
      .type('text')
      .send('foobar')
      .expect(413, done)
  })
})

test('parse buffer body', function () {
  test('should get the raw buffer body (options.buffer: true)', function (done) {
    var server = koa().use(betterBody({buffer: true}))
    server.use(function * () {
      test.strictEqual(isBuffer(this.body), true)
    })
    request(server.callback())
      .post('/')
      .type('text')
      .send('qux')
      .expect(200)
      .expect('qux', done)
  })
  test('should throw if the buffer body is too large (options.buffer: true)', function (done) {
    var server = koa().use(betterBody({buffer: true, bufferLimit: '2b'}))
    request(server.callback())
      .post('/')
      .type('text')
      .send('too large')
      .expect(413, done)
  })
  test('should get json if `options.buffer` is false (that is the default)', function (done) {
    var server = koa().use(betterBody())
    server.use(function * () {
      test.strictEqual(typeof this.body, 'object')
      test.deepEqual(this.body, {'too large': ''})
    })
    request(server.callback())
      .post('/')
      .send('too large')
      .expect(200)
      .expect(/"too large"/, done)
  })
})
