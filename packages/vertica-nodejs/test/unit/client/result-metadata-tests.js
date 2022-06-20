'use strict'
var helper = require('./test-helper')

var testForTag = function (tagText, callback) {
  test('includes command tag data for tag ' + tagText, async function () {
    var client = await helper.client()
    client.connection.emit('readyForQuery')

    var query = client.query(
      'whatever',
      assert.calls((err, result) => {
        assert.ok(result != null, 'should pass something to this event')
        callback(result)
      })
    )
    assert.lengthIs(client.connection.queries, 1)

    client.connection.emit('commandComplete', {
      text: tagText,
    })

    client.connection.emit('readyForQuery')
  })
}

var check = function (oid, command) {
  return function (result) {
    if (oid != null) {
      assert.equal(result.oid, oid)
    }
    assert.equal(result.command, command)
  }
}

testForTag('INSERT 0 3', check(0, 'INSERT'))
testForTag('INSERT 841 1', check(841, 'INSERT'))
testForTag('DELETE 10', check(null, 'DELETE'))
testForTag('UPDATE 11', check(null, 'UPDATE'))
testForTag('SELECT 20', check(null, 'SELECT'))
testForTag('COPY', check(null, 'COPY'))
testForTag('COPY 12345', check(null, 'COPY'))
