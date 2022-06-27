'use strict'
var helper = require('../test-helper')
var Connection = require('../../../lib/connection')

var makeClient = async function () {
  var connection = new Connection({ stream: 'no' })
  connection.startup = function () {}
  connection.connect = function () {}
  connection.query = function (text) {
    this.queries.push(text)
  }
  connection.queries = []
  var client = new Client({ connection: connection })
  await client.connect()
  client.connection.emit('connect')
  return client
}

module.exports = Object.assign(
  {
    client: makeClient,
  },
  helper
)
