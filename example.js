'use strict'

const Koa = require('koa')
const Router = require('koa-router')
const convert = require('koa-convert')
const body = require('./index')

const app = new Koa()
const router = new Router()

router.use(convert(body()))

router.post('/upload', async (ctx, next) => {
  console.log(ctx.request.files)
  console.log(ctx.request.fields)

  // there's no `.body` when `multipart`,
  // `urlencoded` or `json` request
  console.log(ctx.request.body)

  // print it to the API requester
  ctx.body = JSON.stringify(
    {
      fields: ctx.request.fields,
      files: ctx.request.files,
      body: ctx.request.body || null
    },
    null,
    2
  )

  await next
})

app.use(router.routes())
app.listen(4292)

var format = require('util').format
var host = 'http://localhost:4292'
var cmd = 'curl -i %s/upload -F "source=@%s/.editorconfig"'

console.log('Try it out with below CURL for `koa-better-body` repository.')
console.log(format(cmd, host, __dirname))
