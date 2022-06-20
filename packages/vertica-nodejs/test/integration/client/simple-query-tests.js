'use strict'
var types = require('vertica-nodejs').types
const { VerticaType } = require('v-protocol')
var helper = require('./test-helper')
var Query = helper.vertica.Query

types.setTypeParser(VerticaType.Integer, function(val) {
  return parseInt(val, 10)
})

// before running this test make sure you run the script create-test-tables
test('simple query interface', function () {
  var client = helper.client()

  var query = client.query(new Query('select name from person order by name'))

  client.on('drain', client.end.bind(client))

  var rows = []
  query.on('row', function (row, result) {
    assert.ok(result)
    rows.push(row['name'])
  })
  query.once('row', function (row) {
    test('Can iterate through columns', function () {
      var columnCount = 0
      for (var column in row) {
        columnCount++
      }
      if ('length' in row) {
        assert.lengthIs(
          row,
          columnCount,
          'Iterating through the columns gives a different length from calling .length.'
        )
      }
    })
  })

  assert.emits(query, 'end', function () {
    test('returned right number of rows', function () {
      assert.lengthIs(rows, 26)
    })
    test('row ordering', function () {
      assert.equal(rows[0], 'Aaron')
      assert.equal(rows[25], 'Zanzabar')
    })
  })
})

test('prepared statements do not mutate params', function () {
  var client = helper.client()

  var params = [1]

  var query = client.query(new Query('select name from person where ? = 1 order by name', params))

  assert.deepEqual(params, [1])

  client.on('drain', client.end.bind(client))

  const rows = []
  query.on('row', function (row, result) {
    assert.ok(result)
    rows.push(row)
  })

  query.on('end', function (result) {
    assert.lengthIs(rows, 26, 'result returned wrong number of rows')
    assert.equal(rows[0].name, 'Aaron')
    assert.equal(rows[25].name, 'Zanzabar')
  })
})

test('multiple simple queries', function () {
  var client = helper.client()
  client.query({ text: "create table if not exists bang(id identity, name varchar(5)); insert into bang(name) VALUES('boom');" })
  client.query("insert into bang(name) VALUES ('yes');")
  var query = client.query(new Query('select name from bang'))
  assert.emits(query, 'row', function (row) {
    assert.equal(row['name'], 'boom')
    assert.emits(query, 'row', function (row) {
      assert.equal(row['name'], 'yes')
    })
  })
  // Need to drop the bang table since we can't use a temp table with identity/auto-increment types
  client.query("drop table if exists bang")
  client.on('drain', client.end.bind(client))
})

test('multiple select statements', function () {
  var client = helper.client()
  client.query("create local temp table boom(age integer) ON COMMIT PRESERVE ROWS; insert into boom(age) values(1); insert into boom(age) values(2); insert into boom(age) values(3);")
  client.query("create local temp table bang(name varchar(5)) ON COMMIT PRESERVE ROWS; insert into bang(name) values('zoom');")
  var result = client.query(new Query({
    text: 'select age from boom where age < 2; select name from bang;',
    types: types,
  }))
  assert.emits(result, 'row', function (row) {
    assert.strictEqual(row['age'], 1)
    assert.emits(result, 'row', function (row) {
      assert.strictEqual(row['name'], 'zoom')
    })
  })
  client.on('drain', client.end.bind(client))
})
