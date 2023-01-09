/**
 * @license
 * Copyright (c) 2022 Micro Focus or one of its affiliates.
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

import { Writer } from './buffer-writer'

const enum code {
  startup = 0x70,
  query = 0x51,
  parse = 0x50,
  bind = 0x42,
  execute = 0x45,
  flush = 0x48,
  sync = 0x53,
  end = 0x58,
  close = 0x43,
  describe = 0x44,
  copyFromChunk = 0x64,
  copyDone = 0x63,
  copyFail = 0x66,
}

const writer = new Writer()
const PROTOCOL_MAJOR_FIXED = 3  // these have no bearing in new servers with protocol version >= 3.7
const PROTOCOL_MINOR_FIXED = 5  // these are required but unused

const startup = (opts: Record<string, string>): Buffer => {
  // protocol version
  writer.addInt16(PROTOCOL_MAJOR_FIXED).addInt16(PROTOCOL_MINOR_FIXED) // equivalent to adding Int32 (MAJOR << 16 | MINOR)
  for (const key of Object.keys(opts)) {
    if (key === 'protocol_version') { // the protocol_version is added as a 32 bit integer
      continue
    }
    writer.addCString(key).addCString(opts[key])
  }
  writer.addCString('protocol_version').addInt32(parseInt(opts['protocol_version']))
  writer.addCString('client_encoding').addCString('UTF8')

  var bodyBuffer = writer.addCString('').flush()
  // this message is sent without a code

  var length = bodyBuffer.length + 4 // server expects length of message to include the int32 telling the length

  return new Writer().addInt32(length).add(bodyBuffer).flush()
}

const requestSsl = (): Buffer => {
  const request = Buffer.allocUnsafe(8)
  request.writeInt32BE(8, 0)
  request.writeInt32BE(80877103, 4)
  return request
}

const password = (password: string): Buffer => {
  return writer.addCString(password).flush(code.startup)
}

const query = (text: string): Buffer => {
  return writer.addCString(text).flush(code.query)
}

type ParseOpts = {
  name?: string
  types?: number[]
  text: string
}

const emptyArray: any[] = []

const parse = (query: ParseOpts): Buffer => {
  // expect something like this:
  // { name: 'queryName',
  //   text: 'select * from blah',
  //   types: ['int8', 'bool'] }

  // normalize missing query names to allow for null
  const name = query.name || ''
  if (name.length > 63) {
    /* eslint-disable no-console */
    console.error('Warning! Postgres only supports 63 characters for query names.')
    console.error('You supplied %s (%s)', name, name.length)
    console.error('This can cause conflicts and silent errors executing queries')
    /* eslint-enable no-console */
  }

  const types = query.types || emptyArray

  var len = types.length

  var buffer = writer
    .addCString(name) // name of query
    .addCString(query.text) // actual query text
    .addInt16(len)

  for (var i = 0; i < len; i++) {
    buffer.addInt32(types[i])
  }

  return writer.flush(code.parse)
}

type ValueMapper = (param: any, index: number) => any

type BindOpts = {
  portal?: string
  binary?: boolean
  statement?: string
  values?: any[]
  // optional map from JS value to postgres value per parameter
  valueMapper?: ValueMapper
  dataTypeIDs?: number[]
}

const paramWriter = new Writer()

// make this a const enum so typescript will inline the value
const enum ParamType {
  TEXT = 0,
  BINARY = 1,
}

const writeValues = function (values: any[], valueMapper?: ValueMapper): void {
  for (let i = 0; i < values.length; i++) {
    const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i]
    if (mappedVal == null) {
      // write -1 to the param writer to indicate null
      paramWriter.addInt32(-1)
    } else if (mappedVal instanceof Buffer) {
      // add the buffer to the param writer
      paramWriter.addInt32(mappedVal.length)
      paramWriter.add(mappedVal)
    } else {
      paramWriter.addInt32(Buffer.byteLength(mappedVal))
      paramWriter.addString(mappedVal)
    }
  }
}

