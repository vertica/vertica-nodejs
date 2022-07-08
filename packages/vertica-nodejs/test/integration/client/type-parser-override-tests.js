'use strict'
const { VerticaType } = require('v-protocol')
var helper = require('./test-helper')

function testTypeParser(client, expectedResult, done) {
  var boolValue = true
  client.query('CREATE LOCAL TEMP TABLE parserOverrideTest(id bool)')
  client.query('INSERT INTO parserOverrideTest(id) VALUES (?)', [boolValue])
  client.query(
    'SELECT * FROM parserOverrideTest',
    assert.success(function (result) {
      console.log(result)
      assert.equal(result.rows[0].id, expectedResult)
      done()
    })
  )
}

const pool = new helper.vertica.Pool(helper.config)
pool.connect(
  assert.success(function (client1, done1) {
    pool.connect(
      assert.success(function (client2, done2) {
        var boolTypeOID = VerticaType.boolTypeOID
        client1.setTypeParser(boolTypeOID, function () {
          return 'first client'
        })
        client2.setTypeParser(boolTypeOID, function () {
          return 'second client'
        })

        client1.setTypeParser(boolTypeOID, 'binary', function () {
          return 'first client binary'
        })
        client2.setTypeParser(boolTypeOID, 'binary', function () {
          return 'second client binary'
        })

        testTypeParser(client1, 'first client', () => {
          done1()
          testTypeParser(client2, 'second client', () => done2(), pool.end())
        })
      })
    )
  })
)
