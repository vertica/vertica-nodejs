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
var EventEmitter = require('events').EventEmitter

var helper = require('../test-helper')
var Connection = require('../../lib/connection')

global.MemoryStream = function () {
  EventEmitter.call(this)
  this.packets = []
}

helper.sys.inherits(MemoryStream, EventEmitter)

var p = MemoryStream.prototype

p.connect = function () {
  // NOOP
}

p.setNoDelay = () => {}

p.write = function (packet, cb) {
  this.packets.push(packet)
  if (cb) {
    cb()
  }
}

p.end = function () {
  p.closed = true
}

p.setKeepAlive = function () {}
p.closed = false
p.writable = true

const createClient = async function () {
  var stream = new MemoryStream()
  var client = new Client({
    connection: new Connection({ stream: stream }),
  })
  await client.connect()
  return client
}

module.exports = Object.assign({}, helper, {
  createClient: createClient,
})
