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
const co = require('co')
const _ = require('lodash')

const describe = require('mocha').describe
const it = require('mocha').it

const Pool = require('../')

describe('pool size of 1', () => {
  it(
    'can create a single client and use it once',
    co.wrap(function* () {
      const pool = new Pool({ max: 1 })
      expect(pool.waitingCount).to.equal(0)
      const client = yield pool.connect()
      const res = yield client.query('SELECT ?::varchar as name', ['hi'])
      expect(res.rows[0].name).to.equal('hi')
      client.release()
      pool.end()
    })
  )

  it(
    'can create a single client and use it multiple times',
    co.wrap(function* () {
      const pool = new Pool({ max: 1 })
      expect(pool.waitingCount).to.equal(0)
      const client = yield pool.connect()
      const wait = pool.connect()
      expect(pool.waitingCount).to.equal(1)
      client.release()
      const client2 = yield wait
      expect(client).to.equal(client2)
      client2.release()
      return yield pool.end()
    })
  )

  it(
    'can only send 1 query at a time',
    co.wrap(function* () {
      
      // This operation takes some additional time
      this.timeout(10000)

      const pool = new Pool({ max: 1 })

      const queryText = "SELECT COUNT(*) as counts FROM query_requests WHERE is_executing='t' AND request LIKE ?"
      const queryTextMatch = "SELECT COUNT(*) as counts FROM query_requests WHERE is_executing='t' AND request %"
      const queries = _.times(20, () => pool.query(queryText, [queryTextMatch]))
      const results = yield Promise.all(queries)
      const counts = results.map((res) => parseInt(res.rows[0].counts, 10))
      expect(counts).to.eql(_.times(20, (i) => 1))
      return yield pool.end()
    })
  )
})
