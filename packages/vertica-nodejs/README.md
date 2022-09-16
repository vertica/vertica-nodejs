# vertica-nodejs

[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)
[![NPM version](https://img.shields.io/npm/v/vertica-nodejs?color=blue)](https://www.npmjs.com/package/vertica-nodejs)
[![NPM downloads](https://img.shields.io/npm/dm/vertica-nodejs)](https://www.npmjs.com/package/vertica-nodejs)

Non-blocking Vertica client for Node.js made with pure Javascript.

## Jump to
1. [Features](#Features)
2. [Contributing](#Contributing)
3. [Vertica Data Types](#Vertica-Data-Types)
4. [Support](#Support)
5. [Troubleshooting and FAQ](#Troubleshooting-and-FAQ)
6. [Installation](#Installation)
7. [Post Installation Setup](#Post-Installation-Setup)
8. [Usage Examples](#Usage-Examples)
    - [Establishing Connections](#Establishing-Connections)
    - [Executing Queries and Accessing Results](#Executing-Queries-and-Accessing-Results)

## Features

- Pure JavaScript client
- Connection pooling
- Extensible JS ↔ Vertica data-type coercion

## Contributing

We will gladly accept external pull requests if they are well documented and contain tests. 
For more information on how to contribute, check out our [contributing guidelines](https://github.com/vertica/vertica-nodejs/blob/master/CONTRIBUTING.md)

## Installation
To install vertica-nodejs with npm: 
  `npm install vertica-nodejs`

## Post Installation Setup 

The current version of the driver is routinely tested against Node v14. It is recommended to install this version of node in your application environment. 

Ensure that you have an active Vertica server.

Ensure that the applicable environment variables are configured for connecting to your Vertica server. These are the variables and the default values used if not set:

 - V_HOST: 'localhost'
 - V_PORT: 5433
 - V_USER: process.env.USER/USERNAME
 - V_PASSWORD: null
 - V_DATABASE: ''
 - V_BACKUP_SERVER_NODE: ''

 Once these are done, you should be able to run the examples found in the examples directory noted in the next section. Simply download or copy the example javascript file(s) and execute them in a node environment.
 
 For example, to execute the basic.js file all you need to do is run `node basic.js`

 <!-- Once we have an example for testing your configured environment, make note of that here instead of using the basic.js example. -->

## Vertica Data Types

See [DATATYPES.md](https://github.com/vertica/vertica-nodejs/blob/master/DATATYPES.md) to view the mappings from type IDs to Vertica data types.

## Support

vertica-nodejs is free software. If you encounter a bug with the library please open an issue on the [GitHub repo](https://github.com/vertica/vertica-nodejs). If you have questions unanswered by the documentation please open an issue pointing out how the documentation was unclear and we will address it as needed. 

When you open an issue please provide:

- version of Node
- version of Vertica
- smallest possible snippet of code to reproduce the problem

## Troubleshooting and FAQ

The causes and solutions to common errors can be found among the [Frequently Asked Questions (FAQ)](https://github.com/vertica/vertica-nodejs/wiki/FAQ)

# Usage examples


## Establishing Connections

There are a number of different ways to establish a connection to your Vertica server. You can create and connect with a single client or a pool of clients, in an asynchronous or synchronous fashion, and using environment variables, default values, configuration objects, or connection strings. 

Note that in the connection pool examples below we are demonstrating a convenience of the v-pool package which 
is the ability to run single queries at a time on any available client from the connection pool without having to check it out and release it. For more information on using connection pools to their fullest extent check out the [v-pool](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-pool) package documentation.

### Basic Connection

The simplest way to establish a connection is by creating a single Client instance and calling connect(). This will attempt to create a connection based on your environment variables, if set, or the assigned default values. 

```javascript
    const {Client} = require('vertica-nodejs')
    const client = new Client()

    client.connect()
    client.query("SELECT 'success' as connection", (err, res) => {
        console.log(err || res.rows[0])
        client.end()
    })
```

### Basic Connection Pool

This accomplishes the same thing, but querying with an available client in a connection pool.

```javascript 
    const {Pool} = require('vertica-nodejs')
    const pool = new Pool()

    pool.query("SELECT 'success' as connectionPool", (err, res) => {
        console.log(err || res.rows[0])
        pool.end()
    })
```

### Asynchronous Connection

You can use async/await

```javascript 
    const {Client} = require('vertica-nodejs')
    const client = new Client()

    await client.connect()
    const res = await client.query("SELECT 'success' as asyncConnection")
    console.log(res.rows[0])
    await client.end()
```

### Asynchronous Connection Pool

You can use async/await with pooling

```javascript 
    const {Pool} = require('vertica-nodejs')
    const pool = new Pool()

    const res = await pool.query("SELECT 'success' as asyncConnectionPool")
    console.log(res.rows[0])
    await pool.end()
```

### Connection With Config Object

You can override environment variables and defaults by providing your own configuration object. In this example we are providing a configuration object. We are initializing it with the same environment variables used in the previous examples, but you can provide any user, host, database, password or port you want.

```javascript 
    const {Client} = require('vertica-nodejs')
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
```

### Connection Pool with Config Object

Configuration objects work the same way with connection pools

```javascript 
    const {Pool} = require('vertica-nodejs')
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
```

### Connection with Connection String

You can further override defaults, environment variables, and configuration objects by providing your own connection string of the format "vertica://user:password@host:port/databaseName". Again, in this example we are constructing this connection string using the environment variables, so the behavior would remain unchanged.

```javascript 
    const {Client} = require('vertica-nodejs')
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
```

### Connection Pool with Connection String

Connection strings work the same way with connection pools

```javascript 
    const {Pool} = require('vertica-nodejs')
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
```

## Executing Queries and Accessing Results

After establishing a connection in whatever way you choose, you can query your Vertica database. There are a number of ways to do this including simple queries, parameterized queries, and prepared statements. The results can be further modified by changing the rowMode, or using custom type parsers as you will see in the examples below. 

The examples below use callbacks, but you can just as easily modify them to use promises (ex. ```client.query(...).then(...).catch(...)```) 
or modify them to use async/await (```const result = await client.query(...)```)

### First, a note about Results

Results are constructed after a successful query to contain a number of properties, all of which are visible in the result object. The ones you will find most useful are the 'rows' and 'fields' properties. 

The 'rows' property contains an array of data rows. Each data row is an object with key-value pairs that map the column name to the column value for that individual row. This can be changed by setting the 'rowMode' to 'array' in which case the rows property will contain a two dimensional array, where each inner array contains just the column values without the column names. 

The 'fields' property contains an array of 'Field' objects. Each 'Field' object contains metadata about the columns returned by the query. 

Currently, all calls to query() will return a result object, but only queries that return a DataRow from the server will have contents in the result's 'rows' and 'fields' properties. 


### Simple Query

For simple query protocol in which your query contains only text and no parameters, you can provide just the query string as a parameter to the query() method. 

```javascript 
    const {Client} = require('vertica-nodejs')
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
```

### Parameterized Query

In a parameterized query, both the queryString and an ordered array of values need to be provided.

```javascript 
    const {Client} = require('vertica-nodejs')
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
```

### Prepared Statement

Prepared statements are slightly different. Here we will provide a query in the form of an object containing a query name (name), query string (text), and an ordered array of values (values). Once the query has been submitted, subsequent uses of the same prepared statement need only to use the name and value array, and not the query string in the query object. 

```javascript 
    const {Client} = require('vertica-nodejs')
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
        client.query({name: queryName, values: valueArray}, (err, res) => { 
            console.log(err || res.rows)
            client.end()
        })
    })
```

### Modifying Result Rows with RowMode

The Result.rows returned by a query are by default an array of objects with key-value pairs that map the column name to column value for each row. Often you will find you don't need that, especially for very large result sets. In this case you can provide a query object parameter containing the rowMode field set to 'array'. This will cause the driver to parse row data into arrays of values without creating an object and having key-value pairs. 

```javascript 
    const {Client} = require('vertica-nodejs')
    const client = new Client()

    client.connect()
    client.query("CREATE LOCAL TEMP TABLE users(id int, name varchar)")
    client.query("INSERT INTO users VALUES (1, 'John')")
    client.query("INSERT INTO users VALUES (2, 'Jane')")
    client.query({text: "SElECT * FROM users", rowMode: 'array'}, (err, res) => {
        console.log(err || res.rows) // [ [1, 'John'], [2, 'Jane'] ]
        client.end()
    })
```

### Custom Type Parsing of Result Rows

It is also possible to provide your own type parsers. See the Data Type Parsing below to find out about what parsing the driver currently supports. To provide your own parsers, the query object parameter needs a types property which contains a function for parsing the resulting row data. 

For this example, note that the server is returning everything as a string. The driver by default knows how to parse integers, but we have provided a type parser that does not modify the values returned by the server. In this case our Result rows will contain the integer values returned from the server as strings. 

```javascript 
    const {Client} = require('vertica-nodejs')
    const client = new Client()

    client.connect()
    client.query("CREATE LOCAL TEMP TABLE users(id int, name varchar)")
    client.query("INSERT INTO users VALUES (1, 'John')")
    client.query("INSERT INTO users VALUES (2, 'Jane')")
    const query = {
        text: "SELECT * FROM USERS",
        types: {
            getTypeParser: () => val => val,
        },
    }
    client.query(query, (err, res) => {
        console.log(err || res.rows) 
        client.end()
    })
```

## License

Apache 2.0 License, please see [LICENSE](https://github.com/vertica/vertica-nodejs/blob/master/LICENSE) for details.

