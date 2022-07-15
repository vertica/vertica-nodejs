'use strict'
var types = require('vertica-nodejs').types
const { VerticaType } = require('v-protocol')
var helper = require('./test-helper')
const suite = new helper.Suite()

types.setTypeParser(VerticaType.Integer, function(val) {
  return parseInt(val, 10)
})

suite.test('noData message handling', function () {
  var client = helper.client()

  var q = client.query({
    name: 'boom',
    text: 'create local temp table boom(size integer)',
  })

  client.query(
    {
      name: 'insert',
      text: 'insert into boom(size) values(?)',
      values: [100],
    },
    function (err, result) {
      if (err) {
        throw err
      }
    }
  )

  client.query({
    name: 'insert',
    values: [101],
  })

  var query = client.query(
    {
      name: 'fetch',
      text: 'select size from boom where size < ?',
      values: [101],
      types: types,
    },
    (err, res) => {
      var row = res.rows[0]
      assert.strictEqual(row.size, 100)
    }
  )

  client.on('drain', client.end.bind(client))
})
