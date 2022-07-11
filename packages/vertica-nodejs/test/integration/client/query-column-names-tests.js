'use strict'
var helper = require('../test-helper')
var vertica = helper.vertica

var suite = new helper.Suite()

suite.test('support for complex column names', function () {
  const pool = new vertica.Pool()
  pool.connect(
    assert.success(function (client, done) {
      client.query('CREATE LOCAL TEMP TABLE t ( "complex\'\'column" VARCHAR )')
      client.query(
        'SELECT * FROM t',
        assert.success(function (res) {
          done()
          assert.strictEqual(res.fields[0].name, "complex''column")
          pool.end()
        })
      )
    })
  )
})

suite.test('column names are returned correctly', function() {
  const pool = new vertica.Pool()
  pool.connect(
    assert.success(function (client, done) {
      client.query('CREATE LOCAL TEMP TABLE d ( foobar VARCHAR, abcd INTEGER )')
      client.query("INSERT INTO d VALUES ( 'wow', 9 )")
      client.query(
        'SELECT * FROM d',
        assert.success(function (res) {
          done()
          console.log(res)
          assert.strictEqual(res.fields[0].name, 'foobar')
          assert.strictEqual(res.fields[1].name, 'abcd')
          pool.end()
        })
      )
    })
  )
})
