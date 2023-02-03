// Copyright (c) 2022-2023 Micro Focus or one of its affiliates.
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

const {Pool, Client} = require('vertica-nodejs')

/** 
 * Connection Examples 
 **/

function connection() {
    const client = new Client()

    client.connect()
    client.query("SELECT 'success' as connection", (err, res) => {
        console.log(err || res.rows[0])
        client.end()
    })
}

function connectionPool() {
    const pool = new Pool()

    pool.query("SELECT 'success' as connectionPool", (err, res) => {
        console.log(err || res.rows[0])
        pool.end()
    })
}

async function asyncConnection() {
    const client = new Client()

    await client.connect()
    const res = await client.query("SELECT 'success' as asyncConnection")
    console.log(res.rows[0])
    await client.end()
}

async function asyncConnectionPool() {
    const pool = new Pool()

    const res = await pool.query("SELECT 'success' as asyncConnectionPool")
    console.log(res.rows[0])
    await pool.end()
}

function connectionWithConfig() {
    const client = new Client({
        user: process.env['V_USER'],
        host: process.env['V_HOST'],
        database: process.env['V_DATABASE'],
        password: process.env['V_PASSWORD'],
        port: process.env['V_PORT'],
    })

    client.connect()
    client.query("SELECT 'success' as connectionWithConfig", (err, res) => {
        console.log(err || res.rows[0])
        client.end()
    })
}

function connectionPoolWithConfig() {
    const pool = new Pool({
        user: process.env['V_USER'],
        host: process.env['V_HOST'],
        database: process.env['V_DATABASE'],
        password: process.env['V_PASSWORD'],
        port: process.env['V_PORT'],
    })

    pool.query("SELECT 'success' as connectionPoolWithConfig", (err, res) => {
        console.log(err || res.rows[0])
        pool.end()
    })
}

function connectionWithString() {
    const connectionString = 'vertica://'
                           + process.env['V_USER'] + ':'
                           + process.env['V_PASSWORD'] + '@'
                           + process.env['V_HOST'] + ':'
                           + process.env['V_PORT'] + '/'
                           + process.env['V_DATABASE']
    const client = new Client({
        connectionString,
    })
    client.connect()
    client.query("SELECT 'success' as connectionWithString", (err, res) => {
        console.log(err || res.rows[0])
        client.end()
    })
}

function connectionPoolWithString() {
    const connectionString = 'vertica://'
                           + process.env['V_USER'] + ':'
                           + process.env['V_PASSWORD'] + '@'
                           + process.env['V_HOST'] + ':'
                           + process.env['V_PORT'] + '/'
                           + process.env['V_DATABASE']
    const pool = new Pool({
        connectionString,
    })
    pool.query("SELECT 'success' as connectionPoolWithString", (err, res) => {
        console.log(err || res.rows[0])
        pool.end()
    })
}

connection()
connectionPool()
asyncConnection()
asyncConnectionPool()
connectionWithConfig()
connectionPoolWithConfig()
connectionWithString()
connectionPoolWithString()

/** 
 * Query and Results Examples
 **/

function simpleQuery(){
    const client = new Client()

    client.connect()
    client.query("CREATE LOCAL TEMP TABLE users(id int, name varchar)", (err, res) => {
        if (err) console.log(err) 
        client.query("INSERT INTO users VALUES (1, 'John')", (err, res) => {
            if (err) console.log(err)
            client.query("SELECT * FROM users", (err, res) => {
                console.log(err || res.rows)
                client.end()
            })
        })
    })
}

function parameterizedQuery() {
    const client = new Client()

    client.connect()
    client.query("CREATE LOCAL TEMP TABLE users(id int, name varchar)")
    client.query("INSERT INTO users VALUES (1, 'John')")
    client.query("INSERT INTO users VALUES (2, 'Jane')")
    const queryString = "SELECT * FROM users where id > ?"
    const valueArray = [1]
    client.query(queryString, valueArray, (err, res) => {
        console.log(err || res.rows)
        client.end()
    })
}

function preparedStatement() {
    const client = new Client()

    client.connect()
    client.query("CREATE LOCAL TEMP TABLE users(id int, name varchar)")
    client.query("INSERT INTO users VALUES (1, 'John')")
    client.query("INSERT INTO users VALUES (2, 'Jane')")
    const queryName = "selectById"
    const queryString = "SELECT * FROM users where id > ?"
    let valueArray = [0]
    client.query({name: queryName, text: queryString, values: valueArray}, (err, res) => {
        console.log(err || res.rows)
        valueArray = [1]
        // now we have prepared a named query to use instead of needing the query string
        client.query({name: queryName, values: valueArray}, (err, res) => { 
            console.log(err || res.rows)
            client.end()
        })
    })
}

function arrayRowModeQuery() {
    const client = new Client()

    client.connect()
    client.query("CREATE LOCAL TEMP TABLE users(id int, name varchar)")
    client.query("INSERT INTO users VALUES (1, 'John')")
    client.query("INSERT INTO users VALUES (2, 'Jane')")
    client.query({text: "SElECT * FROM users", rowMode: 'array'}, (err, res) => {
        console.log(err || res.rows) // [ [1, 'John'], [2, 'Jane'] ]
        client.end()
    })
}

function customTypeParser() {
    const client = new Client()

    client.connect()
    client.query("CREATE LOCAL TEMP TABLE users(id int, name varchar)")
    client.query("INSERT INTO users VALUES (1, 'John')")
    client.query("INSERT INTO users VALUES (2, 'Jane')")
    const query = {
        // integer and varchar columns returned
        text: "SELECT * FROM USERS",
        // leave values untouched from server when parsing, result is all strings instead of integer and string
        types: {
            getTypeParser: () => val => val,
        },
    }
    client.query(query, (err, res) => {
        console.log(err || res.rows) 
        client.end()
    })
}

simpleQuery()
parameterizedQuery()
preparedStatement()
arrayRowModeQuery()
customTypeParser()

/**
 * TLS and other connection Properties Examples
 */

