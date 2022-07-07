'use strict'
const assert = require('assert')
const co = require('co')

const helper = require('./test-helper')

const suite = new helper.Suite('multiple result sets')

suite.test(
  'two select results work',
  co.wrap(function* () {
    const client = new helper.Client()
    yield client.connect()

    const results = yield client.query(`SELECT 'foo'::varchar as name; SELECT 'bar'::varchar as baz`)
    assert(Array.isArray(results))

    assert.equal(results[0].fields[0].name, 'name')
    assert.deepEqual(results[0].rows, [{ name: 'foo' }])

    assert.equal(results[1].fields[0].name, 'baz')
    assert.deepEqual(results[1].rows, [{ baz: 'bar' }])

    return client.end()
  })
)

suite.test(
  'multiple selects work',
  co.wrap(function* () {
    const client = new helper.Client()
    yield client.connect()

    const text = `
  SELECT 2 as foo UNION SELECT 3 as foo UNION SELECT 4 as foo;
  SELECT 8 as bar UNION SELECT 9 as bar UNION SELECT 10 as bar;
  SELECT 20 as baz UNION SELECT 21 as baz UNION SELECT 22 as baz;
  `

    const results = yield client.query(text)
    assert(Array.isArray(results))

    assert.equal(results[0].fields[0].name, 'foo')
    results[0].rows.sort(function(a,b){return a.foo - b.foo})
    assert.deepEqual(results[0].rows, [{ foo: 2 }, { foo: 3 }, { foo: 4 }])

    assert.equal(results[1].fields[0].name, 'bar')
    results[1].rows.sort(function(a,b){return a.bar - b.bar})
    assert.deepEqual(results[1].rows, [{ bar: 8 }, { bar: 9 }, { bar: 10 }])

    assert.equal(results[2].fields[0].name, 'baz')
    results[2].rows.sort(function(a,b){return a.baz - b.baz})
    assert.deepEqual(results[2].rows, [{ baz: 20 }, { baz: 21 }, { baz: 22 }])

    assert.equal(results.length, 3)

    return client.end()
  })
)

suite.test(
  'mixed queries and statements',
  co.wrap(function* () {
    const client = new helper.Client()
    yield client.connect()

    const text = `
  CREATE LOCAL TEMP TABLE weather(type varchar);
  INSERT INTO weather(type) VALUES ('rain');
  SELECT * FROM weather;
  `

    const results = yield client.query(text)
    console.log(JSON.stringify(results[2], (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value // return everything else unchanged
    ))
    assert(Array.isArray(results))
    assert(results.length === 3)
    assert.equal(results[0].command, 'CREATE')
    assert.equal(results[1].command, 'INSERT')
    assert.equal(results[2].command, 'SELECT')

    return client.end()
  })
)
