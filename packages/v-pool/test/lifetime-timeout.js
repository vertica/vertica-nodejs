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
const co = require('co')
const expect = require('expect.js')

const describe = require('mocha').describe
const it = require('mocha').it
const path = require('path')

const Pool = require('../')

describe('lifetime timeout', () => {
  it('connection lifetime should expire and remove the client', (done) => {
    const pool = new Pool({ maxLifetimeSeconds: 1 })
    pool.query('SELECT NOW()')
    pool.on('remove', () => {
      console.log('expired while idle - on-remove event')
      expect(pool.expiredCount).to.equal(0)
      expect(pool.totalCount).to.equal(0)
      done()
    })
  })
  it('connection lifetime should expire and remove the client after the client is done working', (done) => {
    const pool = new Pool({ maxLifetimeSeconds: 1 })
    pool.query('SELECT sleep(2)')
    pool.on('remove', () => {
      console.log('expired while busy - on-remove event')
      expect(pool.expiredCount).to.equal(0)
      expect(pool.totalCount).to.equal(0)
      done()
    })
  }).timeout(3000)
  it(
    'can remove expired clients and recreate them',
    co.wrap(function* () {
      const pool = new Pool({ maxLifetimeSeconds: 1 })
      let query = pool.query('SELECT sleep(1)')
      expect(pool.expiredCount).to.equal(0)
      expect(pool.totalCount).to.equal(1)
      yield query
      expect(pool.expiredCount).to.equal(0)
      expect(pool.totalCount).to.equal(0)
      yield pool.query('SELECT NOW()')
      expect(pool.expiredCount).to.equal(0)
      expect(pool.totalCount).to.equal(1)
    })
  )
})
