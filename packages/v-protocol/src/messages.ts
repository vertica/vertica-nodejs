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

export type Mode = 'text' | 'binary'

export type MessageName =
  | 'parseComplete'
  | 'bindComplete'
  | 'closeComplete'
  | 'noData'
  | 'portalSuspended'
  | 'replicationStart'
  | 'emptyQuery'
  | 'copyDone'
  | 'copyData'
  | 'rowDescription'
  | 'parameterDescription'
  | 'parameterStatus'
  | 'commandDescription'
  | 'backendKeyData'
  | 'notification'
  | 'readyForQuery'
  | 'commandComplete'
  | 'dataRow'
  | 'copyInResponse'
  | 'copyOutResponse'
  | 'authenticationOk'
  | 'authenticationMD5Password'
  | 'authenticationSHA512Password'
  | 'authenticationCleartextPassword'
  | 'error'
  | 'notice'

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

export const replicationStart: BackendMessage = {
  name: 'replicationStart',
  length: 4,
}

export const emptyQuery: BackendMessage = {
  name: 'emptyQuery',
  length: 4,
}

export const copyDone: BackendMessage = {
  name: 'copyDone',
  length: 4,
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

export class CopyDataMessage {
  public readonly name = 'copyData'
  constructor(public readonly length: number, public readonly chunk: Buffer) {}
}

export class CopyResponse {
  public readonly columnTypes: number[]
  constructor(
    public readonly length: number,
    public readonly name: MessageName,
    public readonly binary: boolean,
    columnCount: number
  ) {
    this.columnTypes = new Array(columnCount)
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

export class NotificationResponseMessage {
  public readonly name: MessageName = 'notification'
  constructor(
    public readonly length: number,
    public readonly processId: number,
    public readonly channel: string,
    public readonly payload: string
  ) {}
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
