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
var helper = require('../test/integration/test-helper')
var vertica = helper.vertica
vertica.connect(
  helper.config,
  assert.success(function (client) {
    var query = client.query("select oid, typname from pg_type where typtype = 'b' order by oid")
    query.on('row', console.log)
  })
)
