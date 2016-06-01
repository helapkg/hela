'use strict'

var app = require('koa')()
var path = require('path')
var body = require('../../index')

app
  .use(body({
      buffer: true,
      extendTypes: {
        text: [
          'image/png',
          'image/jpeg'
        ]
      }
    }))
  .use(function * () {
    console.log(this.body instanceof Buffer)
  })

app.listen(4290, function () {
  console.log('Koa server start listening on port 4290')
  console.log('curl -i http://localhost:4290/ -F "foo=@%s/README.md"', __dirname)
})
