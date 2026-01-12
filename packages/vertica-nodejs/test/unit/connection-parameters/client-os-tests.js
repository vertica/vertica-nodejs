'use strict'
const helper = require('../test-helper')
const assert = require('assert')
const os = require('os')
const ConnectionParameters = require('../../../lib/connection-parameters')

const suite = new helper.Suite()

suite.test('client_os provides detailed OS string', function () {
  const subject = new ConnectionParameters()
  const expected = `${os.type()} ${os.release()} ${os.arch()}`
  assert.equal(subject.client_os, expected)
})

suite.test('client_os falls back to os.platform() when detailed retrieval fails', function () {
  const originalType = os.type
  const originalRelease = os.release
  const originalArch = os.arch
  try {
    os.type = function () { throw new Error('type fail') }
    os.release = function () { throw new Error('release fail') }
    os.arch = function () { throw new Error('arch fail') }

    const subject = new ConnectionParameters()
    assert.equal(subject.client_os, os.platform())
  } finally {
    os.type = originalType
    os.release = originalRelease
    os.arch = originalArch
  }
})

suite.test('client_os uses "unknown" when both detailed and platform retrieval fail', function () {
  const originalType = os.type
  const originalRelease = os.release
  const originalArch = os.arch
  const originalPlatform = os.platform
  try {
    os.type = function () { throw new Error('type fail') }
    os.release = function () { throw new Error('release fail') }
    os.arch = function () { throw new Error('arch fail') }
    os.platform = function () { throw new Error('platform fail') }

    const subject = new ConnectionParameters()
    assert.equal(subject.client_os, 'unknown')
  } finally {
    os.type = originalType
    os.release = originalRelease
    os.arch = originalArch
    os.platform = originalPlatform
  }
})
