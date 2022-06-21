# vertica-nodejs

<!-- NPM package when published -->
<!-- NPM downloads when published -->
[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)

Non-blocking Vertica client for Node.js. Pure JavaScript and optional native libpq bindings.

## DISCLAIMER: 
vertica-nodejs is still pre-release and actively being improved. As of 5/5/22 this is not intended for use in production environments. 

## Monorepo

This repo is a monorepo which contains the core [vertica-nodejs](https://github.com/vertica/vertica-nodejs/tree/master/packages/vertica-nodejs) module as well as a handful of related modules.

- [vertica-nodejs](https://github.com/vertica/vertica-nodejs/tree/master/packages/vertica-nodejs)
- [v-pool](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-pool)
- [v-connection-string](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-connection-string)
- [v-protocol](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-protocol)

<!--
## Documentation

Each package in this repo should have its own readme more focused on how to develop/contribute. For more information on how to contribute, check out our [contributing guidelines](#contributing-guidelines).-->

<!-- ## Installation
    To install vertica-nodejs with npm: ``` TO DO ```

    To use vertica-nodejs linked locally from source (not recommended in production): ``` TO DO - Take notes from http://confluence.verticacorp.com/display/DEV/Node.js+Development+Resources```

-->

## Vertica Data Types

See [DATATYPES.md](https://github.com/vertica/vertica-nodejs/blob/master/DATATYPES.md) to view the mappings from type IDs to Vertica data types.

### Features

- Pure JavaScript client and native libpq bindings share _the same API_
- Connection pooling
- Extensible JS ↔ Vertica data-type coercion
<!-- - Supported Vertica features -->
  <!-- - Async notifications with `LISTEN/NOTIFY` verifiy this -->
  <!-- - Bulk import & export with `COPY TO/COPY FROM` not part of the MVP -->

## Support

vertica-nodejs is free software. If you encounter a bug with the library please open an issue on the [GitHub repo](https://github.com/vertica/vertica-nodejs). If you have questions unanswered by the documentation please open an issue pointing out how the documentation was unclear and we will address it as needed. 

When you open an issue please provide:

- version of Node
- version of Vertica
- smallest possible snippet of code to reproduce the problem

<!-- 
## Contributing

Outside contributions to this project are greatly appreciated. Following standard Vertica open source practices, please see [CONTRIBUTING.md](CONTRIBUTING.md)
-->


### Setting up for local development

1. Clone the repo
2. From your workspace root run `yarn` and then `yarn lerna bootstrap`
3. Ensure you have a Vertica instance running with 
4. Ensure you have the proper environment variables configured for connecting to the instance (V_HOST, V_PORT, V_USER, V_PASSWORD, V_DATABASE, V_BACKUP_SERVER_NODE)
5. Run `yarn test` to run all the tests, or run `yarn test` from within an individual package to only run that package's tests. 

## Troubleshooting and FAQ

The causes and solutions to common errors can be found among the [Frequently Asked Questions (FAQ)](https://github.com/vertica/vertica-nodejs/wiki/FAQ)

## License

Apache 2.0 License, please see [LICENSE](LICENSE) for details.
