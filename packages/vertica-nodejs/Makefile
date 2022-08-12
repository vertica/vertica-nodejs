SHELL := /bin/sh

connectionString=vertica://

params := $(connectionString)

node-command := xargs -I file node file $(params)
mocha-command := xargs -I file mocha file 

.PHONY : test test-connection test-integration test-mocha-integration test-mocha-unit bench publish update-npm

all:
	npm install

help:
	@echo "make test-all [connectionString=vertica://<your connection string>]"

test-all: test-mocha-unit test-mocha-integration test-unit test-integration

update-npm:
	@npm i npm --global

bench:
	@find benchmark -name "*-bench.js" | $(node-command)

test-unit:
	@echo -e "\n***TESTING VERTICA-NODEJS UNIT TESTS***\n"
	@find test/unit -name "*-tests.js" | $(node-command)

test-integration:
	@echo -e "\n***TESTING VERTICA-NODEJS INTEGRATION TESTS***\n"
	@find test/integration -name "*-tests.js" | $(node-command)

test-mocha-integration:
	@echo -e "\n***TESTING VERTICA-NODEJS MOCHA UNIT TESTS***\n"
	@find mochatest/integration -name "*-tests.js" | $(mocha-command)

test-mocha-unit:
	@echo -e "\n***TESTING VERTICA-NODEJS MOCHA INTEGRATION TESTS***\n"
	@find mochatest/unit -name "*-tests.js" | $(mocha-command)

