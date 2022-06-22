'use strict'
require('./test-helper')
var assert = require('assert')

var pguser = process.env['V_USER'] || process.env.USER
var pgdatabase = process.env['V_DATABASE'] || process.env.USER
var pgport = process.env['V_PORT'] || 5433

test('client settings', function () {
  test('defaults', function () {
    var client = new Client()
    assert.equal(client.user, pguser)
    assert.equal(client.database, pgdatabase)
    assert.equal(client.port, pgport)
    assert.equal(client.tls_mode, 'disable')
  })

  test('custom', function () {
    var user = 'brian'
    var database = 'pgjstest'
    var password = 'boom'
    var client = new Client({
      user: user,
      database: database,
      port: 321,
      password: password,
      tls_mode: 'enable',
    })

    assert.equal(client.user, user)
    assert.equal(client.database, database)
    assert.equal(client.port, 321)
    assert.equal(client.password, password)
    assert.equal(client.tls_mode, 'enable')
  })
})

test('initializing from a config string', function () {
  test('uses connectionString property', function () {
    var client = new Client({
      connectionString: 'postgres://brian:pass@host1:333/databasename',
    })
    assert.equal(client.user, 'brian')
    assert.equal(client.password, 'pass')
    assert.equal(client.host, 'host1')
    assert.equal(client.port, 333)
    assert.equal(client.database, 'databasename')
  })

  test('uses the correct values from the config string', function () {
    var client = new Client('postgres://brian:pass@host1:333/databasename')
    assert.equal(client.user, 'brian')
    assert.equal(client.password, 'pass')
    assert.equal(client.host, 'host1')
    assert.equal(client.port, 333)
    assert.equal(client.database, 'databasename')
  })

  test('uses the correct values from the config string with space in password', function () {
    var client = new Client('postgres://brian:pass word@host1:333/databasename')
    assert.equal(client.user, 'brian')
    assert.equal(client.password, 'pass word')
    assert.equal(client.host, 'host1')
    assert.equal(client.port, 333)
    assert.equal(client.database, 'databasename')
  })

  test('when not including all values the defaults are used', function () {
    var client = new Client('postgres://host1')
    assert.equal(client.user, process.env['V_USER'] || process.env.USER)
    assert.equal(client.password, process.env['V_PASSWORD'] || null)
    assert.equal(client.host, 'host1')
    assert.equal(client.port, process.env['V_PORT'] || 5433)
    assert.equal(client.database, process.env['V_DATABASE'] || process.env.USER)
  })

  test('when not including all values, the environment variables are used', function () {
    var envUserDefined = process.env['V_USER'] !== undefined
    var envPasswordDefined = process.env['V_PASSWORD'] !== undefined
    var envDBDefined = process.env['V_DATABASE'] !== undefined
    var envHostDefined = process.env['V_HOST'] !== undefined
    var envPortDefined = process.env['V_PORT'] !== undefined

    var savedEnvUser = process.env['V_USER']
    var savedEnvPassword = process.env['V_PASSWORD']
    var savedEnvDB = process.env['V_DATABASE']
    var savedEnvHost = process.env['V_HOST']
    var savedEnvPort = process.env['V_PORT']

    process.env['V_USER'] = 'utUser1'
    process.env['V_PASSWORD'] = 'utPass1'
    process.env['V_DATABASE'] = 'utDB1'
    process.env['V_HOST'] = 'utHost1'
    process.env['V_PORT'] = 5464

    var client = new Client('postgres://host1')

    assert.equal(client.user, process.env['V_USER'])
    assert.equal(client.password, process.env['V_PASSWORD'])
    assert.equal(client.host, 'host1')
    assert.equal(client.port, process.env['V_PORT'])
    assert.equal(client.database, process.env['V_DATABASE'])

    if (envUserDefined) {
      process.env['V_USER'] = savedEnvUser
    } else {
      delete process.env['V_USER']
    }

    if (envPasswordDefined) {
      process.env['V_PASSWORD'] = savedEnvPassword
    } else {
      delete process.env['V_PASSWORD']
    }

    if (envDBDefined) {
      process.env['V_DATABASE'] = savedEnvDB
    } else {
      delete process.env['V_DATABASE']
    }

    if (envHostDefined) {
      process.env['V_HOST'] = savedEnvHost
    } else {
      delete process.env['V_HOST']
    }

    if (envPortDefined) {
      process.env['V_PORT'] = savedEnvPort
    } else {
      delete process.env['V_PORT']
    }
  })
})

test('calls connect correctly on connection', function () {
  var client = new Client('/tmp')
  var usedPort = ''
  var usedHost = ''
  client.connection.connect = function (port, host) {
    usedPort = port
    usedHost = host
  }
  client.connect()
  assert.equal(usedPort, '/tmp/.s.PGSQL.' + pgport)
  assert.strictEqual(usedHost, undefined)
})
