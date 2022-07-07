'use strict'
var helper = require('./test-helper')
const pool = new helper.vertica.Pool()

pool.connect(
  assert.success(function (client, done) {
    var types = require('pg-types')
    // 1231 = numericOID
    types.setTypeParser(1700, function () {
      return 'yes'
    })
    types.setTypeParser(1700, 'binary', function () {
      return 'yes'
    })
    var bignum = '294733346389144765940638005275322203805'
    client.query('CREATE LOCAL TEMP TABLE bignumz(id numeric(64,0))')
    client.query('INSERT INTO bignumz(id) VALUES (?)', [bignum])
    client.query(
      'SELECT * FROM bignumz',
      assert.success(function (result) {
        console.log("TEST: " + JSON.stringify(result, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
        ))
        assert.equal(result.rows[0].id, 'yes')
        done()
        pool.end()
      })
    )
  })
)
