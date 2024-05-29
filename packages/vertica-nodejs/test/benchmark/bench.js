// Copyright (c) 2022-2024 Open Text.
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

const vertica = require('../../lib')

const params = {
  text:
    'select typname, typnamespace, typowner, typlen, typbyval, typcategory, typispreferred, typisdefined, typdelim, typrelid, typelem, typarray from pg_type where typtypmod = $1 and typisdefined = $2',
  values: [-1, true],
}

const insert = {
  text: 'INSERT INTO foobar(name, age) VALUES ($1, $2)',
  values: ['brian', 100],
}

const seq = {
  text: 'SELECT * FROM generate_series(1, 1000)',
}

const exec = async (client, q) => {
  await client.query({
    text: q.text,
    values: q.values,
    rowMode: 'array',
  })
}

const bench = async (client, q, time) => {
  let start = Date.now()
  let count = 0
  while (true) {
    await exec(client, q)
    count++
    if (Date.now() - start > time) {
      return count
    }
  }
}

const run = async () => {
  console.log("Benchmarking currently does not work for vertica-nodejs and has not worked since being ported from node-postgres.")
  console.log("In the future, consider fixing, or removing.")
  /*
  const client = new vertica.Client()
  await client.connect()
  console.log('start')
  await client.query('CREATE LOCAL TEMP TABLE foobar(name TEXT, age NUMERIC)')
  await client.query('CREATE LOCAL TEMP TABLE buf(name TEXT, data BYTEA)')
  await bench(client, params, 1000)
  console.log('warmup done')
  const seconds = 5

  for (let i = 0; i < 4; i++) {
    let queries = await bench(client, params, seconds * 1000)
    console.log('')
    console.log('little queries:', queries)
    console.log('qps', queries / seconds)
    console.log('on my laptop best so far seen 733 qps')

    console.log('')
    queries = await bench(client, seq, seconds * 1000)
    console.log('sequence queries:', queries)
    console.log('qps', queries / seconds)
    console.log('on my laptop best so far seen 1309 qps')

    console.log('')
    queries = await bench(client, insert, seconds * 1000)
    console.log('insert queries:', queries)
    console.log('qps', queries / seconds)
    console.log('on my laptop best so far seen 6445 qps')

    console.log('')
    console.log('Warming up bytea test')
    await client.query({
      text: 'INSERT INTO buf(name, data) VALUES ($1, $2)',
      values: ['test', Buffer.allocUnsafe(104857600)],
    })
    console.log('bytea warmup done')
    const start = Date.now()
    const results = await client.query('SELECT * FROM buf')
    const time = Date.now() - start
    console.log('bytea time:', time, 'ms')
    console.log('bytea length:', results.rows[0].data.byteLength, 'bytes')
    console.log('on my laptop best so far seen 1107ms and 104857600 bytes')
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  await client.end()
  await client.end()
  */
}

run().catch((e) => console.error(e) || process.exit(-1))
