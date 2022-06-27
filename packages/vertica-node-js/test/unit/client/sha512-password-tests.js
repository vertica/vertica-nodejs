'use strict'
var helper = require('./test-helper')
const BufferList = require('../../buffer-list')
var utils = require('../../../lib/utils')

// Test not currently working, waiting on in progress changes that fix the equivalent md5 test
test('sha512 authentication', function () {
  var client = helper.createClient()
  client.password = '!'
  var salt = Buffer.from([1, 2, 3, 4])
  var userSalt = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
  client.connection.emit('authenticationSHA512Password', { salt: salt, userSalt: userSalt })

  test('responds', function () {
    assert.lengthIs(client.connection.stream.packets, 1)
    test('should have correct encrypted data', function () {
      var password = utils.postgresSha512PasswordHash(client.password, salt, userSalt)
      // how do we want to test this?
      assert.equalBuffers(client.connection.stream.packets[0], new BufferList().addCString(password).join(true, 'p'))
    })
  })
})
