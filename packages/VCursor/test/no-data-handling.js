const assert = require('assert')
const vertica = require('vertica')
const Cursor = require('../')

describe('queries with no data', function () {
  beforeEach(function (done) {
    const client = (this.client = new vertica.Client())
    client.connect(done)
  })

  afterEach(function () {
    this.client.end()
  })

  it('handles queries that return no data', function (done) {
    const cursor = new Cursor('CREATE TEMPORARY TABLE whatwhat (thing int)')
    this.client.query(cursor)
    cursor.read(100, function (err, rows) {
      assert.ifError(err)
      assert.strictEqual(rows.length, 0)
      done()
    })
  })

  it('handles empty query', function (done) {
    let cursor = new Cursor('-- this is a comment')
    cursor = this.client.query(cursor)
    cursor.read(100, function (err, rows) {
      assert.ifError(err)
      assert.strictEqual(rows.length, 0)
      done()
    })
  })
})
