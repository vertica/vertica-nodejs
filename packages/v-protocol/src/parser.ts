/**
 * @license
 * Copyright (c) 2022-2024 Open Text.
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

import { TransformOptions } from 'stream'
import {
  Mode,
  bindComplete,
  parseComplete,
  closeComplete,
  noData,
  portalSuspended,
  copyDone,
  emptyQuery,
  ReadyForQueryMessage,
  CommandCompleteMessage,
  RowDescriptionMessage,
  ParameterDescriptionMessage,
  Parameter,
  CommandDescriptionMessage,
  Field,
  DataRowMessage,
  ParameterStatusMessage,
  BackendKeyDataMessage,
  DatabaseError,
  BackendMessage,
  MessageName,
  AuthenticationMD5Password,
  NoticeMessage,
  AuthenticationSHA512Password,
  VerifyFilesMessage,
  LoadFileMessage,
  CopyInResponseMessage,
  EndOfBatchResponse,
  WriteFileMessage,
} from './backend-messages'
import { BufferReader } from './buffer-reader'
import assert from 'assert'

// every message is prefixed with a single bye
const CODE_LENGTH = 1
// every message has an int32 length which includes itself but does
// NOT include the code in the length
const LEN_LENGTH = 4

const HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH

export type Packet = {
  code: number
  packet: Buffer
}

const emptyBuffer = Buffer.allocUnsafe(0)

type StreamOptions = TransformOptions & {
  mode: Mode
}

const enum MessageCodes {
  ParseComplete               = 0x31, // 1
  BindComplete                = 0x32, // 2
  CloseComplete               = 0x33, // 3
  CommandComplete             = 0x43, // C
  DataRow                     = 0x44, // D
  ErrorMessage                = 0x45, // E
  VerifyFiles                 = 0x46, // F
  CopyInResponse              = 0x47, // G
  LoadFile                    = 0x48, // H
  EmptyQuery                  = 0x49, // I
  EndOfBatchResponse          = 0x4a, // J
  BackendKeyData              = 0x4b, // K
  NoticeMessage               = 0x4e, // N
  WriteFile                   = 0x4f, // O
  AuthenticationResponse      = 0x52, // R
  ParameterStatus             = 0x53, // S
  RowDescriptionMessage       = 0x54, // T
  ReadyForQuery               = 0x5a, // Z
  CopyDoneResponse            = 0x63, // c
  CommandDescriptionMessage   = 0x6d, // m
  NoData                      = 0x6e, // n
  PortalSuspended             = 0x73, // s
  ParameterDescriptionMessage = 0x74, // t
}

export type MessageCallback = (msg: BackendMessage) => void

export class Parser {
  private buffer: Buffer = emptyBuffer
  private bufferLength: number = 0
  private bufferOffset: number = 0
  private reader = new BufferReader()
  private mode: Mode

  constructor(opts?: StreamOptions) {
    if (opts?.mode === 'binary') {
      throw new Error('Binary mode not supported yet')
    }
    this.mode = opts?.mode || 'text'
  }

  public parse(buffer: Buffer, callback: MessageCallback) {
    this.mergeBuffer(buffer)
    const bufferFullLength = this.bufferOffset + this.bufferLength
    let offset = this.bufferOffset
    while (offset + HEADER_LENGTH <= bufferFullLength) {
      // code is 1 byte long - it identifies the message type
      const code = this.buffer[offset]
      // length is 1 Uint32BE - it is the length of the message EXCLUDING the code
      const length = this.buffer.readUInt32BE(offset + CODE_LENGTH)
      const fullMessageLength = CODE_LENGTH + length
      if (fullMessageLength + offset <= bufferFullLength) {
        const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer)
        callback(message)
        offset += fullMessageLength
      } else {
        break
      }
    }
    if (offset === bufferFullLength) {
      // No more use for the buffer
      this.buffer = emptyBuffer
      this.bufferLength = 0
      this.bufferOffset = 0
    } else {
      // Adjust the cursors of remainingBuffer
      this.bufferLength = bufferFullLength - offset
      this.bufferOffset = offset
    }
  }

  private mergeBuffer(buffer: Buffer): void {
    if (this.bufferLength > 0) {
      const newLength = this.bufferLength + buffer.byteLength
      const newFullLength = newLength + this.bufferOffset
      if (newFullLength > this.buffer.byteLength) {
        // We can't concat the new buffer with the remaining one
        let newBuffer: Buffer
        if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
          // We can move the relevant part to the beginning of the buffer instead of allocating a new buffer
          newBuffer = this.buffer
        } else {
          // Allocate a new larger buffer
          let newBufferLength = this.buffer.byteLength * 2
          while (newLength >= newBufferLength) {
            newBufferLength *= 2
          }
          newBuffer = Buffer.allocUnsafe(newBufferLength)
        }
        // Move the remaining buffer to the new one
        this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength)
        this.buffer = newBuffer
        this.bufferOffset = 0
      }
      // Concat the new buffer with the remaining one
      buffer.copy(this.buffer, this.bufferOffset + this.bufferLength)
      this.bufferLength = newLength
    } else {
      this.buffer = buffer
      this.bufferOffset = 0
      this.bufferLength = buffer.byteLength
    }
  }

  private handlePacket(offset: number, code: number, length: number, bytes: Buffer): BackendMessage {
    switch (code) {
      case MessageCodes.BindComplete:
        return bindComplete
      case MessageCodes.ParseComplete:
        return parseComplete
      case MessageCodes.CloseComplete:
        return closeComplete
      case MessageCodes.NoData:
        return noData
      case MessageCodes.PortalSuspended:
        return portalSuspended
      case MessageCodes.CopyDoneResponse:
        return copyDone
      case MessageCodes.EmptyQuery:
        return emptyQuery
      case MessageCodes.EndOfBatchResponse:
        return EndOfBatchResponse
      case MessageCodes.DataRow:
        return this.parseDataRowMessage(offset, length, bytes)
      case MessageCodes.CommandComplete:
        return this.parseCommandCompleteMessage(offset, length, bytes)
      case MessageCodes.ReadyForQuery:
        return this.parseReadyForQueryMessage(offset, length, bytes)
      case MessageCodes.AuthenticationResponse:
        return this.parseAuthenticationResponse(offset, length, bytes)
      case MessageCodes.ParameterStatus:
        return this.parseParameterStatusMessage(offset, length, bytes)
      case MessageCodes.BackendKeyData:
        return this.parseBackendKeyData(offset, length, bytes)
      case MessageCodes.ErrorMessage:
        return this.parseErrorMessage(offset, length, bytes, 'error')
      case MessageCodes.NoticeMessage:
        return this.parseErrorMessage(offset, length, bytes, 'notice')
      case MessageCodes.RowDescriptionMessage:
        return this.parseRowDescriptionMessage(offset, length, bytes)
      case MessageCodes.ParameterDescriptionMessage:
        return this.parseParameterDescriptionMessage(offset, length, bytes)
      case MessageCodes.CommandDescriptionMessage:
        return this.parseCommandDescriptionMessage(offset, length, bytes)
      case MessageCodes.CopyInResponse:
        return this.parseCopyInResponseMessage(offset, length, bytes)
      case MessageCodes.LoadFile:
        return this.parseLoadFileMessage(offset, length, bytes)
      case MessageCodes.VerifyFiles:
        return this.parseVerifyFilesMessage(offset, length, bytes)
      case MessageCodes.WriteFile:
        return this.parseWriteFileMessage(offset, length, bytes)
      default:
        assert.fail(`unknown message code: ${code.toString(16)}`)
    }
  }

  private parseReadyForQueryMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const status = this.reader.string(1)
    return new ReadyForQueryMessage(length, status)
  }

  private parseCommandCompleteMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const text = this.reader.cstring()
    return new CommandCompleteMessage(length, text)
  }

  private parseVerifyFilesMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const numFiles = this.reader.int16() //int16 number of files, n
    let fileNames: string[] | null = null;
    if (numFiles !== 0) {
      fileNames = new Array(numFiles);
      for (let i = 0; i < numFiles; i++) {
        fileNames[i] = this.reader.cstring(); // string[n], name of each file
      }
    }
    
    const rejectFile = this.reader.cstring() //string reject file name
    const exceptionFile = this.reader.cstring() //string exceptions file name
    return new VerifyFilesMessage(length, numFiles, fileNames, rejectFile, exceptionFile)
  }

  private parseWriteFileMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const fileName = this.reader.cstring()
    const fileLength = this.reader.int32()
    let fileContents: string | bigint[]
    // if filename is empty, it means we used returnrejected instead of rejection file, the fileLength 
    // will be in mutliples of 8 bytes for each rejected row number in Little Endian 64 bit format
    if (fileName.length === 0) {
      fileContents = []
      for (let i = 0; i < fileLength; i += 8) {
          fileContents.push(this.reader.int64LE())
      }
    } else {
      fileContents = this.reader.string(fileLength)
    }
    return new WriteFileMessage(length, fileName, fileLength, fileContents)
  }

  private parseCopyInResponseMessage(offset: number, length: number, bytes: Buffer) {
      this.reader.setBuffer(offset, bytes)
      const isBinary = this.reader.byte() !== 0
      const columnCount = this.reader.int16()
      const message = new CopyInResponseMessage(length, isBinary, columnCount)
      for (let i = 0; i < columnCount; i++) {
        message.columnFormats[i] = this.reader.int16()
      }
      return message
  }

  private parseLoadFileMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const fileName = this.reader.cstring()
    return new LoadFileMessage(length, fileName)
  }

  private parseRowDescriptionMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const fieldCount = this.reader.int16()
    const message = new RowDescriptionMessage(length, fieldCount)
    if (fieldCount === 0) {
      return message
    }
    const nonNativeTypeCount = this.reader.int32()
    if (nonNativeTypeCount > 0) {
      throw new Error("Non native types are not yet supported")
    }
    for (let i = 0; i < fieldCount; i++) {
      message.fields[i] = this.parseField()
    }
    return message
  }

  private parseField(): Field {
    const name = this.reader.cstring()
    const tableID = this.reader.uint64()
    var schemaName = ""
    var tableName = ""
    if (tableID) {
        schemaName = this.reader.cstring()
        tableName = this.reader.cstring()
    }
    const columnID = this.reader.int16()
    //const parentTypeID = this.reader.int16() // breadcrumb for complex types
    const isNonNative = this.reader.bytes(1)
    if (isNonNative[0] == 1) {
      throw new Error("Non native types are not yet supported")
    }
    const dataTypeID = this.reader.int32() // for non native types this would be the index into the type mapping pool
    const dataTypeSize = this.reader.int16()
    const allowsNull = this.reader.int16()
    const isIdentity = this.reader.int16()
    const dataTypeModifier = this.reader.int32()
    const mode = this.reader.int16() === 0 ? 'text' : 'binary'
    return new Field(name, tableID, schemaName, tableName, columnID, dataTypeID, dataTypeSize, allowsNull, isIdentity, dataTypeModifier, mode)
  }

  private parseParameterDescriptionMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const parameterCount = this.reader.int16()
    const message = new ParameterDescriptionMessage(length, parameterCount)
    if (parameterCount === 0) {
      return message
    }
    const nonNativeTypeCount = this.reader.int32() 
    if (nonNativeTypeCount > 0 ) {
      throw new Error("Non native types are not yet supported")
    }
    for (let i = 0; i < parameterCount; i++) {
      message.parameters[i] = this.parseParameter()
    }
    return message
  }

  private parseParameter(): Parameter {
    const isNonNative = this.reader.byte() !== 0
    if (isNonNative) { // should have been caught already, but just in case
      throw new Error("Non native types are not yet supported")
    }
    const oid = this.reader.int32()
    const typemod = this.reader.int32()
    const hasNotNull = this.reader.int16()
    return new Parameter(isNonNative, oid, typemod, hasNotNull);
  }

  private parseCommandDescriptionMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const tag = this.reader.cstring()
    const convertedToCopy = this.reader.int16()
    const convertedStatement = this.reader.cstring()

    return new CommandDescriptionMessage(length, tag, convertedToCopy, convertedStatement)
  }

  private parseDataRowMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const fieldCount = this.reader.int16()
    const fields: any[] = new Array(fieldCount)
    for (let i = 0; i < fieldCount; i++) {
      const len = this.reader.int32()
      // a -1 for length means the value of the field is null
      fields[i] = len === -1 ? null : this.reader.string(len)
    }
    return new DataRowMessage(length, fields)
  }

  private parseParameterStatusMessage(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const name = this.reader.cstring()
    const value = this.reader.cstring()
    return new ParameterStatusMessage(length, name, value)
  }

  private parseBackendKeyData(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const processID = this.reader.int32()
    const secretKey = this.reader.int32()
    return new BackendKeyDataMessage(length, processID, secretKey)
  }

  public parseAuthenticationResponse(offset: number, length: number, bytes: Buffer) {
    this.reader.setBuffer(offset, bytes)
    const code = this.reader.int32()
    // TODO(bmc): maybe better types here
    const message: BackendMessage & any = {
      name: 'authenticationOk',
      length,
    }

    switch (code) {
      case 0: // AuthenticationOk
        break
      case 3: // AuthenticationCleartextPassword
        if (message.length === 8) {
          message.name = 'authenticationCleartextPassword'
        }
        break
      case 5: // AuthenticationMD5Password
        if (message.length === 32) {
          message.name = 'authenticationMD5Password'
          const salt = this.reader.bytes(4)
          return new AuthenticationMD5Password(length, salt)
        }
        break
      case 12: // AuthenticationOAuthPassword
        message.name = 'authenticationOAuthPassword'
        break
      case 65536: // AuthenticationHashPassword
      case 66048: // AuthenticationHashSHA512Password
        if(message.length === 32) {
          const salt = this.reader.bytes(4)
          const userSaltLen = this.reader.int32()
          const userSalt = this.reader.bytes(16)

          return new AuthenticationSHA512Password(length, salt, userSalt)
        }
        break
      case 9: // PasswordExpired
        return new DatabaseError('Could not authenticate: Password expired.', 0, 'error')
      default:
        throw new Error('Unknown authentication request message type ' + code)
    }
    return message
  }

  private parseErrorMessage(offset: number, length: number, bytes: Buffer, name: MessageName) {
    this.reader.setBuffer(offset, bytes)
    const fields: Record<string, string> = {}
    let fieldType = this.reader.string(1)
    while (fieldType !== '\0') {
      fields[fieldType] = this.reader.cstring()
      fieldType = this.reader.string(1)
    }

    const messageValue = fields.M

    const message =
      name === 'notice' ? new NoticeMessage(length, messageValue) : new DatabaseError(messageValue, length, name)

    message.severity = fields.S
    message.code = fields.C
    message.detail = fields.D
    message.hint = fields.H
    message.position = fields.P
    message.internalPosition = fields.p
    message.internalQuery = fields.q
    message.where = fields.W
    message.schema = fields.s
    message.table = fields.t
    message.column = fields.c
    message.dataType = fields.d
    message.constraint = fields.n
    message.file = fields.F
    message.line = fields.L
    message.routine = fields.R
    return message
  }
}
