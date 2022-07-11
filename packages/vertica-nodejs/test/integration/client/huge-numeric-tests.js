'use strict'
var helper = require('./test-helper')
const pool = new helper.vertica.Pool()

pool.connect(
  assert.success(function (client, done) {
    var types = require('pg-types')
    // 16 = numericOID
    types.setTypeParser(16, function () {
      return 'yes'
    })
    types.setTypeParser(16, 'binary', function () { // irrelevant until we support binary transfer
      return 'yes'
    })
    var bignum = '294733346389144765940638005275322203805'
    client.query('CREATE LOCAL TEMP TABLE bignumz(id numeric(40,0))')
    client.query('INSERT INTO bignumz(id) VALUES (?::numeric)', [bignum])
    client.query(
      'SELECT * FROM bignumz',
      assert.success(function (result) {
        assert.equal(result.rows[0].id, 'yes')
        done()
        pool.end()
      })
    )
  })
)
