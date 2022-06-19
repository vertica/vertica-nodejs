'use strict'
var helper = require('./../test-helper')
var assert = require('assert')

const suite = new helper.Suite()

suite.test('All queries should return a result array', (done) => {
  const client = new helper.Client()
  client.connect()
  const promises = []
  promises.push(client.query('CREATE TEMP TABLE foo(bar varchar)'))
  promises.push(client.query('INSERT INTO foo(bar) VALUES(?)', ['qux']))
  promises.push(client.query('SELECT * FROM foo WHERE bar = ?', ['foo']))
  Promise.all(promises).then((results) => {
    results.forEach((res) => {
      assert(Array.isArray(res.fields))
      assert(Array.isArray(res.rows))
    })
    client.end(done)
  })
})
