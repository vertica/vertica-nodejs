'use strict'
var helper = require('./test-helper')
var util = require('util')
var Query = helper.vertica.Query
var DatabaseError = helper.vertica.DatabaseError

test('column error fields', function () {
  var client = new Client(helper.args)
  client.connect(
    assert.success(function () {
        client.query('CREATE LOCAL TEMP TABLE column_err_test(a int NOT NULL)')
        client.query('INSERT INTO column_err_test(a) VALUES (NULL)', function (err) {
          assert.equal(err.severity, 'ERROR')
          assert.equal(err.code, '22004')
          return client.end()
        })
    })
  )
})

test('constraint error fields', function () {
  var client = new Client(helper.args)
  client.connect(
    assert.success(function () {
        client.query('CREATE LOCAL TEMP TABLE constraint_err_test(a int PRIMARY KEY ENABLED)')
        client.query('INSERT INTO constraint_err_test(a) VALUES (1)')
        client.query('INSERT INTO constraint_err_test(a) VALUES (1)', function (err) {
          assert(err instanceof DatabaseError)
          assert.equal(err.severity, 'ERROR')
          assert.equal(err.code, '23505')
          return client.end()
        })
    })
  )
})
