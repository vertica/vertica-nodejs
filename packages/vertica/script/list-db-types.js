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
