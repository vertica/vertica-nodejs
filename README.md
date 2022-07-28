# vertica-nodejs

[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)
[![NPM version](https://img.shields.io/npm/v/vertica-nodejs?color=blue)](https://www.npmjs.com/package/vertica-nodejs)
[![NPM downloads](https://img.shields.io/npm/dm/vertica-nodejs)](https://www.npmjs.com/package/vertica-nodejs)

Non-blocking Vertica client for Node.js. Pure JavaScript and optional native libpq bindings.

## Documentation

This repo is a monorepo which contains the core vertica-nodejs module as well as a handful of related modules. Each individual package should have its own readme more focused on how to develop and use all the capabilities of the driver. 
- [v-pool](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-pool)
- [v-connection-string](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-connection-string)
- [v-protocol](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-protocol)

## Contributing

Each individual package should have its own readme more focused on how to develop and use all the capabilities of the driver. For more information on how to contribute, check out our [contributing guidelines](#contributing-guidelines).-->

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

## Examples

See the [examples directory](https://github.com/vertica/vertica-nodejs/tree/master/examples) for sample applications showing how to use the vertica-nodejs client driver.

<!-- 
## Contributing

Outside contributions to this project are greatly appreciated. Following standard Vertica open source practices, please see [CONTRIBUTING.md](CONTRIBUTING.md)
-->

## Setting up for local development

1. Clone the repo
2. From your workspace root run `yarn` and then `yarn lerna bootstrap`
3. Ensure you have a Vertica instance running with 
4. Ensure you have the proper environment variables configured for connecting to the instance (`V_HOST`, `V_PORT`, `V_USER`, `V_PASSWORD`, `V_DATABASE`, `V_BACKUP_SERVER_NODE`)
5. Run `yarn test` to run all the tests, or run `yarn test` from within an individual package to only run that package's tests

If using VS Code, you can install the `Remote - Containers` extension and it will use the configuration under the `.devcontainer` folder to automatically create dev containers, including Vertica.  See [here](https://code.visualstudio.com/docs/remote/containers) for more information on developing in containers using VS Code.  This process will complete steps 2 to 4 above.

## Troubleshooting and FAQ

The causes and solutions to common errors can be found among the [Frequently Asked Questions (FAQ)](https://github.com/vertica/vertica-nodejs/wiki/FAQ)

## License

Apache 2.0 License, please see [LICENSE](LICENSE) for details.
