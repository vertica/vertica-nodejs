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

'use strict'
require('./test-helper')
const BufferList = require('./buffer-list')
// http://developer.postgresql.org/pgdocs/postgres/protocol-message-formats.html

var buffers = {}
buffers.readyForQuery = function () {
  return new BufferList().add(Buffer.from('I')).join(true, 'Z')
}

buffers.authenticationOk = function () {
  return new BufferList().addInt32(0).join(true, 'R')
}

buffers.authenticationCleartextPassword = function () {
  return new BufferList().addInt32(3).join(true, 'R')
}

buffers.authenticationMD5Password = function () {
  return new BufferList()
    .addInt32(5)
    .add(Buffer.from([1, 2, 3, 4]))
    .addInt32(16)
    .add(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]))
    .join(true, 'R')
}

buffers.authenticationPasswordExpired = function () {
  return new BufferList()
    .addInt32(9)
    .add(Buffer.from([1, 2, 3, 4]))
    .join(true, 'R')
}

buffers.parameterStatus = function (name, value) {
  return new BufferList().addCString(name).addCString(value).join(true, 'S')
}

buffers.backendKeyData = function (processID, secretKey) {
  return new BufferList().addInt32(processID).addInt32(secretKey).join(true, 'K')
}

buffers.commandComplete = function (string) {
  return new BufferList().addCString(string).join(true, 'C')
}

buffers.rowDescription = function (fields) {
  fields = fields || []
  var buf = new BufferList()
  buf.addInt16(fields.length)
  if (!fields.length) {
    return buf
  }
  buf.addInt32(0)
  fields.forEach(function (field) {
    buf
      .addCString(field.name)
      .addInt32(0)
      .addInt32(field.tableID || 0)
      if (field.tableID) {
        buf.addCString(field.schemaName || '')
           .addCString(field.tableName || '')
      }
    buf
      .addInt16(field.columnID || 0)
      .addByte(field.isNonNative || 0x0)
      .addInt32(field.dataTypeID || 0)
      .addInt16(field.dataTypeSize || 0)
      .addInt16(field.allowsNull || 0)
      .addInt16(field.isIdentity || 0)
      .addInt32(field.dataTypeModifier || 0)
      .addInt16(field.formatCode || 0)
  })
  return buf.join(true, 'T')
}

buffers.dataRow = function (columns) {
  columns = columns || []
  var buf = new BufferList()
  buf.addInt16(columns.length)
  columns.forEach(function (col) {
    if (col == null) {
      buf.addInt32(-1)
    } else {
      var strBuf = Buffer.from(col, 'utf8')
      buf.addInt32(strBuf.length)
      buf.add(strBuf)
    }
  })
  return buf.join(true, 'D')
}

buffers.error = function (fields) {
  return errorOrNotice(fields).join(true, 'E')
}

buffers.notice = function (fields) {
  return errorOrNotice(fields).join(true, 'N')
}

var errorOrNotice = function (fields) {
  fields = fields || []
  var buf = new BufferList()
  fields.forEach(function (field) {
    buf.addChar(field.type)
    buf.addCString(field.value)
  })
  return buf.add(Buffer.from([0])) // terminator
}

buffers.parseComplete = function () {
  return new BufferList().join(true, '1')
}

buffers.bindComplete = function () {
  return new BufferList().join(true, '2')
}

buffers.emptyQuery = function () {
  return new BufferList().join(true, 'I')
}

buffers.portalSuspended = function () {
  return new BufferList().join(true, 's')
}

module.exports = buffers
