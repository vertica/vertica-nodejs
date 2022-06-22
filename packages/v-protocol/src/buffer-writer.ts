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

//binary data writer tuned for encoding binary specific to the postgres binary protocol

export class Writer {
  private buffer: Buffer
  private offset: number = 5
  private headerPosition: number = 0
  constructor(private size = 256) {
    this.buffer = Buffer.allocUnsafe(size)
  }

  private ensure(size: number): void {
    var remaining = this.buffer.length - this.offset
    if (remaining < size) {
      var oldBuffer = this.buffer
      // exponential growth factor of around ~ 1.5
      // https://stackoverflow.com/questions/2269063/buffer-growth-strategy
      var newSize = oldBuffer.length + (oldBuffer.length >> 1) + size
      this.buffer = Buffer.allocUnsafe(newSize)
      oldBuffer.copy(this.buffer)
    }
  }

  public addInt32(num: number): Writer {
    this.ensure(4)
    this.buffer[this.offset++] = (num >>> 24) & 0xff
    this.buffer[this.offset++] = (num >>> 16) & 0xff
    this.buffer[this.offset++] = (num >>> 8) & 0xff
    this.buffer[this.offset++] = (num >>> 0) & 0xff
    return this
  }

  public addInt16(num: number): Writer {
    this.ensure(2)
    this.buffer[this.offset++] = (num >>> 8) & 0xff
    this.buffer[this.offset++] = (num >>> 0) & 0xff
    return this
  }

  public addCString(string: string): Writer {
    if (!string) {
      this.ensure(1)
    } else {
      var len = Buffer.byteLength(string)
      this.ensure(len + 1) // +1 for null terminator
      this.buffer.write(string, this.offset, 'utf-8')
      this.offset += len
    }

    this.buffer[this.offset++] = 0 // null terminator
    return this
  }

  public addString(string: string = ''): Writer {
    var len = Buffer.byteLength(string)
    this.ensure(len)
    this.buffer.write(string, this.offset)
    this.offset += len
    return this
  }

  public add(otherBuffer: Buffer): Writer {
    this.ensure(otherBuffer.length)
    otherBuffer.copy(this.buffer, this.offset)
    this.offset += otherBuffer.length
    return this
  }

  private join(code?: number): Buffer {
    if (code) {
      this.buffer[this.headerPosition] = code
      //length is everything in this packet minus the code
      const length = this.offset - (this.headerPosition + 1)
      this.buffer.writeInt32BE(length, this.headerPosition + 1)
    }
    return this.buffer.slice(code ? 0 : 5, this.offset)
  }

  public flush(code?: number): Buffer {
    var result = this.join(code)
    this.offset = 5
    this.headerPosition = 0
    this.buffer = Buffer.allocUnsafe(this.size)
    return result
  }
}
