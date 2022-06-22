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

var types = require('pg-types')

var matchRegexp = /^([A-Za-z]+)(?: (\d+))?/

// result object returned from query
// in the 'end' event and also
// passed as second argument to provided callback
class Result {
  constructor(rowMode, types) {
    this.command = null
    this.oid = null
    this.rows = []
    this.fields = []
    this._parsers = undefined
    this._types = types
    this.RowCtor = null
    this.rowAsArray = rowMode === 'array'
    if (this.rowAsArray) {
      this.parseRow = this._parseRowAsArray
    }
  }

  // adds a command complete message
  addCommandComplete(msg) {
    var match
    if (msg.text) {
      // pure javascript
      match = matchRegexp.exec(msg.text)
    } else {
      // native bindings
      match = matchRegexp.exec(msg.command)
    }
    if (match) {
      this.command = match[1]
      // [VERTICA specific] Unlike Postgres, rowCount is not sent back by Vertica, but if it ever is supported, it could be set here
      if (match[2]) {
        // COMMMAND OID ROWS
        this.oid = parseInt(match[2], 10)
      }
    }
  }

  _parseRowAsArray(rowData) {
    var row = new Array(rowData.length)
    for (var i = 0, len = rowData.length; i < len; i++) {
      var rawValue = rowData[i]
      if (rawValue !== null) {
        row[i] = this._parsers[i](rawValue)
      } else {
        row[i] = null
      }
    }
    return row
  }

  parseRow(rowData) {
    var row = {}
    for (var i = 0, len = rowData.length; i < len; i++) {
      var rawValue = rowData[i]
      var field = this.fields[i].name
      if (rawValue !== null) {
        row[field] = this._parsers[i](rawValue)
      } else {
        row[field] = null
      }
    }
    return row
  }

  addRow(row) {
    this.rows.push(row)
  }

  addFields(fieldDescriptions) {
    // clears field definitions
    // multiple query statements in 1 action can result in multiple sets
    // of rowDescriptions...eg: 'select NOW(); select 1::int;'
    // you need to reset the fields
    this.fields = fieldDescriptions
    if (this.fields.length) {
      this._parsers = new Array(fieldDescriptions.length)
    }
    for (var i = 0; i < fieldDescriptions.length; i++) {
      var desc = fieldDescriptions[i]
      if (this._types) {
        this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || 'text')
      } else {
        this._parsers[i] = types.getTypeParser(desc.dataTypeID, desc.format || 'text')
      }
    }
  }
}

module.exports = Result
