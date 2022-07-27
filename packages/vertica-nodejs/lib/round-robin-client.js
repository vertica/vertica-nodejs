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

var dns = require('dns')
const ClientConnection = require('./client-connection')
const ConnectionParameters = require('./connection-parameters')

class DnsRoundRobinClient {
  constructor(config) {
    this.connectionParameters = new ConnectionParameters(config)
    this.backup_server_node = this.connectionParameters.backup_server_node
    this.host = this.connectionParameters.host
    this.port = this.connectionParameters.port

    var c = config || {}

    this._Promise = c.Promise || global.Promise
  }

  _shuffleAddresses(addresses) {
    // Use Durstenfeld shuffle because it is not biased
    for (var i = addresses.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var temp = addresses[i]
      addresses[i] = addresses[j]
      addresses[j] = temp
    }
  }

  _resolveHost(node) {
    return new this._Promise((resolve, reject) => {
      dns.lookup(node.host, { all: true }, (err, addresses) => {
        if (err) {
          reject(err)
          return
        }

        var resolvedAddresses = addresses
          .filter((addr) => addr.family === 4 || addr.family === 6)
          .map((addr) => addr.address)

        this._shuffleAddresses(addresses)
        resolve(resolvedAddresses.map((addr) => { return { host: addr, port: node.port } }))
      })
    })
  }

  async _connect(nodes, callback) {
    var errors = []
    for (let node of nodes) {
      var resolvedEntries = []
      try {
        resolvedEntries = await this._resolveHost(node)
      } catch(err) {
        errors.push(err)
      }
      for (let entry of resolvedEntries) {
        var client = new ClientConnection(this.config)
        try {
          client.connect(entry.host, entry.port, callback)
          this.client = client
          return
        } catch(err) {
          errors.push(err)
        }
      }
    }

    if (errors.length > 0) {
      var errorString = ""
      for (let err of errors) {
        errorString += err + "\n\n"
      }
      
      throw new Error("Failed to connect to host and backup nodes:\n" + errorString)
    }
  }

  async connect(callback) {
    var nodes = this.backup_server_node
    nodes.unshift({ host: this.host, port: this.port })

    await this._connect(nodes, callback)
  }

  query(config, values, callback) {
    return this.client.query(config, values, callback)
  }
  
  ref() {
    return this.client.ref()
  }

  unref() {
    return this.client.unref()
  }

  end(cb) {
    return this.client.end(cb)
  }
}

module.exports = DnsRoundRobinClient