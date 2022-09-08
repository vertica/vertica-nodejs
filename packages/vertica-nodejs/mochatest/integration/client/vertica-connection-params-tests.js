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
const vertica = require('../../../lib')
const assert = require('assert')

describe('vertica label connection parameter', function () {
  it('has a default value that is used when left unspecified', function(done) {
    //assert current default value
    assert.equal(vertica.defaults.client_label, '')

    //assert creating a client connection will use default label
    var client_default = new vertica.Client()
    assert.equal(client_default.connectionParameters.client_label, vertica.defaults.client_label)
    client_default.connect()
    client_default.query('SELECT GET_CLIENT_LABEL()', (err, res) => {
      if (err){
        console.log(err)
        assert(false)
      } 
      assert.equal(res.rows[0]['GET_CLIENT_LABEL'], vertica.defaults.client_label)
      client_default.end()
      done()
    })
  })    

  it('can be specified and used in a client connection', function(done) {
    // assert creating a client connection with specified label will persist
    var client_test = new vertica.Client({client_label: 'distinctLabel'})
    assert.equal(client_test.connectionParameters.client_label, 'distinctLabel')
    client_test.connect()
    client_test.query('SELECT GET_CLIENT_LABEL()', (err, res) => {
      if (err){
        console.log(err)
        assert(false)
      } 
      assert.equal(res.rows[0]['GET_CLIENT_LABEL'], 'distinctLabel')
      client_test.end()
      done()
    })
  })
})

describe('vertica protocol_version connection parameter', function () {
  it('does not have a default value because it is hardcoded', function() {
    // assert current default behavior, hardcoded because only one protocol version is supoprted right now
    assert.equal(vertica.defaults.protocol_version, undefined)
  })

  it('provides a maximum value for the protocol version used by the server', function(done) {
    const client = new vertica.Client({client_label: 'pvTest'}) // make easy to find session
    client.connect()
    client.query("SELECT effective_protocol from sessions where client_label = 'pvTest'", (err, res) => {
      if (err) assert(false)
      var pv = res.rows[0]['effective_protocol'] // string of form "Major.minor"
      var int32pv = (parseInt(pv.split(".")[0]) << 16 | parseInt(pv.split(".")[1])) // int32 from (M << 16 | m)
      assert(int32pv <= client.protocol_version) // server isn't trying to talk in a protocol newer than we know
      client.end()
      done()
    })
  })
})

const testBackupNode = function(addr) {
  const badAddress = 'oops'
  const client = new vertica.Client({host: badAddress, backup_server_node: addr})
  client.connect()
  client.query("SELECT NOW()", (err) => {
    assert(!err)
    client.end()
  })
}

describe('vertica backup_server_node connection parameter', function() {
  it('has a default value that is used when left unspecified', function() {
    // assert current default behavior
    assert.equal(vertica.defaults.backup_server_node, '')
  })

  it('is correctly parsed and used when primary node fails', async function(done) {
    //only finish this test if there is a vertica server listening on localhost:5433. This will always run in CI
    const client = new vertica.Client({host: '127.0.0.1', port: 5433})
    const addresses = ['127.0.0.1', '127.0.0.1:5433', '0:0:0:0:0:0:0:1', '::1', '[0:0:0:0:0:0:0:1]:5433', '[0:0:0:0:0:0:0:1]', 'localhost', 'localhost:5433']
    client.connect().then(() => {
      client.end()
      addresses.forEach(testBackupNode)
    }).catch(() => {
      console.log("Skipping test ")
    })
    done()
  })
})
