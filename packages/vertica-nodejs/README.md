# vertica-nodejs

[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)
[![NPM version](https://img.shields.io/npm/v/vertica-nodejs?color=blue)](https://www.npmjs.com/package/vertica-nodejs)
[![NPM downloads](https://img.shields.io/npm/dm/vertica-nodejs)](https://www.npmjs.com/package/vertica-nodejs)

Non-blocking Vertica client for Node.js made with pure Javascript.

## Usage examples

### Basic Connection
```javascript
    const client = new Client()

    client.connect()
    client.query("SELECT 'success' as connection", (err, res) => {
        console.log(err || res.rows[0])
        client.end()
    })
```


## Features

- Pure JavaScript client
- Connection pooling
- Extensible JS ↔ Vertica data-type coercion
- Customizable type parsing

## Data Type Parsing

Currently the client only supports type parsing for booleans, integers, and floats where integers and floats are both parsed as javascript numbers. Everything else is treated as a string in the result rows. 

## License

Apache 2.0 License, please see [LICENSE](LICENSE) for details.

