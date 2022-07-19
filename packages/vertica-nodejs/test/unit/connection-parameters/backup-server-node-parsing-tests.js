'use strict'
const helper = require('../test-helper')
const assert = require('assert')
const { matchLiteral, host, port, ipv6Address, ipv4Address, entry, backupServerNodes } = require('../../../lib/backup-nodes-parsers')

const suite = new helper.Suite()

suite.test('Parse a given string literal', function () {
  assert.ok((matchLiteral("foo")("foo"))[1] === null, "match string literal foo")
  assert.ok((matchLiteral("bar")("bar"))[1] === null, "match string literal bar")
  assert.throws(() => matchLiteral("foo")("bar"), "try to match foo with bar")
})

suite.test('Parse an IPv6 address', function () {
  assert.ok(ipv6Address("::1")[1] === "::1", "IPv6 address with no brackets")
  assert.ok(ipv6Address("[::1]")[1] === "::1", "IPv6 address with brackets")
  assert.ok(ipv6Address("[::1]:1234")[1] === "::1", "IPv6 address with port")
  assert.throws(() => ipv6Address("localhost"), "Regular host name")
  assert.throws(() => ipv6Address("127.0.0.1"), "IPv4 address")
})

suite.test('Parse an IPv4 address', function () {
  assert.ok(ipv4Address("127.0.0.1")[1] === "127.0.0.1", "IPv4 address")
  assert.ok(ipv4Address("127.0.0.1:5234")[1] === "127.0.0.1", "IPv4 address with port")
  assert.throws(() => ipv4Address("localhost"), "Regular host name")
  assert.throws(() => ipv4Address("::1"), "IPv6 address")
})

suite.test('Parse a host name', function () {
  assert.ok(host("localhost")[1] === "localhost", "host name")
  assert.ok(host("localhost:5234")[1] === "localhost", "host name with port")
  assert.ok(host("vertica.com")[1] === "vertica.com", "host name with dot in it")
  assert.ok(host("vertica.com:5234")[1] === "vertica.com", "host name with dot in it and port")
})

// Currently, we parse anything as a port. We could add validation to make sure it's numeric, but it's going to be checked by parseInt anyway
suite.test('Parse a port', function () {
  assert.ok(port("1234")[1] === "1234", "Port number")
})

suite.test('Parse an entry', function () {
  var result = entry("::1")[1]
  assert.ok(result[0] === "::1", "IPv6 address with no brackets - host")
  assert.ok(result[1] === null, "IPv6 address with no brackets - port")

  result = entry("[::1]")[1]
  assert.ok(result[0] === "::1", "IPv6 address with brackets - host")
  assert.ok(result[1] === null, "IPv6 address with brackets - port")

  result = entry("[::1]:1234")[1]
  assert.ok(result[0] === "::1", "IPv6 address with brackets and port - host")
  assert.ok(result[1] === "1234", "IPv6 address with brackets and port - port")

  result = entry("127.0.0.1")[1]
  assert.ok(result[0] === "127.0.0.1", "IPv4 address - host")
  assert.ok(result[1] === null, "IPv4 address - port")

  result = entry("127.0.0.1:5433")[1]
  assert.ok(result[0] === "127.0.0.1", "IPv4 address with port - host")
  assert.ok(result[1] === "5433", "IPv4 address with port - port")

  result = entry("localhost")[1]
  assert.ok(result[0] === "localhost", "host name - host")
  assert.ok(result[1] === null, "host name - port")

  result = entry("localhost:5433")[1]
  assert.ok(result[0] === "localhost", "host name with port - host")
  assert.ok(result[1] === "5433", "host name with port - port")
})

suite.test('Parse a backup server nodes list', function () {
  var input = "::1,[::1],[::1]:5444,foobar,localhost:1234,1.2.3.4,1.3.5.6:9000"
  var result = backupServerNodes(input)
  assert.ok(result[0][0] === "::1", "IPv6 address - host")
  assert.ok(result[0][1] === null, "IPv6 address - port")

  assert.ok(result[1][0] === "::1", "IPv6 address with brackets - host")
  assert.ok(result[1][1] === null, "IPv6 address with brackets - port")

  assert.ok(result[2][0] === "::1", "IPv6 address with brackets and port - host")
  assert.ok(result[2][1] === "5444", "IPv6 address with brackets and port - port")

  assert.ok(result[3][0] === "foobar", "host name - host")
  assert.ok(result[3][1] === null, "host name - port")

  assert.ok(result[4][0] === "localhost", "host name and port - host")
  assert.ok(result[4][1] === "1234", "host name and port - port")

  assert.ok(result[5][0] === "1.2.3.4", "IPv4 address - host")
  assert.ok(result[5][1] === null, "IPv4 address - port")

  assert.ok(result[6][0] === "1.3.5.6", "IPv4 address with port - host")
  assert.ok(result[6][1] === "9000", "IPv4 address with port - port")
})
