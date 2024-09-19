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

var net = require('net')
var fs = require('fs')
var EventEmitter = require('events').EventEmitter

const { parse, serialize } = require('v-protocol')

const flushBuffer = serialize.flush()
const syncBuffer = serialize.sync()
const endBuffer = serialize.end()

const bufferSize = 65536 // 64KB

// TODO(bmc) support binary mode at some point
class Connection extends EventEmitter {
  constructor(config) {
    super()
    config = config || {}
    this.stream = config.stream || new net.Socket()
    this._keepAlive = config.keepAlive
    this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis
    this.lastBuffer = false
    this.parsedStatements = {}
    this._ending = false
    this._emitMessage = false
    this.statementCounterBuffer = new SharedArrayBuffer(32)
    this.statementCounter = new Int32Array(this.statementCounterBuffer)
    this.statementCounter[0] = 0

    // encryption
    this.tls_config = config.tls_config

    if (this.tls_config === undefined) {
      this.tls_mode = config.tls_mode || 'prefer'
      this.tls_client_key = config.tls_client_key
      this.tls_client_cert = config.tls_client_cert
      this.tls_trusted_certs = config.tls_trusted_certs
      this.tls_host = config.tls_host
    }
    var self = this
    this.on('newListener', function (eventName) {
      if (eventName === 'message') {
        self._emitMessage = true
      }
    })
  }

  connect(port, host) {
    var self = this

    this._connecting = true
    this.stream.setNoDelay(true)
    this.stream.connect(port, host)

    this.stream.once('connect', function () {
      if (self._keepAlive) {
        self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis)
      }
      self.emit('connect')
    })

    const reportStreamError = function (error) {
      // errors about disconnections should be ignored during disconnect
      if (self._ending && (error.code === 'ECONNRESET' || error.code === 'EPIPE')) {
        return
      }
      self.emit('error', error)
    }
    this.stream.on('error', reportStreamError)

    this.stream.on('close', function () {
      self.emit('end')
    })



    // only try to connect with tls if we are set up to handle it
    if (self.tls_config === undefined && self.tls_mode === 'prefer') {
      return this.attachListeners(this.stream)
    }

