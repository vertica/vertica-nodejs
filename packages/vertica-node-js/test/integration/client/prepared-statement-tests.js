'use strict'
var helper = require('./test-helper')
var Query = helper.vertica.Query

var suite = new helper.Suite()

;(function () {
  var client = helper.client()
  client.on('drain', client.end.bind(client))

  var queryName = 'user by age and like name'
  var parseCount = 0

  suite.test('first named prepared statement', function (done) {

    client.query('CREATE TABLE IF NOT EXISTS person(name varchar(100), age int);')
    client.query("INSERT INTO person (name, age) VALUES ('Goofy', 90)")
    client.query("INSERT INTO person (name, age) VALUES ('Mickey', 94)")
    client.query("INSERT INTO person (name, age) VALUES ('Donald', 86)")

    var query = client.query(
      new Query({
        text: 'select name from person where age <= ? and name LIKE ?',
        values: [92, "Don%"],
        name: queryName,
      })
    )

    assert.emits(query, 'row', function (row) {
      assert.equal(row.name, 'Donald')
    })

    query.on('end', () => done())
  })

  suite.test('second named prepared statement with same name & text', function (done) {
    var cachedQuery = client.query(
      new Query({
        text: 'select name from person where age <= ? and name LIKE ?',
        name: queryName,
        values: [100, 'M%'],
      })
    )

    assert.emits(cachedQuery, 'row', function (row) {
      assert.equal(row.name, 'Mickey')
    })

    cachedQuery.on('end', () => done())
  })

  suite.test('with same name, but without query text', function (done) {
    var q = client.query(
      new Query({
        name: queryName,
        values: [100, '%'],
        rowMode: 'array',
      })
    )
    q.on('end', (res) => {
      var flattenedResult = res.rows.flat() // coupled with array RowMode, quick way to get an array of result values
      assert(flattenedResult.includes('Donald'))
      assert(flattenedResult.includes('Mickey'))
      assert(flattenedResult.includes('Goofy'))
      done()
    })
  })

  suite.test('with same name, but with different text', function (done) {
    client.query(
      new Query({
        text: 'select name from person where age >= ? and name LIKE ?',
        name: queryName,
        values: [80, '%'],
      }),
      assert.calls((err) => {
        assert.equal(
          err.message,
          `Prepared statements must be unique - '${queryName}' was used for a different statement`
        )
        done()
      })
    )
    client.query("DROP TABLE IF EXISTS person")
  })
})()

;(function () {
  var client = helper.client()
  client.on('drain', client.end.bind(client))

  suite.test('inserting data with prepared statement', function (done) {
    client.query("CREATE TABLE IF NOT EXISTS insertTest(a boolean, b integer, c char, d varchar(100), e numeric(10, 5))")
    const rowMode = 'array'
    const query1 = {
      name: 'testName',
      text: 'Insert into insertTest values (?, ?, ?, ?, ?)',
      values: [true, 5, 'z', "foo", 12345.67890],
    }
    client.query(query1, (err, res) => {
      if (err) {
        assert(false)
      }
    })
    const query2 = {
      text: 'SELECT * FROM insertTest',
      rowMode: 'array',
    }
    client.query(query2, (err, res) => {
      if (err) {
        assert(false)
      }
      assert.equal(JSON.stringify(res.rows.flat()), JSON.stringify(['t', '5', 'z', 'foo', '12345.67890']))
      done()
    })
  })
})()

