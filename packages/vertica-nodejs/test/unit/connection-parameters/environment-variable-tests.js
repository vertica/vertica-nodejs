'use strict'
var helper = require('../test-helper')
const Suite = require('../../suite')

var assert = require('assert')
var ConnectionParameters = require('../../../lib/connection-parameters')
var defaults = require('../../../lib').defaults

// clear process.env
var realEnv = {}
for (var key in process.env) {
  realEnv[key] = process.env[key]
  delete process.env[key]
}

const suite = new Suite('ConnectionParameters')

const clearEnv = () => {
  // clear process.env
  for (var key in process.env) {
    delete process.env[key]
  }
}

suite.test('ConnectionParameters initialized from environment variables', function () {
  clearEnv()
  process.env['V_HOST'] = 'local'
  process.env['V_USER'] = 'bmc2'
  process.env['V_PORT'] = 7890
  process.env['V_DATABASE'] = 'allyerbase'
  process.env['V_PASSWORD'] = 'open'

  var subject = new ConnectionParameters()
  assert.equal(subject.host, 'local', 'env host')
  assert.equal(subject.user, 'bmc2', 'env user')
  assert.equal(subject.port, 7890, 'env port')
  assert.equal(subject.database, 'allyerbase', 'env database')
  assert.equal(subject.password, 'open', 'env password')
})

suite.test('ConnectionParameters initialized from mix', function () {
  clearEnv()
  process.env['V_HOST'] = 'local'
  process.env['V_USER'] = 'bmc2'
  process.env['V_PORT'] = 7890
  process.env['V_DATABASE'] = 'allyerbase'
  process.env['V_PASSWORD'] = 'open'
  delete process.env['V_PASSWORD']
  delete process.env['V_DATABASE']
  var subject = new ConnectionParameters({
    user: 'testing',
    database: 'zugzug',
  })
  assert.equal(subject.host, 'local', 'env host')
  assert.equal(subject.user, 'testing', 'config user')
  assert.equal(subject.port, 7890, 'env port')
  assert.equal(subject.database, 'zugzug', 'config database')
  assert.equal(subject.password, defaults.password, 'defaults password')
})

suite.test('connection string parsing', function () {
  clearEnv()
  var string = 'postgres://brian:pw@boom:381/lala'
  var subject = new ConnectionParameters(string)
  assert.equal(subject.host, 'boom', 'string host')
  assert.equal(subject.user, 'brian', 'string user')
  assert.equal(subject.password, 'pw', 'string password')
  assert.equal(subject.port, 381, 'string port')
  assert.equal(subject.database, 'lala', 'string database')
})

suite.test('connection string parsing - tls_mode', function () {
  // clear process.env
  clearEnv()

  var string = 'postgres://brian:pw@boom:381/lala?tls_mode=require'
  var subject = new ConnectionParameters(string)
  assert.equal(subject.tls_mode, 'require')

  string = 'postgres://brian:pw@boom:381/lala?tls_mode=disable'
  subject = new ConnectionParameters(string)
  assert.equal(subject.tls_mode, 'disable')

  string = 'postgres://brian:pw@boom:381/lala'
  subject = new ConnectionParameters(string)
  assert.equal(subject.tls_mode, 'disable')

  string = 'postgres://brian:pw@boom:381/lala?tls_mode=verify-ca'
  subject = new ConnectionParameters(string)
  assert.equal(subject.tls_mode, 'verify-ca')
})

suite.test('tls mode is disable by default', function () {
  clearEnv()
  var subject = new ConnectionParameters()
  assert.equal(subject.tls_mode, 'disable')
})

// restore process.env
for (var key in realEnv) {
  process.env[key] = realEnv[key]
}
