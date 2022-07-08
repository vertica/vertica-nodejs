'use strict'
var helper = require('./../test-helper')
var exec = require('child_process').exec

var oldTz = process.env.TZ
process.env.TZ = 'Europe/Berlin'

var date = new Date()

const pool = new helper.vertica.Pool()
const suite = new helper.Suite()

pool.connect(function (err, client, done) {
  assert(!err)
  suite.test('timestamp without time zone', function (cb) {
    // 'extract' number of seconds since 1970-01-01
    client.query('SELECT EXTRACT(EPOCH FROM ?::TIMESTAMP) AS val', [date], function (err, result) {
      console.log(result)
      assert(!err)
      assert.equal(result.rows[0].val, date.getTime() / 1000) // convert to seconds for comparison with query results
      cb()
    })
  })

  suite.test('timestamp with time zone', function (cb) {
    client.query('SELECT CAST(? AS TIMESTAMP WITH TIME ZONE) AS val', [date], function (err, result) {
      assert(!err)
      assert.equal(result.rows[0].val, date)

      done()
      pool.end(cb)
      process.env.TZ = oldTz
    })
  })
})
