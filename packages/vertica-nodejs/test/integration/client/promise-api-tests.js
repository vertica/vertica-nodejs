'use strict'

const helper = require('./test-helper')
const vertica = helper.vertica

const suite = new helper.Suite()

suite.test('valid connection completes promise', () => {
  const client = new vertica.Client()
  return client.connect().then(() => {
    return client.end().then(() => {})
  })
})

suite.test('invalid connection rejects promise', (done) => {
  const client = new vertica.Client({ host: 'alksdjflaskdfj', port: 1234 })
  return client.connect().catch((e) => {
    assert(e instanceof Error)
    done()
  })
})

suite.test('connected client does not reject promise after connection', (done) => {
  const client = new vertica.Client()
  return client.connect().then(() => {
    setTimeout(() => {
      client.on('error', (e) => {
        assert(e instanceof Error)
        client.end()
        done()
      })
      // manually kill the connection
      client.emit('error', new Error('something bad happened...but not really'))
    }, 50)
  })
})
