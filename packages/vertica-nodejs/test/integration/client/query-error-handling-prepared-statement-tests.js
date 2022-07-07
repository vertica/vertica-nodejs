'use strict'
var helper = require('./test-helper')
var Query = helper.vertica.Query
var util = require('util')

var suite = new helper.Suite()

suite.test('client end during query execution of prepared statement', function (done) {
  var client = new Client()
  client.connect(
    assert.success(function () {
      var sleepQuery = 'select sleep(?)'

      var queryConfig = {
        name: 'sleep query',
        text: sleepQuery,
        values: [5],
      }

      var queryInstance = new Query(
        queryConfig,
        assert.calls(function (err, result) {
          assert.equal(err.message, 'Connection terminated')
          done()
        })
      )

      var query1 = client.query(queryInstance)

      query1.on('error', function (err) {
        assert.fail('Prepared statement should not emit error')
      })

      query1.on('row', function (row) {
        assert.fail('Prepared statement should not emit row')
      })

      query1.on('end', function (err) {
        assert.fail('Prepared statement when executed should not return before being killed')
      })

      client.end()
    })
  )
})