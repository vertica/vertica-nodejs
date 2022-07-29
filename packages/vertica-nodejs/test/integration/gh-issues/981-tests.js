'use strict'
var helper = require('./../test-helper')

var assert = require('assert')
var vertica = require('../../../lib')

var JsClient = require('../../../lib/client')

assert(vertica.Client === JsClient)

const jsPool = new vertica.Pool()

const suite = new helper.Suite()
suite.test('js pool returns js client', (cb) => {
  jsPool.connect(function (err, client, done) {
    assert(client instanceof JsClient)
    done()
    jsPool.end(cb)
  })
})
