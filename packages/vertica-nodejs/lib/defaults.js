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

module.exports = {
  // database host. defaults to localhost
  host: 'localhost',

  // database user's name
  user: '',

  // name of database to connect
  database: '',

  // database user's password
  password: '',

  // database user's OAuth access token
  oauth_access_token: '',

  // a Postgres connection string to be used instead of setting individual connection items
  // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
  // in the defaults object.
  connectionString: undefined,

  // database port
  port: 5433,

  // number of rows to return at a time from a prepared statement's
  // portal. 0 will return all rows at once
  rows: 0,

  // binary result mode
  binary: false,

  // Connection pool options - see https://github.com/brianc/node-pg-pool

  // number of connections to use in connection pool
  // 0 will disable connection pooling
  max: 10,

  // max milliseconds a client can go unused before it is removed
  // from the pool and destroyed
  idleTimeoutMillis: 30000,
  client_encoding: '',
  tls_mode: 'disable',
  tls_key_file: undefined,
  tls_cert_file: undefined,
  options: undefined,
  parseInputDatesAsUTC: false,
  // max milliseconds any query using this connection will execute for before timing out in error.
  // false=unlimited
  statement_timeout: false,
  // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
  // false=unlimited
  idle_in_transaction_session_timeout: false,
  // max milliseconds to wait for query to complete (client side)
  query_timeout: false,
  connect_timeout: 0,
  keepalives: 1,
  keepalives_idle: 0,
  // A string to identify the vertica-nodejs connection's session on the server
  client_label: '',
  // A comma separated string listing all backup nodes to connect to. Each node is a host-port pair separated by a colon.
  backup_server_node: '',
  // workload associated with this session
  workload: '',
}
