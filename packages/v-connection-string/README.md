# v-connection-string

[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)
[![NPM version](https://img.shields.io/npm/v/v-connection-string?color=blue)](https://www.npmjs.com/package/v-connection-string)
[![NPM downloads](https://img.shields.io/npm/dm/v-connection-string)](https://www.npmjs.com/package/v-connection-string)

Enables handling of connection strings to establish connections with the vertica-nodejs driver.

## Documentation

v-connection-string is part of a much larger project, vertica-nodejs. While each individual package should have its own documentation for exposing and detailing related components of the vertica-nodejs API, the main location for those using the driver can be found here:

- [vertica-nodejs](https://github.com/vertica/vertica-nodejs/tree/master/packages/vertica-nodejs)

Other packages part of the vertica-nodejs project can be found here:

- [v-pool](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-pool)
- [v-protocol](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-protocol)


## Establishing a TCP Connection with Connection String

The URL format for opening a TCP connection: 
vertica://<user>:<password>@<host>:<port>/<database>?configParams

where configParams are of the format ?parameterName=parameterValue and include other supported options outside of the required five. These config parameters will be passed through the same way as establishing a client connection with a config object. 

Username and Password should be urlencoded, but the database name should not be urlencoded. 

## License

Apache 2.0 License, please see [LICENSE](https://github.com/vertica/vertica-nodejs/blob/master/LICENSE) for details.
