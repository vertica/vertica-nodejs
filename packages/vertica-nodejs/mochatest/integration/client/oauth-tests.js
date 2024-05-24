// Copyright (c) 2024 Open Text.
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
const vertica = require('../../../../vertica-nodejs')
const assert = require('assert')


describe('OAuth authentication', function () {
  it('connect with an OAuth access token', function(done) {
    const access_token = process.env['VTEST_OAUTH_ACCESS_TOKEN']
    if (!access_token) this.skip()
    const client = new vertica.Client({oauth_access_token: access_token})
    client.connect(err => {
      if (err) return done(err)
      client.query("SELECT authentication_method FROM sessions WHERE session_id = current_session()", (err, res) => {
        if (err) return done(err)
        assert.equal(res.rows[0].authentication_method, 'OAuth')
        client.end()
        done()
      })
    })
  })
})
