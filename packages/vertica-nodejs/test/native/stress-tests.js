// Copyright (c) 2022 Micro Focus or one of its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'
var helper = require('../test-helper')
var Client = require('../../lib/native')
var Query = Client.Query

test('many rows', function () {
  var client = new Client(helper.config)
  client.connect()
  var q = client.query(new Query('SELECT * FROM person'))
  var rows = []
  q.on('row', function (row) {
    rows.push(row)
  })
  assert.emits(q, 'end', function () {
    client.end()
    assert.lengthIs(rows, 26)
  })
})

test('many queries', function () {
  var client = new Client(helper.config)
  client.connect()
  var count = 0
  var expected = 100
  for (var i = 0; i < expected; i++) {
    var q = client.query(new Query('SELECT * FROM person'))
    assert.emits(q, 'end', function () {
      count++
    })
  }
  assert.emits(client, 'drain', function () {
    client.end()
    assert.equal(count, expected)
  })
})

test('many clients', function () {
  var clients = []
  for (var i = 0; i < 10; i++) {
    clients.push(new Client(helper.config))
  }
  clients.forEach(function (client) {
    client.connect()
    for (var i = 0; i < 20; i++) {
      client.query('SELECT * FROM person')
    }
    assert.emits(client, 'drain', function () {
      client.end()
    })
  })
})
