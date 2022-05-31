'use strict'
const Cursor = require('v-cursor')
const expect = require('expect.js')
const describe = require('mocha').describe
const it = require('mocha').it

const Pool = require('../')
const helper = require('./test-helper')

const text = helper.generateSeriesStatement(1001)

describe('submittle', () => {
  it('is returned from the query method', false, (done) => {
    const pool = new Pool()
    const cursor = pool.query(new Cursor(text))
    cursor.read((err, rows) => {
      expect(err).to.be(undefined)
      expect(!!rows).to.be.ok()
      cursor.close(done)
    })
  })
})
