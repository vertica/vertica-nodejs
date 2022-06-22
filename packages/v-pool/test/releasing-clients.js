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

const Pool = require('../')

const expect = require('expect.js')
const net = require('net')

describe('releasing clients', () => {
  it('removes a client which cannot be queried', async () => {
    // make a pool w/ only 1 client
    const pool = new Pool({ max: 1 })
    expect(pool.totalCount).to.eql(0)
    const client = await pool.connect()
    expect(pool.totalCount).to.eql(1)
    expect(pool.idleCount).to.eql(0)
    // reach into the client and sever its connection
    client.connection.end()

    // wait for the client to error out
    const err = await new Promise((resolve) => client.once('error', resolve))
    expect(err).to.be.ok()
    expect(pool.totalCount).to.eql(1)
    expect(pool.idleCount).to.eql(0)

    // try to return it to the pool - this removes it because its broken
    client.release()
    expect(pool.totalCount).to.eql(0)
    expect(pool.idleCount).to.eql(0)

    // make sure pool still works
    const { rows } = await pool.query('SELECT NOW()')
    expect(rows).to.have.length(1)
    await pool.end()
  })

  it('removes a client which is ending', async () => {
    // make a pool w/ only 1 client
    const pool = new Pool({ max: 1 })
    expect(pool.totalCount).to.eql(0)
    const client = await pool.connect()
    expect(pool.totalCount).to.eql(1)
    expect(pool.idleCount).to.eql(0)
    // end the client gracefully (but you shouldn't do this with pooled clients)
    client.end()

    // try to return it to the pool
    client.release()
    expect(pool.totalCount).to.eql(0)
    expect(pool.idleCount).to.eql(0)

    // make sure pool still works
    const { rows } = await pool.query('SELECT NOW()')
    expect(rows).to.have.length(1)
    await pool.end()
  })
})
