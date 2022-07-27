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

var ConnectionParameters = require('./connection-parameters')
var Query = require('./query')
const ClientConnection = require('./client-connection')

class Client extends ClientConnection {
  constructor(config) {
    super(config)

    this.connectionParameters = new ConnectionParameters(config)
    this.host = this.connectionParameters.host
    this.port = this.connectionParameters.port
  }

  connect(callback) {
    if (callback) {
      super.connect(this.host, this.port, callback)
      return
    }

    return new this._Promise((resolve, reject) => {
      super.connect(this.host, this.port, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  cancel(client, query) {
    return super.cancel(client, query, this.host, this.port)
  }

  setTypeParser(oid, format, parseFn) {
    return super.setTypeParser(oid, format, parseFn)
  }

  getTypeParser(oid, format) {
    return super.getTypeParser(oid, format)
  }

  // Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
  escapeIdentifier(str) {
    return '"' + str.replace(/"/g, '""') + '"'
  }

  // Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
  escapeLiteral(str) {
    var hasBackslash = false
    var escaped = "'"

    for (var i = 0; i < str.length; i++) {
      var c = str[i]
      if (c === "'") {
        escaped += c + c
      } else if (c === '\\') {
        escaped += c + c
        hasBackslash = true
      } else {
        escaped += c
      }
    }

    escaped += "'"

    if (hasBackslash === true) {
      escaped = ' E' + escaped
    }

    return escaped
  }

  query(config, values, callback) {
    return super.query(config, values, callback)
  }

  ref() {
    return super.ref()
  }

  unref() {
    return super.unref()
  }

  end(cb) {
    return super.end(cb)
  }
}

// expose a Query constructor
Client.Query = Query

module.exports = Client
