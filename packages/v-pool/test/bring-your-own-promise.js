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
const BluebirdPromise = require('bluebird')

const Pool = require('../')

const checkType = (promise) => {
  expect(promise).to.be.a(BluebirdPromise)
  return promise.catch((e) => undefined)
}

describe('Bring your own promise', function () {
  it(
    'uses supplied promise for operations',
    co.wrap(function* () {
      const pool = new Pool({ Promise: BluebirdPromise })
      const client1 = yield checkType(pool.connect())
      client1.release()
      yield checkType(pool.query('SELECT NOW()'))
      const client2 = yield checkType(pool.connect())
      // TODO - make sure pg supports BYOP as well
      client2.release()
      yield checkType(pool.end())
    })
  )

  it(
    'uses promises in errors',
    co.wrap(function* () {
      const pool = new Pool({ Promise: BluebirdPromise, port: 48484 })
      yield checkType(pool.connect())
      yield checkType(pool.end())
      yield checkType(pool.connect())
      yield checkType(pool.query())
      yield checkType(pool.end())
    })
  )
})
