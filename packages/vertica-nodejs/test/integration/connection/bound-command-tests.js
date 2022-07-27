'use strict'
var helper = require('./test-helper')
// http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY

test('testing responses to prepared statement flow', function () {
  helper.connect(function (con) {
    con.parse({
      text: 'select * from ids',
      name: 'query'
    })
    con.describe({
      type: 'S',
      name: 'query'
    })
    con.flush()

    assert.emits(con, 'parseComplete')

    con.bind()
    con.execute()
    con.flush()

    assert.emits(con, 'bindComplete')
    assert.emits(con, 'dataRow')
    assert.emits(con, 'portalSuspended', function () {
      con.sync()
    })
    assert.emits(con, 'readyForQuery', function () {
      con.end()
    })
  })
})
