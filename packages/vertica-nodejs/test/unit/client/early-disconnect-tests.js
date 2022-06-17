'use strict'
var helper = require('./test-helper')
var net = require('net')
var vertica = require('../../../lib/index.js')

/* console.log() messages show up in `make test` output. TODO: fix it. */
var server = net.createServer(function (c) {
  c.destroy()
  server.close()
})

server.listen(7777, async function () {
  var client = new vertica.Client('vertica://localhost:7777')
  await client.connect(
    assert.calls(function (err) {
      assert(err)
    })
  )
})
