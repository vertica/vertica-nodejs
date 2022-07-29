# vertica-nodejs

[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)
[![NPM version](https://img.shields.io/npm/v/vertica-nodejs?color=blue)](https://www.npmjs.com/package/vertica-nodejs)
[![NPM downloads](https://img.shields.io/npm/dm/vertica-nodejs)](https://www.npmjs.com/package/vertica-nodejs)

Non-blocking Vertica client for Node.js. Pure JavaScript and optional native libpq bindings.

## Documentation

This monorepo contains the core vertica-nodejs module as well as a handful of related modules. Each individual package should have its own documentation with more specific information designed to help develop with the full capabilities of the driver.
- [v-pool](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-pool)
- [v-connection-string](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-connection-string)
- [v-protocol](https://github.com/vertica/vertica-nodejs/tree/master/packages/v-protocol)

## Features

- Pure JavaScript client
- Connection pooling
- Extensible JS ↔ Vertica data-type coercion
- Customizable type parsing

<!-- ## Contributing

For more information on how to contribute, check out our [contributing guidelines](#contributing-guidelines).-->

## Installation
    To install vertica-nodejs with npm: 
      `npm install vertica-nodejs`

## Post Installation Setup 

The current version of the driver is routinely tested against Node v14. It is recommended to install this version of node in your application environment. 

Ensure that you have an active Vertica server.

Ensure that the applicable environment variables are configured for connecting to your Vertica server:
 - V_HOST
 - V_PORT
 - V_USER
 - V_PASSWORD
 - V_DATABASE
 - V_BACKUP_SERVER_NODE

## Examples

See the [examples directory](https://github.com/vertica/vertica-nodejs/tree/master/examples) for sample applications showing how to use the vertica-nodejs client driver. Other usage examples can be found in the documentation of each individual package.

## Vertica Data Types

See [DATATYPES.md](https://github.com/vertica/vertica-nodejs/blob/master/DATATYPES.md) to view the mappings from type IDs to Vertica data types.

## Setting up for local driver development

The following instructions are for working with the driver source code. Follow this set up if you intend to contribute to the driver. These steps are similar to those for developing with the driver, but include steps for building and testing locally. 

1. Clone the repo
2. From your workspace root run `yarn` and then `yarn lerna bootstrap`
3. Ensure you have a Vertica instance running with 
4. Ensure you have the proper environment variables configured for connecting to the instance (`V_HOST`, `V_PORT`, `V_USER`, `V_PASSWORD`, `V_DATABASE`, `V_BACKUP_SERVER_NODE`)
5. Run `yarn test` to run all the tests, or run `yarn test` from within an individual package to only run that package's tests

If using VS Code, you can install the `Remote - Containers` extension and it will use the configuration under the `.devcontainer` folder to automatically create dev containers, including Vertica.  See [here](https://code.visualstudio.com/docs/remote/containers) for more information on developing in containers using VS Code.  This process will complete steps 2 to 4 above.

## Support

vertica-nodejs is free software. If you encounter a bug with the library please open an issue on the [GitHub repo](https://github.com/vertica/vertica-nodejs). If you have questions unanswered by the documentation please open an issue pointing out how the documentation was unclear and we will address it as needed. 

When you open an issue please provide:

- version of Node
- version of Vertica
- smallest possible snippet of code to reproduce the problem

## Troubleshooting and FAQ

The causes and solutions to common errors can be found among the [Frequently Asked Questions (FAQ)](https://github.com/vertica/vertica-nodejs/wiki/FAQ)

## License

Apache 2.0 License, please see [LICENSE](LICENSE) for details.
