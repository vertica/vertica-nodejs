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
var args = require('../test/cli')
var vertica = require('../lib')

var people = [
  { name: 'Aaron', age: 10 },
  { name: 'Brian', age: 20 },
  { name: 'Chris', age: 30 },
  { name: 'David', age: 40 },
  { name: 'Elvis', age: 50 },
  { name: 'Frank', age: 60 },
  { name: 'Grace', age: 70 },
  { name: 'Haley', age: 80 },
  { name: 'Irma', age: 90 },
  { name: 'Jenny', age: 100 },
  { name: 'Kevin', age: 110 },
  { name: 'Larry', age: 120 },
  { name: 'Michelle', age: 130 },
  { name: 'Nancy', age: 140 },
  { name: 'Olivia', age: 150 },
  { name: 'Peter', age: 160 },
  { name: 'Quinn', age: 170 },
  { name: 'Ronda', age: 180 },
  { name: 'Shelley', age: 190 },
  { name: 'Tobias', age: 200 },
  { name: 'Uma', age: 210 },
  { name: 'Veena', age: 220 },
  { name: 'Wanda', age: 230 },
  { name: 'Xavier', age: 240 },
  { name: 'Yoyo', age: 250 },
  { name: 'Zanzabar', age: 260 },
]

var con = new vertica.Client({
  host: args.host,
  port: args.port,
  user: args.user,
  password: args.password,
  database: args.database,
})

con.connect((err) => {
  if (err) {
    throw err
  }

  con.query(
    'select set_vertica_options(\'basic\',\'DISABLE_DEPARSE_CHECK\');DROP TABLE IF EXISTS person;' + ' CREATE TABLE person (id auto_increment, name varchar(10), age integer)',
    (err) => {
      if (err) {
        throw err
      }

      console.log('Created table person')
      console.log('Filling it with people')

      let q = people.map((person) => `INSERT INTO person (name, age) VALUES ('${person.name}', ${person.age})`).join(';')
      console.log('Query: ' + q)

      con.query(
        q,
        (err, result) => {
          if (err) {
            throw err
          }

          con.end()
        }
      )
    }
  )
})
