var vertica = require('./test-helper').vertica

var sql = 'SELECT 1 AS "\\\'/*", 2 AS "\\\'*/\n + process.exit(-1)] = null;\n//"'

var client = new vertica.Client()
client.connect()
client.query(sql, function (err, res) {
  if (err) throw err
  client.end()
})
