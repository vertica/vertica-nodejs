'use strict'
const helper = require('../test-helper')
const assert = require('assert')
const { ipv6Address, ipv4Address } = require('../../../lib/backup-nodes-parsers')

const suite = new helper.Suite()

suite.test('Parse an IPv6 address', function () {
  assert.ok(ipv6Address("::1")[1] === "::1", "IPv6 address with no brackets")
  assert.ok(ipv6Address("[::1]")[1] === "::1", "IPv6 address with brackets")
})

suite.test('Parse an IPv4 address', function () {
  //console.log(ipv4Address("127.0.0.1"))
  //assert.ok(ipv4Address("127.0.0.1")[1] === "127.0.0.1", "IPv4 address")
})

suite.test('Parse a port', function () {
  assert.ok(true, "")
})

suite.test('Parse an entry', function () {
  assert.ok(true, "")
})