    this.stream.once('data', function (buffer) {
      var responseCode = buffer.toString('utf8')
      switch (responseCode) {
        case 'S': // Server supports TLS connections, continue with a secure connection
          break
        case 'N': // Server does not support TLS connections
          self.stream.end()
          return self.emit('error', new Error('The server does not support TLS connections'))
        default:
          // Any other response byte, including 'E' (ErrorResponse) indicating a server error
          self.stream.end()
          return self.emit('error', new Error('There was an error establishing a TLS connection'))
      }
      // tls_mode LOGIC
      var tls = require('tls')

      // use tls_config if it has been provided
      var tls_options = {}
      if (self.tls_config !== undefined) {
        tls_options = self.tls_config
        tls_options.socket = self.stream
        self.stream = tls.connect(tls_options)
      }
      else {
        tls_options.socket = self.stream

        // Instead of keeping track of whether mutual mode is on or not, just check to see if the properties 
        // needed for mutual mode are defined. If they are and mutual mode is off, sending it won't cause a 
        // problem because the server won't be asking for them.
        // Also, terminology conflicts between vertica documentation and the node tls package may make this 
        // seem confusing. checkServerIdentity is the function equivalent to the hostname verifier.
        // With an undefined checkServerIdentity function, we are still checking to see that the server
        // certificate is signed by the CA (default or provided).
        
        if (self.tls_mode === 'require') { // basic TLS connection, does not verify CA certificate
          tls_options.rejectUnauthorized = false
          tls_options.checkServerIdentity = (host , cert) => undefined
          if (self.tls_trusted_certs) {
            tls_options.ca = fs.readFileSync(self.tls_trusted_certs).toString()
          }
          /*if (self.tls_client_cert) {// the client won't know whether or not this is required, depends on server mode
            tls_options.cert = fs.readFileSync(self.tls_client_cert).toString()
          }
          if (self.tls_client_key) {
            tls_options.key = fs.readFileSync(self.tls_client_key).toString()
          }*/
          try {
            self.stream = tls.connect(tls_options);
          } catch (err) {
            return self.emit('error', err)
          }
        }
        else if (self.tls_mode === 'prefer') { // basic TLS connection, does not verify CA certificate
          tls_options.rejectUnauthorized = false
          tls_options.checkServerIdentity = (host , cert) => undefined
          if (self.tls_trusted_certs) {
            tls_options.ca = fs.readFileSync(self.tls_trusted_certs).toString()
          }
          /*if (self.tls_client_cert) {// the client won't know whether or not this is required, depends on server mode
            tls_options.cert = fs.readFileSync(self.tls_client_cert).toString()
          }
          if (self.tls_client_key) {
            tls_options.key = fs.readFileSync(self.tls_client_key).toString()
          }*/
          try {
            self.stream = tls.connect(tls_options);
          } catch (err) {
            return self.emit('error', err)
          }
        }
        else if (self.tls_mode === 'verify-ca') { //verify that the server certificate is signed by a trusted CA
          try {
            tls_options.rejectUnauthorized = true
            tls_options.checkServerIdentity = (host, cer) => undefined
            if (self.tls_trusted_certs) {
              tls_options.ca = fs.readFileSync(self.tls_trusted_certs).toString()
            }
            /*if (self.tls_client_cert) {// the client won't know whether or not this is required, depends on server mode
              tls_options.cert = fs.readFileSync(self.tls_client_cert).toString()
            }
            if (self.tls_client_key) {
              tls_options.key = fs.readFileSync(self.tls_client_key).toString()
            }*/
            self.stream = tls.connect(tls_options)
          } catch (err) {
            return self.emit('error', err)
          }
        }
        else if (self.tls_mode === 'verify-full') { //verify that the name on the CA-signed server certificate matches it's hostname
          try {
            tls_options.rejectUnauthorized = true
            tls_options.host = self.tls_host  // Hostname/IP to match certificate's altnames
            if (self.tls_trusted_certs) {
              tls_options.ca = fs.readFileSync(self.tls_trusted_certs).toString()
            }
            /*if (self.tls_client_cert) {// the client won't know whether or not this is required, depends on server mode
              tls_options.cert = fs.readFileSync(self.tls_client_cert).toString()
            }
            if (self.tls_client_key) {
              tls_options.key = fs.readFileSync(self.tls_client_key).toString()
            }*/
            self.stream = tls.connect(tls_options)
          } catch (err){
            return self.emit('error', err)
          }
        }
        else {
          self.emit('error', 'Invalid TLS mode has been entered'); // should be unreachable
        }
        
      }
      self.attachListeners(self.stream)
      self.stream.on('error', reportStreamError)
      self.emit('sslconnect')
    })
  } 

  attachListeners(stream) {
    stream.on('end', () => {
      this.emit('end')
    })
    parse(stream, (msg) => {
      var eventName = msg.name === 'error' ? 'errorMessage' : msg.name
      if (this._emitMessage) {
        this.emit('message', msg)
      }
      this.emit(eventName, msg)
    })
  }

  requestSsl() {
    this.stream.write(serialize.requestSsl())
  }

  startup(config) {
    this.stream.write(serialize.startup(config))
  }

  cancel(processID, secretKey) {
    this._send(serialize.cancel(processID, secretKey))
  }

  password(password) {
    this._send(serialize.password(password))
  }

  _send(buffer) {
    if (!this.stream.writable) {
      return false
    }
    return this.stream.write(buffer)
  }

  query(text) {
    this._send(serialize.query(text))
  }

  // send parse message
  parse(query) {
    this._send(serialize.parse(query))
  }

  // send bind message
  bind(config) {
    this._send(serialize.bind(config))
  }

  // send execute message
  execute(config) {
    this._send(serialize.execute(config))
  }

  flush() {
    if (this.stream.writable) {
      this.stream.write(flushBuffer)
    }
  }

  sync() {
    this._ending = true
    this._send(flushBuffer)
    this._send(syncBuffer)
  }

  ref() {
    this.stream.ref()
  }

  unref() {
    this.stream.unref()
  }

  end() {
    // 0x58 = 'X'
    this._ending = true
    if (!this._connecting || !this.stream.writable) {
      this.stream.end()
      return
    }
    return this.stream.write(endBuffer, () => {
      this.stream.end()
    })
  }

  close(msg) {
    this._send(serialize.close(msg))
  }

  describe(msg) {
    this._send(serialize.describe(msg))
  }

  sendCopyFromChunk(chunk) {
    this._send(serialize.copyData(chunk))
  }

  sendCopyDone() {
    this._send(serialize.copyDone())
  }

  sendCopyError(fileName, lineNumber, methodName, errorMsg) {
    this._send(serialize.copyError(fileName, lineNumber, methodName, errorMsg))
  }

  sendCopyFail(msg) {
    this._send(serialize.copyFail(msg))
  }

  sendVerifiedFiles(msg) {
    this._send(serialize.verifiedFiles(msg))
  }

  sendCopyData(msg) {
    this._send(serialize.copyData(msg))
  }

  sendEndOfBatchRequest() {
    this._send(serialize.EndOfBatchRequest())
  }

  sendCopyDataStream(copyStream) {
    copyStream.on('readable', () => {
      let bytesRead
      while ((bytesRead = copyStream.read(bufferSize)) !== null) {
        if (Buffer.isBuffer(bytesRead)) { // readableStream is binary
          this.sendCopyData(bytesRead)
        } else { // readableStream is utf-8 encoded
          this.sendCopyData(Buffer.from(bytesRead, 'utf-8'))
        }
      }
    })
    copyStream.on('end', () => {
      this.sendEndOfBatchRequest()
    })
  }

  sendCopyDataFiles(msg) {
    const buffer = Buffer.alloc(bufferSize);
    const fd = fs.openSync(msg.fileName, 'r');
    let bytesRead = 0;
    do {
      // read bufferSize bytes from the file into our buffer starting at the current position in the file
      bytesRead = fs.readSync(fd, buffer, 0, bufferSize, null);
      if (bytesRead > 0) {
        // Process the chunk (buffer.slice(0, bytesRead)) here
        this.sendCopyData(buffer.subarray(0, bytesRead))
      }
    } while (bytesRead > 0);
    fs.closeSync(fd);
    this.sendEndOfBatchRequest()
  }

  makeStatementName() {
    return "s" + Atomics.add(this.statementCounter, 0, 1)
  }
}

module.exports = Connection
