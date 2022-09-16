## Setting up for local driver development

The following instructions are for working with the driver source code. Follow this set up if you intend to contribute to the driver. These steps are similar to those for developing with the driver, but include steps for building and testing locally. 

1. Clone the repo
2. If yarn is not already installed, install yarn `npm install -g yarn`
3. From your workspace root run `yarn` and then `yarn lerna bootstrap`
4. Ensure you have a Vertica instance running with 
5. Ensure you have the proper environment variables configured for connecting to the instance (`V_HOST`, `V_PORT`, `V_USER`, `V_PASSWORD`, `V_DATABASE`, `V_BACKUP_SERVER_NODE`)
6. Run `yarn test` to run all the tests, or run `yarn test` from within an individual package to only run that package's tests

If using VS Code, you can install the `Remote - Containers` extension and it will use the configuration under the `.devcontainer` folder to automatically create dev containers, including Vertica.  See [here](https://code.visualstudio.com/docs/remote/containers) for more information on developing in containers using VS Code.  This process will complete steps 3 to 5 above.