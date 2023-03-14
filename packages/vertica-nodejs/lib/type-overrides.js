// Copyright (c) 2022-2023 Micro Focus or one of its affiliates.
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

const { VerticaType } = require('v-protocol')
var types = require('pg-types')

// this is a 'temporary' solution allowing us to continue to use pg-types as long as we can to avoid another large 
// package implementation while we get close to the 1.0 release
types.setTypeParser(VerticaType.Boolean, types.getTypeParser(16, 'text'))
types.setTypeParser(VerticaType.Integer, types.getTypeParser(21, 'text'))
types.setTypeParser(VerticaType.Float, types.getTypeParser(700, 'text'))
types.setTypeParser(VerticaType.Numeric, types.getTypeParser(9, 'text'))
types.setTypeParser(VerticaType.Varbinary, types.getTypeParser(9, 'text'))
//types.setTypeParser(VerticaType.Uuid, types.getTypeParser(9, 'text')) //Uuid not introduced yet in the current protocol 3.5
function TypeOverrides(userTypes) {
  this._types = userTypes || types
  this.text = {}
  this.binary = {}
}

TypeOverrides.prototype.getOverrides = function (format) {
  switch (format) {
    case 'text':
      return this.text
    case 'binary':
      return this.binary
    default:
      return {}
  }
}

TypeOverrides.prototype.setTypeParser = function (oid, format, parseFn) {
  if (typeof format === 'function') {
    parseFn = format
    format = 'text'
  }
  this.getOverrides(format)[oid] = parseFn
}

TypeOverrides.prototype.getTypeParser = function (oid, format) {
  format = format || 'text'
  return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format)
}

module.exports = TypeOverrides
