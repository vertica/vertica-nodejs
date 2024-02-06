// Copyright (c) 2022-2023 Open Text.
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

var dns = require('dns')
var os = require('os')

var defaults = require('./defaults')

var parse = require('v-connection-string').parse // parses a connection string

var backupServerNodesParser = require('./backup-nodes-parsers').backupServerNodes // parses backup server nodes

var val = function (key, config, envVar) {
  if (envVar === undefined) {
    envVar = process.env['V_' + key.toUpperCase()]
  } else if (envVar === false) {
    // do nothing ... use false
  } else {
    envVar = process.env[envVar]
  }

  return config[key] || envVar || defaults[key]
}

// Convert arg to a string, surround in single quotes, and escape single quotes and backslashes
var quoteParamValue = function (value) {
  return "'" + ('' + value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
}

var add = function (params, config, paramName) {
  var value = config[paramName]
  if (value !== undefined && value !== null) {
    params.push(paramName + '=' + quoteParamValue(value))
  }
}

var parseBackupServerNodes = function (nodes) {
  // We need to check the type of the input because the ConnectionParameters
  // constructor will try to assign config = config, which will
  // cause an error if we try to parse an already parsed value.
  if (typeof nodes == 'string') {
    var parsedNodes = backupServerNodesParser(nodes)
    return parsedNodes.map(pair => pair[1] !== null ?
      { host: pair[0], port: parseInt(pair[1]) } :
      { host: pair[0], port: defaults.port })
  } else {
    return nodes
  }
}

class ConnectionParameters {
  constructor(config) {
    // if a string is passed, it is a raw connection string so we parse it into a config
    config = typeof config === 'string' ? parse(config) : config || {}

    // if the config has a connectionString defined, parse IT into the config we use
    // this will override other default values with what is stored in connectionString
    if (config.connectionString) {
      config = Object.assign({}, config, parse(config.connectionString))
    }

    this.user = val('user', config)
    this.database = val('database', config)

    if (this.database === undefined) {
      this.database = ''
    }

    this.port = parseInt(val('port', config), 10)
    this.host = val('host', config)

    // "hiding" the password so it doesn't show up in stack traces
    // or if the client is console.logged
    Object.defineProperty(this, 'password', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val('password', config),
    })

    this.binary = val('binary', config)
    this.options = val('options', config)

    this.tls_config = val('tls_config', config)
    // if the user wants to have more control over the tls socket they can provide their own tls_config object
    // this is particularly useful for customers migrating over from node-vertica
    // otherwise we will support standard tls mode support as in other drivers
    this.tls_mode = val('tls_mode', config)
    //this.tls_client_key = val('tls_client_key', config)
    //this.tls_client_cert = val('tls_client_cert', config)
    this.tls_trusted_certs = val('tls_trusted_certs', config)
    this.client_encoding = val('client_encoding', config)
    this.replication = val('replication', config)
    // a domain socket begins with '/'
    this.isDomainSocket = !(this.host || '').indexOf('/')

    this.statement_timeout = val('statement_timeout', config, false)
    this.idle_in_transaction_session_timeout = val('idle_in_transaction_session_timeout', config, false)
    this.query_timeout = val('query_timeout', config, false)

    this.backup_server_node = parseBackupServerNodes(val('backup_server_node', config))
    this.client_label = val('client_label', config, false)
    this.workload = val('workload', config, false)

    // client auditing information
    this.client_os_hostname = os.hostname()
    this.client_type = "Node.js Driver"
    this.client_version = "1.1.1"
    this.client_pid = process.pid.toString()
    this.client_os = os.platform()
    this.client_os_user_name = os.userInfo().username

    //NOTE: The client has only been tested to support 3.5, which was chosen in order to include SHA512 support
    this.protocol_version = (3 << 16 | 5) // 3.5 -> (major << 16 | minor) -> (3 << 16 | 5) -> 196613

    if (config.connectionTimeoutMillis === undefined) {
      this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0
    } else {
      this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1000)
    }

    if (config.keepAlive === false) {
      this.keepalives = 0
    } else if (config.keepAlive === true) {
      this.keepalives = 1
    }

    if (typeof config.keepAliveInitialDelayMillis === 'number') {
      this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1000)
    }
  }
}

module.exports = ConnectionParameters
