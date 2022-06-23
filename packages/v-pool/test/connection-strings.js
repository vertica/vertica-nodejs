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

const expect = require('expect.js')
const describe = require('mocha').describe
const it = require('mocha').it
const Pool = require('../')

describe('Connection strings', function () {
  it('pool delegates connectionString property to client', function (done) {
    const connectionString = 'postgres://foo:bar@baz:1234/xur'

    const pool = new Pool({
      // use a fake client so we can check we're passed the connectionString
      Client: function (args) {
        expect(args.connectionString).to.equal(connectionString)
        return {
          connect: function (cb) {
            cb(new Error('testing'))
          },
          on: function () {},
        }
      },
      connectionString: connectionString,
    })

    pool.connect(function (err, client) {
      expect(err).to.not.be(undefined)
      done()
    })
  })
})
