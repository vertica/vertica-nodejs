'use strict'
var helper = require('./test-helper')
const vertica = helper.vertica

const suite = new helper.Suite()
suite.test('connecting to invalid port', (cb) => {
  const pool = new vertica.Pool({ port: 13801 })
  pool.connect().catch((e) => cb())
})

suite.test('handles socket error during pool.query and destroys it immediately', (cb) => {
  const pool = new vertica.Pool({ max: 1 })

  pool.query('SELECT sleep(10)', [], (err) => {
    assert.equal(err.message, 'network issue')
    assert.equal(stream.destroyed, true)
    cb()
  })

  const stream = pool._clients[0].connection.stream
  setTimeout(() => {
    stream.emit('error', new Error('network issue'))
  }, 100)
})
