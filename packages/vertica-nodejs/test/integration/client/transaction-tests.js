'use strict'
var helper = require('./test-helper')
const suite = new helper.Suite()
const vertica = helper.vertica

var setupTable = function (table, client) {
  client.query("CREATE TABLE IF NOT EXISTS " + table + "(name varchar, age int);")

  var people = [
    { name: 'Aaron', age: 10 },
    { name: 'Brian', age: 20 },
    { name: 'Chris', age: 30 },
    { name: 'David', age: 40 },
    { name: 'Elvis', age: 50 },
    { name: 'Frank', age: 60 },
    { name: 'Grace', age: 70 },
    { name: 'Haley', age: 80 },
    { name: 'Irma', age: 90 },
    { name: 'Jenny', age: 100 },
    { name: 'Kevin', age: 110 },
    { name: 'Larry', age: 120 },
    { name: 'Michelle', age: 130 },
    { name: 'Nancy', age: 140 },
    { name: 'Olivia', age: 150 },
    { name: 'Peter', age: 160 },
    { name: 'Quinn', age: 170 },
    { name: 'Ronda', age: 180 },
    { name: 'Shelley', age: 190 },
    { name: 'Tobias', age: 200 },
    { name: 'Uma', age: 210 },
    { name: 'Veena', age: 220 },
    { name: 'Wanda', age: 230 },
    { name: 'Xavier', age: 240 },
    { name: 'Yoyo', age: 250 },
    { name: 'Zanzabar', age: 260 },
  ]

  let q = people.map((person) => `INSERT INTO ` + table + ` (name, age) VALUES ('${person.name}', ${person.age})`).join(';') + ";COMMIT;"
  client.query(q)
}

var cleanupTable = function (table, client, done) {
  client.query("DROP TABLE IF EXISTS " + table, function () { client.end(done) })
}

const client = new vertica.Client()
client.connect(
  assert.success(function () {
    setupTable("person", client)
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
          cleanupTable("person", client, done)
        })
      )
    })
  })
)

suite.test('gh#36', function (cb) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.success(function (client, done) {
      setupTable("test", client)
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
        client.query("DROP TABLE IF EXISTS test;", function () {
          cleanupTable("test", client)
          done()
          pool.end(cb)
        })
      })
    })
  )
})
