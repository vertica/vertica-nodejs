'use strict'
const helper = require('./../test-helper')
const assert = require('assert')

const suite = new helper.Suite()

suite.testAsync('BoundPool can be subclassed', async () => {
  const Pool = helper.vertica.Pool
  class SubPool extends Pool {}
  const subPool = new SubPool()
  const client = await subPool.connect()
  client.release()
  await subPool.end()
  assert(subPool instanceof helper.vertica.Pool)
})

suite.test('calling vertica.Pool without new throws', () => {
  const Pool = helper.vertica.Pool
  assert.throws(() => {
    const pool = Pool()
  })
})
