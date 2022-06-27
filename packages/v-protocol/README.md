# v-protocol

<!-- NPM package when published -->
<!-- NPM downloads when published -->
[![License](https://img.shields.io/github/license/vertica/vertica-nodejs)](https://opensource.org/licenses/MIT)

Non-blocking Vertica client for Node.js. Pure JavaScript and optional native libpq bindings.

## DISCLAIMER: 
vertica-nodejs is still pre-release and actively being improved. As of 5/5/22 this is not intended for use in production environments. 

<!--
## Documentation

Each package in this repo should have its own readme more focused on how to develop/contribute. For more information on how to contribute, check out our [contributing guidelines](#contributing-guidelines).-->

<!-- ## Installation
    To install vertica-nodejs with npm: ``` TO DO ```

    To use vertica-nodejs linked locally from source (not recommended in production): ``` TO DO - Take notes from http://confluence.verticacorp.com/display/DEV/Node.js+Development+Resources```

-->

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

## Examples

See the [examples directory](https://github.com/vertica/vertica-nodejs/tree/master/examples) for sample applications showing how to use the vertica-nodejs client driver.

## Setting up for local development

1. Clone the repo
2. From your workspace root run `yarn` and then `yarn lerna bootstrap`
3. Ensure you have a Vertica instance running with 
4. Ensure you have the proper environment variables configured for connecting to the instance (V_HOST, V_PORT, V_USER, V_PASSWORD, V_DATABASE, V_BACKUP_SERVER_NODE)
5. Run `yarn test` to run all the tests, or run `yarn test` from within an individual package to only run that package's tests. 

## Troubleshooting and FAQ

The causes and solutions to common errors can be found among the [Frequently Asked Questions (FAQ)](https://github.com/vertica/vertica-nodejs/wiki/FAQ)

## License

<!-- Copyright (c) 2010-2020 Brian Carlson (brian.m.carlson@gmail.com) are we allowed to change this and if so do we have an open source email to use -->

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
