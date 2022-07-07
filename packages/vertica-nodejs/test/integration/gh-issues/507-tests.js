'use strict'
var helper = require('../test-helper')
var vertica = helper.vertica

new helper.Suite().test('parsing array results', function (cb) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.success(function (client, done) {
      client.query('CREATE LOCAL TEMP TABLE test_table(bar integer, "baz\'s" integer)')
      client.query('INSERT INTO test_table(bar, "baz\'s") VALUES(1, 1), (2, 2)')
      client.query('SELECT * FROM test_table', function (err, res) {
        console.log(res.rows)
        assert.equal(res.rows[0]["baz's"], 1)
        assert.equal(res.rows[1]["baz's"], 2)
        done()
        pool.end(cb)
      })
    })
  )
})
