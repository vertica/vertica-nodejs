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
var vertica = require('../lib')
var args = require('../test/cli')

var queries = ['select CURRENT_TIMESTAMP', "select interval '1 day' + interval '1 hour'", "select TIMESTAMP 'today'"]

queries.forEach(function (query) {
  var client = new vertica.Client({
    user: args.user,
    database: args.database,
    password: args.password,
  })
  client.connect()
  client.query(query).on('row', function (row) {
    console.log(row)
    client.end()
  })
})
