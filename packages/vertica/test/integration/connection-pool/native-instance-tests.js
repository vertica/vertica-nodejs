'use strict'
var helper = require('./../test-helper')
var vertica = helper.vertica
var native = helper.args.native

var pool = new vertica.Pool()

pool.connect(
  assert.calls(function (err, client, done) {
    if (native) {
      assert(client.native)
    } else {
      assert(!client.native)
    }
    done()
    pool.end()
  })
)
