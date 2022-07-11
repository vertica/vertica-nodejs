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

function TypeOverrides(userTypes) {
  this._types = userTypes || types
  this.text = {}
  this.binary = {}
  // this is a 'temporary' solution allowing us to continue to use pg-types as long as we can to avoid another large 
  // package implementation while we get close to the 1.0 release
  if (this._types === types) {
    // Types representing javascript primitives and their array. Keep parsing these, but use the correct typeID
    this._types.setTypeParser(5, 'text', this._types.getTypeParser(16, 'text'))  // boolean
    this._types.setTypeParser(1505, 'text', this._types.getTypeParser(1000, 'text')) // boolean array
    this._types.setTypeParser(6, 'text', this._types.getTypeParser(21, 'text'))  // integer
    this._types.setTypeParser(1506, 'text', this._types.getTypeParser(1005, 'text')) // integer array
    this._types.setTypeParser(7, 'text', this._types.getTypeParser(700, 'text')) // float
    this._types.setTypeParser(1507, 'text', this._types.getTypeParser(1021, 'text')) // float array

    // Types that currently are being parsed as the wrong type, force these to be parsed as strings
    this._types.setTypeParser(16, 'text', this._types.getTypeParser(9, 'text'))  //numerics use varchar (no parser)
    this._types.setTypeParser(17, 'text', this._types.getTypeParser(9, 'text'))  //varbinary use varchar(no parser)
    this._types.setTypeParser(20, 'text', this._types.getTypeParser(9, 'text'))  //uuid use varchar(no parser)
  }
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
