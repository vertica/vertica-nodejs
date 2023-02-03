# v-pool

[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)
[![NPM version](https://img.shields.io/npm/v/v-pool?color=blue)](https://www.npmjs.com/package/v-pool)
[![NPM downloads](https://img.shields.io/npm/dm/v-pool)](https://www.npmjs.com/package/v-pool)

Enables connection pooling with the vertica-nodejs driver

## Documentation

v-pool is part of a much larger project, vertica-nodejs. While each individual package should have its own documentation for exposing and detailing related components of the vertica-nodejs API, the main location for those using the driver can be found here:

- [vertica-nodejs](https://github.com/vertica/vertica-nodejs/tree/master/packages/vertica-nodejs)

Other packages part of the vertica-nodejs project can be found here:

- [v-connection-string](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-connection-string)
- [v-protocol](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-protocol)

## Constructor

### new Pool([config: object])

The Pool's config object supports all of the same config options that is supported by a Client.
The Pool config also supports these four additional options: 
 * connectionTimeoutMillis (int) - number of milliseconds to wait before timing out when connecting a client
   + default: 0 (no timeout)
 * idleTimeoutMillis (int) - number of milliseconds an idle client in the pool will without being checked out before being discarded by the backend
   + default: 10000 (10 seconds)
   + value of 0 disables disconnection of idle clients automatically
 * max (int) - maximum number of clients the Pool will hold
   + default: 10
   + allowExitOnIdle (boolean) - allows node event loop to exit when clients in the pool are idle, but not yet discarded from idleTimeoutMillis expiration. Prevents waiting on timeout when no work is being done or expected to be done (think scripting/testing)

 ### pool.connect(callback: (err?: Error, client?: pg.Client, release?: releaseCallback) => void) => void

 Acquires a client or queues to acquire a client from the pool (if no available clients). If a pool has less than the max amount of clients, a new client will be created. 


 ### pool.connect() => Promise<pg.Client>

 Acquiring a client via promise. 



 ### releaseCallback

 The releaseCallback releases a client back into the pool. You must call the releaseCallback, otherwise the number of available clients will dwindle and eventually run out if you are using clients faster than the connectionTimeoutMillis setting will return idle clients the pool on its own.  

 Clients issued by a connection pool will have a release method. This method is the same method provided to the connect callback if using the pool with callbacks. 



### pool.query 
 
Connection pools have a built in convenience for running single queries. pool.query will find the first available client and execute the query on this client, returning the result, and then releasing the client back into the pool on its own. This is for convenience, however, NO queries needing transactional integrity should be submitted this way. Transactions are scoped to individual clients and using pool.query in succession will almost certainly use multiple clients. 



### pool.end

pool.end will drain the pool of active clients, making sure they are disconnected and all timers are neglected. This is the best and most complete way to clean up after all work has been done. 

## Emitted events

Pool is an instance of EventEmitter and issues the following events: 
* connect: when a new client connection is establisehd and added to the pool
  + pool.on('conect', (client: Client) => void) => void
* acquire: when a client is checked out from the existing pool
  + pool.on('acquire', (client: Client) => void) => void
* error: in the event of an error on the backend, can be emitted by active and idle clients
  + pool.on('error', (err: Error, client: Client) +. void) => void
* remove: when a client is closed and removed from a pool
  + pool.on('remove', (client: Client) => void) => void


## License

Apache 2.0 License, please see [LICENSE](https://github.com/vertica/vertica-nodejs/blob/master/LICENSE) for details.
