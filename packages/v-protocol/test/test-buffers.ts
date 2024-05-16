/**
 * @license
 * Copyright (c) 2022-2023 Open Text.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

// http://developer.postgresql.org/pgdocs/postgres/protocol-message-formats.html
import BufferList from './buffer-list'

const buffers = {
  readyForQuery: function () {
    return new BufferList().add(Buffer.from('I')).join(true, 'Z')
  },

  authenticationOk: function () {
    return new BufferList().addInt32(0).join(true, 'R')
  },

  authenticationCleartextPassword: function () {
    return new BufferList().addInt32(3).join(true, 'R')
  },

  authenticationMD5Password: function () {
    return new BufferList()
      .addInt32(5)
      .add(Buffer.from([1, 2, 3, 4]))
      .addInt32(16)
      .add(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]))
      .join(true, 'R')
  },

  parameterStatus: function (name: string, value: string) {
    return new BufferList().addCString(name).addCString(value).join(true, 'S')
  },

  backendKeyData: function (processID: number, secretKey: number) {
    return new BufferList().addInt32(processID).addInt32(secretKey).join(true, 'K')
  },

  commandComplete: function (string: string) {
    return new BufferList().addCString(string).join(true, 'C')
  },

  rowDescription: function (fields: any[]) {
    fields = fields || []
    var buf = new BufferList()
    buf.addInt16(fields.length)
    fields.forEach(function (field) {
      buf
        .addCString(field.name)
        .addInt32(field.tableID || 0)
        .addInt16(field.attributeNumber || 0)
        .addInt32(field.dataTypeID || 0)
        .addInt16(field.dataTypeSize || 0)
        .addInt32(field.typeModifier || 0)
        .addInt16(field.formatCode || 0)
    })
    return buf.join(true, 'T')
  },

  parameterDescription: function (dataTypeIDs: number[]) {
    dataTypeIDs = dataTypeIDs || []
    var buf = new BufferList()
    buf.addInt16(dataTypeIDs.length)
    dataTypeIDs.forEach(function (dataTypeID) {
      buf.addInt32(dataTypeID)
    })
    return buf.join(true, 't')
  },

  dataRow: function (columns: any[]) {
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
  },

  error: function (fields: any) {
    return buffers.errorOrNotice(fields).join(true, 'E')
  },

  notice: function (fields: any) {
    return buffers.errorOrNotice(fields).join(true, 'N')
  },

  errorOrNotice: function (fields: any) {
    fields = fields || []
    var buf = new BufferList()
    fields.forEach(function (field: any) {
      buf.addChar(field.type)
      buf.addCString(field.value)
    })
    return buf.add(Buffer.from([0])) // terminator
  },

  parseComplete: function () {
    return new BufferList().join(true, '1')
  },

  bindComplete: function () {
    return new BufferList().join(true, '2')
  },

  emptyQuery: function () {
    return new BufferList().join(true, 'I')
  },

  portalSuspended: function () {
    return new BufferList().join(true, 's')
  },

  closeComplete: function () {
    return new BufferList().join(true, '3')
  },

  copyIn: function (cols: number) {
    const list = new BufferList()
      // text mode
      .addByte(0)
      // column count
      .addInt16(cols)
    for (let i = 0; i < cols; i++) {
      list.addInt16(i)
    }
    return list.join(true, 'G')
  },

  loadFile: function (fileName: string) {
    const list = new BufferList()
    list.addCString(fileName)
    return list.join(true, 'H')
  },

  copyData: function (bytes: Buffer) {
    return new BufferList().add(bytes).join(true, 'd')
  },

  copyDone: function () {
    return new BufferList().join(true, 'c')
  },
}

export default buffers