const bind = (config: BindOpts = {}): Buffer => {
  // normalize config
  const portal = config.portal || ''
  const statement = config.statement || ''
  const binary = config.binary || false
  const values = config.values || emptyArray
  const parameterCount = values.length
  const dataTypeIDs = config.dataTypeIDs || emptyArray
  writer.addCString(portal).addCString(statement)
  // [VERTICA specific] The parameter format codes need to be added up front instead of being interleaved with the parameter values
  // parameter format codes.

  writer.addInt16(0) // tell the server that all parameter format codes from the driver will be default, text
  writer.addInt16(parameterCount) // number of parameters, must match number needed by query
  // [VERTICA specific] The type OIDs need to be added here
  // OIDs
  for (let i = 0; i < parameterCount; i++) {
    writer.addInt32(dataTypeIDs[i])
  }

  writeValues(values, config.valueMapper)
  writer.add(paramWriter.flush())

  // result format codes
  // binary transfer not supported, will all be default, text all the time
  writer.addInt16(0)

  return writer.flush(code.bind)
}

type ExecOpts = {
  portal?: string
  rows?: number
}

const emptyExecute = Buffer.from([code.execute, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00])

const execute = (config?: ExecOpts): Buffer => {
  // this is the happy path for most queries
  if (!config || (!config.portal && !config.rows)) {
    return emptyExecute
  }

  const portal = config.portal || ''
  const rows = config.rows || 0

  const portalLength = Buffer.byteLength(portal)
  const len = 4 + portalLength + 1 + 4
  // one extra bit for code
  const buff = Buffer.allocUnsafe(1 + len)
  buff[0] = code.execute
  buff.writeInt32BE(len, 1)
  buff.write(portal, 5, 'utf-8')
  buff[portalLength + 5] = 0 // null terminate portal cString
  buff.writeUInt32BE(rows, buff.length - 4)
  return buff
}

const cancel = (processID: number, secretKey: number): Buffer => {
  const buffer = Buffer.allocUnsafe(16)
  buffer.writeInt32BE(16, 0)
  buffer.writeInt16BE(1234, 4)
  buffer.writeInt16BE(5678, 6)
  buffer.writeInt32BE(processID, 8)
  buffer.writeInt32BE(secretKey, 12)
  return buffer
}

type PortalOpts = {
  type: 'S' | 'P'
  name?: string
}

const cstringMessage = (code: code, string: string): Buffer => {
  const stringLen = Buffer.byteLength(string)
  const len = 4 + stringLen + 1
  // one extra bit for code
  const buffer = Buffer.allocUnsafe(1 + len)
  buffer[0] = code
  buffer.writeInt32BE(len, 1)
  buffer.write(string, 5, 'utf-8')
  buffer[len] = 0 // null terminate cString
  return buffer
}

const emptyDescribePortal = writer.addCString('P').flush(code.describe)
const emptyDescribeStatement = writer.addCString('S').flush(code.describe)

const describe = (msg: PortalOpts): Buffer => {
  return msg.name
    ? cstringMessage(code.describe, `${msg.type}${msg.name || ''}`)
    : msg.type === 'P'
    ? emptyDescribePortal
    : emptyDescribeStatement
}

const close = (msg: PortalOpts): Buffer => {
  const text = `${msg.type}${msg.name || ''}`
  return cstringMessage(code.close, text)
}

const copyData = (chunk: Buffer): Buffer => {
  return writer.add(chunk).flush(code.copyFromChunk)
}

const copyFail = (message: string): Buffer => {
  return cstringMessage(code.copyFail, message)
}

const codeOnlyBuffer = (code: code): Buffer => Buffer.from([code, 0x00, 0x00, 0x00, 0x04])

const flushBuffer = codeOnlyBuffer(code.flush)
const syncBuffer = codeOnlyBuffer(code.sync)
const endBuffer = codeOnlyBuffer(code.end)
const copyDoneBuffer = codeOnlyBuffer(code.copyDone)

const serialize = {
  startup,
  password,
  requestSsl,
  query,
  parse,
  bind,
  execute,
  describe,
  close,
  flush: () => flushBuffer,
  sync: () => syncBuffer,
  end: () => endBuffer,
  copyData,
  copyDone: () => copyDoneBuffer,
  copyFail,
  cancel,
}

export { serialize }
