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

// This test is meant to be spawned from idle-timeout.js
if (module === require.main) {
  const allowExitOnIdle = process.env.ALLOW_EXIT_ON_IDLE === '1'
  const Pool = require('../index')

  const pool = new Pool({ idleTimeoutMillis: 200, ...(allowExitOnIdle ? { allowExitOnIdle: true } : {}) })
  pool.query('SELECT NOW()', (err, res) => console.log('completed first'))
  pool.on('remove', () => {
    console.log('removed')
    done()
  })

  setTimeout(() => {
    pool.query('SELECT 40/25', (err, res) => console.log('completed second'))
  }, 50)
}
