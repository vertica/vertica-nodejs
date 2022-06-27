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
var helper = require('./../test-helper')

if (helper.args.native) {
  Client = require('./../../lib/native')
  helper.Client = Client
  helper.vertica = helper.vertica.native
}

// creates a client from cli parameters
helper.client = function (cb) {
  var client = new Client()
  client.connect(cb)
  return client
}

helper.versionGTE = function (client, testVersion, callback) {
  client.query(
    'SHOW server_version_num',
    assert.calls(function (err, result) {
      if (err) return callback(err)
      var version = parseInt(result.rows[0].server_version_num, 10)
      return callback(null, version >= testVersion)
    })
  )
}

// export parent helper stuffs
module.exports = helper
