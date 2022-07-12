'use strict'
var helper = require('./test-helper')

var client = new helper.vertica.Client(helper.config)
client.connect()
client.end()
