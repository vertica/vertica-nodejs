SHELL := /bin/sh

connectionString=vertica://

params := $(connectionString)

node-command := xargs -n 1 -I file node file $(params)
mocha-command := xargs -n 1 -I file mocha file 

.PHONY : test test-connection test-integration test-mocha-integration bench publish update-npm

all:
	npm install

help:
	@echo "make test-all [connectionString=vertica://<your connection string>]"

test: test-unit

test-all: test-mocha-integration test-unit test-integration


update-npm:
	@npm i npm --global

bench:
	@find benchmark -name "*-bench.js" | $(node-command)

test-unit:
	@echo "***Testing vertica-nodejs Unit Tests***"
	@find test/unit -name "*-tests.js" | $(node-command)

test-connection:
	@echo "***Testing connection***"

test-integration: test-connection
	@echo "***Testing vertica-nodejs Integration Tests***"
	@find test/integration -name "*-tests.js" | $(node-command)

test-mocha-integration:
	@echo "***Testing vertica-nodejs mocha Integration Tests***"
	@find mochatest/integration -name "*-tests.js" | $(mocha-command)

