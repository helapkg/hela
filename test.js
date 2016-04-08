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
      .send({ foo: 'lol' })
      .expect(200)
      .expect({ foo: 'lol' }, done)
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
      .send({ foo: { bar: 'qux' } })
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

test('options and misc', function () {
  test('should catch errors through `options.onerror`', function (done) {
    var server = koa().use(betterBody({
      onerror: function (err, ctx) {
        test.ifError(!err)
        test.strictEqual(err.status, 400)
        ctx.throw('custom error', 422)
      }
    }))
    request(server.callback())
      .post('/')
      .type('json')
      .send('"foobar"')
      .expect(422)
      .expect('custom error', done)
  })
  test('should treat `foo/y-javascript` type as json', function (done) {
    var server = koa().use(betterBody({
      extendTypes: {
        json: 'foo/y-javascript'
      }
    }))
    server.use(function * () {
      test.strictEqual(typeof this.request.fields, 'object')
      test.strictEqual(this.request.fields.a, 'b')
    })
    request(server.callback())
      .post('/')
      .type('foo/y-javascript')
      .send(JSON.stringify({ a: 'b' }))
      .expect(200)
      .expect({a: 'b'}, done)
  })
  test('should get body on `strict:false` and DELETE request with body', function (done) {
    var server = koa().use(betterBody({strict: false}))
    request(server.callback())
      .delete('/')
      .type('json')
      .send({ abc: 'foo' })
      .expect(200)
      .expect({ abc: 'foo' }, done)
  })
  test('should not get body on DELETE request (on strict mode)', function (done) {
    var server = koa().use(betterBody())
    server.use(function * () {
      test.strictEqual(this.body, undefined)
      test.strictEqual(this.request.fields, undefined)
      this.status = 204
    })
    request(server.callback())
      .delete('/')
      .type('text')
      .send('foo bar')
      .expect(204, done)
  })
})

test('parse multipart body', function () {
  test('should not get multipart body if options.multipart: false', function (done) {
    var server = koa().use(betterBody({ multipart: false }))
    server.use(function * () {
      test.strictEqual(this.body, undefined)
      test.strictEqual(this.request.fields, undefined)
      test.strictEqual(this.request.files, undefined)
      this.body = 'abc'
    })
    request(server.callback())
      .post('/')
      .type('multipart/form-data')
      .attach('foo', 'package.json')
      .expect(200)
      .expect('abc', done)
  })
  test('should get multipart body by default', function (done) {
    var server = koa().use(betterBody())
    server.use(function * () {
      test.deepEqual(this.body.files, this.request.files)
      test.strictEqual(this.body.files.foo.name, 'LICENSE')
      test.strictEqual(this.body.files.bar.name, 'utils.js')
    })
    request(server.callback())
      .post('/')
      .type('multipart/form-data')
      .attach('foo', 'LICENSE')
      .attach('bar', 'utils.js')
      .expect(200, done)
  })
  test('should get multipart files and fields', function (done) {
    var server = koa().use(betterBody())
    server.use(function * () {
      test.deepEqual(this.body.files, this.request.files)
      test.strictEqual(this.body.files.pkg.name, 'package.json')
      test.strictEqual(this.body.a, 'b')
      test.strictEqual(this.request.fields.a, 'b')
    })
    request(server.callback())
      .post('/')
      .type('multipart/form-data')
      .field('a', 'b')
      .attach('pkg', 'package.json')
      .expect(200, done)
    done()
  })
})
