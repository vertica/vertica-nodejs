'use strict'

const vertica = require('../../../lib')
const helper = require('../test-helper')

const suite = new helper.Suite()

suite.test('bad ssl credentials do not cause crash', (done) => {
  const config = {
    ssl: {
      ca: 'invalid_value',
      key: 'invalid_value',
      cert: 'invalid_value',
    },
  }

  const client = new vertica.Client(config)

  client.connect((err) => {
    assert(err)
    client.end()
    done()
  })
})
