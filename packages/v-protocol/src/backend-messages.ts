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

export type Mode = 'text' | 'binary'

export type MessageName =
  | 'parseComplete'
  | 'bindComplete'
  | 'closeComplete'
  | 'noData'
  | 'portalSuspended'
  | 'emptyQuery'
  | 'copyDone'
  | 'rowDescription'
  | 'parameterDescription'
  | 'parameterStatus'
  | 'commandDescription'
  | 'backendKeyData'
  | 'readyForQuery'
  | 'commandComplete'
  | 'dataRow'
  | 'copyInResponse'
  | 'loadFile'
  | 'authenticationOk'
  | 'authenticationMD5Password'
  | 'authenticationSHA512Password'
  | 'authenticationCleartextPassword'
  | 'error'
  | 'notice'
  | 'verifyFiles'
  | 'endOfBatchResponse'
  | 'writeFile'

export interface BackendMessage {
  name: MessageName
  length: number
}

export const parseComplete: BackendMessage = {
  name: 'parseComplete',
  length: 5,
}

export const bindComplete: BackendMessage = {
  name: 'bindComplete',
  length: 5,
}

export const closeComplete: BackendMessage = {
  name: 'closeComplete',
  length: 5,
}

export const noData: BackendMessage = {
  name: 'noData',
  length: 5,
}

export const portalSuspended: BackendMessage = {
  name: 'portalSuspended',
  length: 5,
}

export const emptyQuery: BackendMessage = {
  name: 'emptyQuery',
  length: 5,
}

export const copyDone: BackendMessage = {
  name: 'copyDone',
  length: 5,
}

export const EndOfBatchResponse: BackendMessage = {
  name: 'endOfBatchResponse',
  length: 5
}

interface NoticeOrError {
  message: string | undefined
  severity: string | undefined
  code: string | undefined
  detail: string | undefined
  hint: string | undefined
  position: string | undefined
  internalPosition: string | undefined
  internalQuery: string | undefined
  where: string | undefined
  schema: string | undefined
  table: string | undefined
  column: string | undefined
  dataType: string | undefined
  constraint: string | undefined
  file: string | undefined
  line: string | undefined
  routine: string | undefined
}

export class DatabaseError extends Error implements NoticeOrError {
  public severity: string | undefined
  public code: string | undefined
  public detail: string | undefined
  public hint: string | undefined
  public position: string | undefined
  public internalPosition: string | undefined
  public internalQuery: string | undefined
  public where: string | undefined
  public schema: string | undefined
  public table: string | undefined
  public column: string | undefined
  public dataType: string | undefined
  public constraint: string | undefined
  public file: string | undefined
  public line: string | undefined
  public routine: string | undefined
  constructor(message: string, public readonly length: number, public readonly name: MessageName) {
    super(message)
  }
}

export class Field {
  constructor(
    public readonly name: string,
    public readonly tableID: bigint,
    public readonly schemaName: string,
    public readonly tableName: string,
    public readonly columnID: number,
    //public readonly parentTypeID: number, //breadcrumb for complex types
    //public readonly isNonNative: number,  //breadcrumb for non native types
    public readonly dataTypeID: number,
    public readonly dataTypeSize: number,
    public readonly allowsNull: number,
    public readonly isIdentity: number,
    public readonly dataTypeModifier: number,
    public readonly format: Mode
  ) {}
}

export class RowDescriptionMessage {
  public readonly name: MessageName = 'rowDescription'
  //public readonly nonNativeTypes: number; //breadcrumb for non native types
  public readonly fields: Field[]
  constructor(public readonly length: number, public readonly fieldCount: number) {
    this.fields = new Array(this.fieldCount)
  }
}

export class Parameter {
  constructor (
    public readonly isNonNative: boolean,
    public readonly oid: number, // for non native types, the oid becomes the index into the type mapping pool
    public readonly typemod: number,
    public readonly hasNotNullConstraint: number
  ) {}
}

export class LoadFileMessage {
  public readonly name: MessageName = 'loadFile'
  constructor (
    public readonly length: number,
    public readonly fileName: string
  ) {}
}

export class CopyInResponseMessage {
  public readonly name: MessageName = 'copyInResponse'
  public readonly columnFormats: number[]
  constructor (
    public readonly length: number,
    public readonly isBinary: boolean,
    public readonly numColumns: number,
  ) {
    this.columnFormats = new Array(this.numColumns)
  }
}

export class ParameterDescriptionMessage {
  public readonly name: MessageName = 'parameterDescription'
  //public readonly nonNativeTyeps: number //breadcrumb for non native types
  public readonly parameters: Parameter[]
  constructor(public readonly length: number, public readonly parameterCount: number) {
    this.parameters = new Array(this.parameterCount)
  }
}

export class ParameterStatusMessage {
  public readonly name: MessageName = 'parameterStatus'
  constructor(
    public readonly length: number,
    public readonly parameterName: string,
    public readonly parameterValue: string
  ) {}
}

export class CommandDescriptionMessage {
  public readonly name: MessageName = 'commandDescription'
  constructor ( public readonly length: number, public readonly tag: string, 
                public readonly convertedToCopy: number, public readonly convertedStatement: string) {}
}

export class AuthenticationMD5Password implements BackendMessage {
  public readonly name: MessageName = 'authenticationMD5Password'
  constructor(public readonly length: number, public readonly salt: Buffer) {}
}

export class AuthenticationSHA512Password implements BackendMessage {
  public readonly name: MessageName = 'authenticationSHA512Password'
  constructor(public readonly length: number, public readonly salt: Buffer, public readonly userSalt: Buffer) {}
}

export class BackendKeyDataMessage {
  public readonly name: MessageName = 'backendKeyData'
  constructor(public readonly length: number, public readonly processID: number, public readonly secretKey: number) {}
}

export class ReadyForQueryMessage {
  public readonly name: MessageName = 'readyForQuery'
  constructor(public readonly length: number, public readonly status: string) {}
}

export class CommandCompleteMessage {
  public readonly name: MessageName = 'commandComplete'
  constructor(public readonly length: number, public readonly text: string) {}
}

export class DataRowMessage {
  public readonly fieldCount: number
  public readonly name: MessageName = 'dataRow'
  constructor(public length: number, public fields: any[]) {
    this.fieldCount = fields.length
  }
}

export class NoticeMessage implements BackendMessage, NoticeOrError {
  constructor(public readonly length: number, public readonly message: string | undefined) {}
  public readonly name = 'notice'
  public severity: string | undefined
  public code: string | undefined
  public detail: string | undefined
  public hint: string | undefined
  public position: string | undefined
  public internalPosition: string | undefined
  public internalQuery: string | undefined
  public where: string | undefined
  public schema: string | undefined
  public table: string | undefined
  public column: string | undefined
  public dataType: string | undefined
  public constraint: string | undefined
  public file: string | undefined
  public line: string | undefined
  public routine: string | undefined
}

export class VerifyFilesMessage {
  public readonly name: MessageName = 'verifyFiles'
  public readonly fileNames: string[] | null
  constructor(public readonly length: number,
              public numFiles: number, 
              public files: string[] | null,
              public readonly rejectFile: string, 
              public readonly exceptionFile: string)
  {
    this.fileNames = files !== null ? [...files] : null // shallow copy the fileNames if there are any, or set to null for
  }
}

export class WriteFileMessage {
  public readonly name: MessageName = 'writeFile'
  constructor(public readonly length: number, 
              public fileName: string,
              public fileLength: number,
              public fileContents: string | bigint[] ) {}
}

