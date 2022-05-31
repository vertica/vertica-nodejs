'use strict'
const assert = require('assert')
const Cursor = require('../')
const pg = require('vertica-nodejs')
const helper = require('./test-helper')

describe('query config passed to result', () => {
  it('passes rowMode to result', (done) => {
    const client = new pg.Client()
    client.connect()
    const text = helper.generateSeriesStatement(6)
    const cursor = client.query(new Cursor(text, null, { rowMode: 'array' }))
    cursor.read(10, (err, rows) => {
      rows.sort()
      assert(!err)
      assert.deepStrictEqual(rows, [[0], [1], [2], [3], [4], [5]])
      client.end()
      done()
    })
  })

  it('passes types to result', (done) => {
    const client = new pg.Client()
    client.connect()
    const text = helper.generateSeriesStatement(3)
    const types = {
      getTypeParser: () => () => 'foo',
    }
    const cursor = client.query(new Cursor(text, null, { types }))
    cursor.read(10, (err, rows) => {
      assert(!err)
      assert.deepStrictEqual(rows, [{ num: 'foo' }, { num: 'foo' }, { num: 'foo' }])
      client.end()
      done()
    })
  })
})
