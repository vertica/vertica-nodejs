'use strict'
var helper = require('../test-helper')
var vertica = helper.vertica

var suite = new helper.Suite()

suite.test('null and undefined are both inserted as NULL', function (done) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.calls(function (err, client, release) {
      assert(!err)
      client.query('CREATE LOCAL TEMP TABLE IF NOT EXISTS my_nulls(a varchar(1), b varchar(1), c integer, d integer, e date, f date)')
      client.query('INSERT INTO my_nulls(a,b,c,d,e,f) VALUES (?,?,?,?,?,?)', [
        null,
        undefined,
        null,
        undefined,
        null,
        undefined,
      ])
      client.query(
        'SELECT * FROM my_nulls',
        assert.calls(function (err, result) {
          assert.ifError(err)
          assert.equal(result.rows.length, 1)
          assert.isNull(result.rows[0].a)
          assert.isNull(result.rows[0].b)
          assert.isNull(result.rows[0].c)
          assert.isNull(result.rows[0].d)
          assert.isNull(result.rows[0].e)
          assert.isNull(result.rows[0].f)
          pool.end(done)
          release()
        })
      )
    })
  )
})

suite.test('pool callback behavior', (done) => {
  // test weird callback behavior with node-pool
  const pool = new vertica.Pool()
  pool.connect(function (err) {
    assert(!err)
    arguments[1].emit('drain')
    arguments[2]()
    pool.end(done)
  })
})

suite.test('query timeout', (cb) => {
  const pool = new vertica.Pool({ query_timeout: 1000 })
  pool.connect().then((client) => {
    client.query(
      'SELECT sleep(2)',
      assert.calls(function (err, result) {
        assert(err)
        assert(err.message === 'Query read timeout')
        client.release()
        pool.end(cb)
      })
    )
  })
})

suite.test('query recover from timeout', (cb) => {
  const pool = new vertica.Pool({ query_timeout: 1000 })
  pool.connect().then((client) => {
    client.query(
      'SELECT sleep(20)',
      assert.calls(function (err, result) {
        assert(err)
        assert(err.message === 'Query read timeout')
        client.release(err)
        pool.connect().then((client) => {
          client.query(
            'SELECT 1',
            assert.calls(function (err, result) {
              assert(!err)
              client.release(err)
              pool.end(cb)
            })
          )
        })
      })
    )
  })
})

suite.test('query no timeout', (cb) => {
  const pool = new vertica.Pool({ query_timeout: 10000 })
  pool.connect().then((client) => {
    client.query(
      'SELECT sleep(1)',
      assert.calls(function (err, result) {
        assert(!err)
        client.release()
        pool.end(cb)
      })
    )
  })
})

suite.test('callback API', (done) => {
  const client = new helper.Client()
  client.query('CREATE LOCAL TEMP TABLE peep(name varchar)')
  client.query('INSERT INTO peep(name) VALUES (?)', ['brianc'])
  const config = {
    text: 'INSERT INTO peep(name) VALUES (?)',
    values: ['brian'],
  }
  client.query(config)
  client.query('INSERT INTO peep(name) VALUES (?)', ['aaron'])

  client.query('SELECT * FROM peep ORDER BY name', (err, res) => {
    assert(!err)
    assert.deepEqual(res.rows, [
      {
        name: 'aaron',
      },
      {
        name: 'brian',
      },
      {
        name: 'brianc',
      },
    ])
    done()
  })
  client.connect((err) => {
    assert(!err)
    client.once('drain', () => client.end())
  })
})

suite.test('executing nested queries', function (done) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.calls(function (err, client, release) {
      assert(!err)
      client.query(
        'select NOW() as now',
        assert.calls(function (err, result) {
          assert.equal(new Date().getYear(), new Date(result.rows[0].now).getYear())
          client.query(
            'select NOW() as now',
            assert.calls(function () {
              client.query(
                'select * FROM NOW()',
                assert.calls(function () {
                  assert.ok('all queries hit')
                  release()
                  pool.end(done)
                })
              )
            })
          )
        })
      )
    })
  )
})

suite.test('raises error if cannot connect', function () {
  var connectionString = 'pg://sfalsdkf:asdf@localhost/ieieie'
  const pool = new vertica.Pool({ connectionString: connectionString })
  pool.connect(
    assert.calls(function (err, client, done) {
      assert.ok(err, 'should have raised an error')
      done()
    })
  )
})

suite.test('query errors are handled and do not bubble if callback is provided', function (done) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.calls(function (err, client, release) {
      assert(!err)
      client.query(
        'SELECT OISDJF FROM LEIWLISEJLSE',
        assert.calls(function (err, result) {
          assert.ok(err)
          release()
          pool.end(done)
        })
      )
    })
  )
})

suite.test('callback is fired once and only once', function (done) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.calls(function (err, client, release) {
      assert(!err)
      client.query('CREATE LOCAL TEMP TABLE boom(name varchar(10))')
      var callCount = 0
      client.query(
        [
          "INSERT INTO boom(name) VALUES('hai')",
          "INSERT INTO boom(name) VALUES('boom')",
          "INSERT INTO boom(name) VALUES('zoom')",
        ].join(';'),
        function (err, callback) {
          assert.equal(callCount++, 0, 'Call count should be 0.  More means this callback fired more than once.')
          release()
          pool.end(done)
        }
      )
    })
  )
})

suite.test('can provide callback and config object', function (done) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.calls(function (err, client, release) {
      assert(!err)
      client.query(
        {
          name: 'boom',
          text: 'select NOW()',
        },
        assert.calls(function (err, result) {
          assert(!err)
          assert.equal(new Date(result.rows[0].NOW).getYear(), new Date().getYear())
          release()
          pool.end(done)
        })
      )
    })
  )
})

suite.test('can provide callback and config and parameters', function (done) {
  const pool = new vertica.Pool()
  pool.connect(
    assert.calls(function (err, client, release) {
      assert(!err)
      var config = {
        text: 'select ?::varchar as val',
      }
      client.query(
        config,
        ['hi'],
        assert.calls(function (err, result) {
          assert(!err)
          assert.equal(result.rows.length, 1)
          assert.equal(result.rows[0].val, 'hi')
          release()
          pool.end(done)
        })
      )
    })
  )
})
