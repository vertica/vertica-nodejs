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
var assert = require('assert')
var Client = require('../../lib/client')
var NativeClient = require('../../lib/native')

var client = new Client()
var nativeClient = new NativeClient()

client.connect()
nativeClient.connect((err) => {
  client.query('SELECT alsdkfj', (err) => {
    client.end()

    nativeClient.query('SELECT lkdasjfasd', (nativeErr) => {
      for (var key in nativeErr) {
        assert.equal(err[key], nativeErr[key], `Expected err.${key} to equal nativeErr.${key}`)
      }
      nativeClient.end()
    })
  })
})
