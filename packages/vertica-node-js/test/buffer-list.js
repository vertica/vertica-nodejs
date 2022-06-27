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

const BufferList = function () {
  this.buffers = []
}
var p = BufferList.prototype

p.add = function (buffer, front) {
  this.buffers[front ? 'unshift' : 'push'](buffer)
  return this
}

p.addInt16 = function (val, front) {
  return this.add(Buffer.from([val >>> 8, val >>> 0]), front)
}

p.getByteLength = function (initial) {
  return this.buffers.reduce(function (previous, current) {
    return previous + current.length
  }, initial || 0)
}

p.addInt32 = function (val, first) {
  return this.add(
    Buffer.from([(val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, (val >>> 0) & 0xff]),
    first
  )
}

p.addCString = function (val, front) {
  var len = Buffer.byteLength(val)
  var buffer = Buffer.alloc(len + 1)
  buffer.write(val)
  buffer[len] = 0
  return this.add(buffer, front)
}

p.addString = function (val, front) {
  var len = Buffer.byteLength(val)
  var buffer = Buffer.alloc(len)
  buffer.write(val)
  return this.add(buffer, front)
}

p.addChar = function (char, first) {
  return this.add(Buffer.from(char, 'utf8'), first)
}

p.join = function (appendLength, char) {
  var length = this.getByteLength()
  if (appendLength) {
    this.addInt32(length + 4, true)
    return this.join(false, char)
  }
  if (char) {
    this.addChar(char, true)
    length++
  }
  var result = Buffer.alloc(length)
  var index = 0
  this.buffers.forEach(function (buffer) {
    buffer.copy(result, index, 0)
    index += buffer.length
  })
  return result
}

BufferList.concat = function () {
  var total = new BufferList()
  for (var i = 0; i < arguments.length; i++) {
    total.add(arguments[i])
  }
  return total.join()
}

module.exports = BufferList
