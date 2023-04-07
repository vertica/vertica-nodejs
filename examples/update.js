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

async function getAllEmployees() {
  await setup()

  // Run UPDATE query
  const res = await client.query('UPDATE Employee SET age = age + 1')

  // print results
  console.log('UPDATE complete')
  console.log(res)

  // Run SELECT query
  const allRows = await client.query('SELECT * FROM Employee')

  await tearDown()

  return allRows.rows
}

getAllEmployees().then(console.log).catch(console.log)
