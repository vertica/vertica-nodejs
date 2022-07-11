'use strict'
var helper = require('./../test-helper')
var exec = require('child_process').exec

var oldTz = process.env.TZ
process.env.TZ = 'Europe/Berlin'

var date = new Date()

const pool = new helper.vertica.Pool()
const suite = new helper.Suite()

/*
* NOTE: These tests right now are not very useful. We are not parsing timestamps into date objects, 
*       we are parsing them as strings. Once we do parse timestamp/timestamptz, these tests need to be
*       modified again to call getTime() on result.rows[o].val, as val should be a date object. Then we 
*       will have a more meaningful test.
*/


pool.connect(function (err, client, done) {
  assert(!err)
  suite.test('timestamp without time zone', function (cb) {
    // 'extract' number of seconds since 1970-01-01
    client.query('SELECT EXTRACT(EPOCH FROM ?::TIMESTAMP) AS val', [date], function (err, result) {
      assert(!err)
      assert.equal(result.rows[0].val, date.getTime() / 1000) // convert to seconds for comparison with query results
      cb()
    })
  })

  suite.test('timestamp with time zone', function (cb) {
    client.query('SELECT EXTRACT(EPOCH FROM ?::TIMESTAMPTZ) AS val', [date], function (err, result) {
      assert(!err)
      assert.equal(result.rows[0].val, date.getTime() / 1000) // convert to seconds for comparison with query results
      done()
      pool.end(cb)
      process.env.TZ = oldTz
    })
  })
})
