const assert = require('assert')
const helper = require('../test-helper')
const suite = new helper.Suite()
const { Client } = helper.vertica

// We do not yet support the transaction isolation level connection param
/*
suite.test('it sends options', async () => {
  const client = new Client({
    options: '--default_transaction_isolation=serializable',
  })
  await client.connect()
  const { rows } = await client.query('SHOW current TransactionIsolationLevel')
  assert.strictEqual(rows.length, 1)
  assert.strictEqual(rows[0].setting, 'serializable')
  await client.end()
})
*/