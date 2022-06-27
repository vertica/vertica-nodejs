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
var domain = require('domain')
var helper = require('./../test-helper')
var Client = require('./../../lib/native')
const suite = new helper.Suite()

suite.test('fires callback with results', function (done) {
  var client = new Client(helper.config)
  client.connect()
  client.query(
    'SELECT 1 as num',
    assert.calls(function (err, result) {
      assert(!err)
      assert.equal(result.rows[0].num, 1)
      client.query(
        'SELECT * FROM person WHERE name = $1',
        ['Brian'],
        assert.calls(function (err, result) {
          assert(!err)
          assert.equal(result.rows[0].name, 'Brian')
          client.end(done)
        })
      )
    })
  )
})

suite.test('preserves domain', function (done) {
  var dom = domain.create()

  dom.run(function () {
    var client = new Client(helper.config)
    assert.ok(dom === require('domain').active, 'domain is active')
    client.connect()
    client.query('select 1', function () {
      assert.ok(dom === require('domain').active, 'domain is still active')
      client.end(done)
    })
  })
})
