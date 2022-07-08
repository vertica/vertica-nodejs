'use strict'
var helper = require('./test-helper')
const suite = new helper.Suite()
const vertica = helper.vertica

const client = new vertica.Client()
client.connect(
  assert.success(function () {
    client.query('begin')

    var getZed = {
      text: 'SELECT * FROM person WHERE name = ?',
      values: ['Zed'],
    }

    suite.test('name should not exist in the database', function (done) {
      client.query(
        getZed,
        assert.calls(function (err, result) {
          assert(!err)
          assert.empty(result.rows)
          done()
        })
      )
    })

    suite.test('can insert name', (done) => {
      client.query(
        'INSERT INTO person(name, age) VALUES(?, ?)',
        ['Zed', 270],
        assert.calls(function (err, result) {
          assert(!err)
          client.query('COMMIT;')
          done()
        })
      )
    })

    suite.test('name should exist in the database', function (done) {
      client.query(
        getZed,
        assert.calls(function (err, result) {
          assert(!err)
          assert.equal(result.rows[0].name, 'Zed')
          done()
        })
      )
    })

    suite.test('rollback', (done) => {
      client.query('rollback', done)
    })

    suite.test('name should not exist in the database', function (done) {
      client.query(
        getZed,
        assert.calls(function (err, result) {
          assert(!err)
          assert.empty(result.rows)
          client.end(done)
        })
      )
    })
  })
)

suite.test('gh#36', function (cb) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.success(function (client, done) {
      client.query('BEGIN')
      client.query(
        {
          name: 'X',
          text: 'SELECT ?::INTEGER',
          values: [0],
        },
        assert.calls(function (err, result) {
          if (err) throw err
          assert.equal(result.rows.length, 1)
        })
      )
      client.query(
        {
          name: 'X',
          text: 'SELECT ?::INTEGER',
          values: [0],
        },
        assert.calls(function (err, result) {
          if (err) throw err
          assert.equal(result.rows.length, 1)
        })
      )
      client.query('COMMIT', function () {
        done()
        pool.end(cb)
      })
    })
  )
})
