const { Client } = require('vertica-nodejs')

const client = new Client()

async function setup() {
  client.connect()

  // Create Employee table
  await client.query('CREATE TABLE IF NOT EXISTS Employee (first_name VARCHAR, last_name VARCHAR, age INTEGER)')
  await client.query("INSERT INTO Employee VALUES ('John', 'Doe', 60)")
  await client.query("INSERT INTO Employee VALUES ('Jane', 'Doe', 40)")
  await client.query("INSERT INTO Employee VALUES ('Foo', 'Bar', 80)")
}

async function tearDown() {
  // Drop Employee table
  await client.query('DROP TABLE IF EXISTS Employee')
  client.end()
}

async function main() {
  await setup()

  // Run UPDATE query
  var res = await client.query('UPDATE Employee SET age = age + 1')

  // print results
  console.log("UPDATE complete")
  console.log(res)

  // Run SELECT query
  var allRows = await client.query('SELECT * FROM Employee')

  // print results
  console.log("SELECT complete")
  console.log(allRows.rows)

  await tearDown()
}

main()
