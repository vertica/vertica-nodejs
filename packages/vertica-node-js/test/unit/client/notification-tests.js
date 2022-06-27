'use strict'
var helper = require('./test-helper')

test('passes connection notification', async function () {
  var client = await helper.client()
  assert.emits(client, 'notice', function (msg) {
    assert.equal(msg, 'HAY!!')
  })
  client.connection.emit('notice', 'HAY!!')
})
