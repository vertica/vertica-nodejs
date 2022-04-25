'use strict'

const fs = require('fs')

const helper = require('./test-helper')
const vertica = helper.vertica

const suite = new helper.Suite()

if (process.env.PG_CLIENT_CERT_TEST) {
  suite.testAsync('client certificate', async () => {
    const pool = new vertica.Pool({
      ssl: {
        ca: fs.readFileSync(process.env.PGSSLROOTCERT),
        cert: fs.readFileSync(process.env.PGSSLCERT),
        key: fs.readFileSync(process.env.PGSSLKEY),
      },
    })

    await pool.query('SELECT 1')
    await pool.end()
  })
}
