//Should we remove this file as its a redundant test for TLS mode?
//All TLS test suites for various TLS modes can be found at vertica-nodejs/test/integration/connection/tls-tests.js


'use strict'

const vertica = require('../../../lib')
const helper = require('../test-helper')

const suite = new helper.Suite()

suite.test('bad tls credentials do not cause crash', (done) => {
  const config = {
    //tls_client_cert: 'invalid_value',
    //tls_client_key: 'invalid_value',
    tls_mode: 'require',
    tls_trusted_certs: 'invalid_value',
  }

  const client = new vertica.Client(config)

  client.connect((err) => {
    assert(err)
    client.end()
    done()
  })
})
