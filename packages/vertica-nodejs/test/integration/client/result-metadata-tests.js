'use strict'
var helper = require('./test-helper')
var vertica = helper.vertica

const pool = new vertica.Pool()
new helper.Suite().test('should return insert metadata', function () {
  pool.connect(
    assert.calls(function (err, client, done) {
      assert(!err)
      client.query(
        'CREATE LOCAL TEMP TABLE zugzug(name varchar(10))',
        assert.calls(function (err, result) {
          assert(!err)
          assert.equal(result.oid, null)
          assert.equal(result.command, 'CREATE')

          var q = client.query(
            "INSERT INTO zugzug(name) VALUES('more work?')",
            assert.calls(function (err, result) {
              assert(!err)
              assert.equal(result.command, 'INSERT')

              client.query(
                'SELECT * FROM zugzug',
                assert.calls(function (err, result) {
                  assert(!err)
                  assert.equal(result.command, 'SELECT')
                  done()
                  process.nextTick(pool.end.bind(pool))
                })
              )
            })
          )
        })
        )
    })
  )
})
