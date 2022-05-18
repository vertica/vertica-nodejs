'use strict'
var helper = require('./test-helper')
var vertica = helper.vertica

var suite = new helper.Suite()

suite.test('vertica label connection parameter', function () {
  // assert current default behavior
  assert.equal(vertica.defaults.client_label, '')
  
  // assert creating a client connection will use default label and persist
  var client_default = new vertica.Client()
  assert.equal(client_default.client_label, vertica.defaults.client_label)
  client_default.connect()
  client_default.query('SELECT GET_CLIENT_LABEL()', (err, res) => {
      if (err) assert(false)
      assert.equal(res.rows[0]['GET_CLIENT_LABEL'], vertica.defaults.client_label)
      client_default.end()
  })

  // assert creating a client connection with specified label will persist
  var client_test = new vertica.Client({client_label: 'distinctLabel'})
  assert.equal(client_test.client_label, 'distinctLabel')
  client_test.connect()
  client_test.query('SELECT GET_CLIENT_LABEL()', (err, res) => {
    if (err) assert(false)
    assert.equal(res.rows[0]['GET_CLIENT_LABEL'], 'distinctLabel')
    client_test.end()
  })
})
