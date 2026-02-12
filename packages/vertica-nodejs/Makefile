SHELL := /bin/sh

connectionString=vertica://

params := $(connectionString)

node-command := xargs -I file node file $(params)
mocha-command := xargs -I file npx mocha file 

.PHONY : test-integration test-mocha-integration test-mocha-unit bench update-npm

all:
	npm install

help:
	@echo "make test-all [connectionString=vertica://<your connection string>]"

test-all: test-mocha-unit test-mocha-integration test-unit test-integration

update-npm:
	@npm i npm --global

bench:
	@find test/benchmark -name "*bench.js" | $(node-command)

test-unit:
	@printf "\n***TESTING VERTICA-NODEJS UNIT TESTS***\n\n"
	@find test/unit -name "*-tests.js" | $(node-command)

test-integration:
	@printf "\n***TESTING VERTICA-NODEJS INTEGRATION TESTS***\n\n"
	@find test/integration -name "*-tests.js" | $(node-command)

test-mocha-integration:
	@printf "\n***TESTING VERTICA-NODEJS MOCHA INTEGRATION TESTS***\n\n"
	@if [ -d mochatest/integration ]; then find mochatest/integration -name "*-tests.js" | $(mocha-command); else echo "mochatest/integration not found — skipping"; fi

test-mocha-unit:
	@printf "\n***TESTING VERTICA-NODEJS MOCHA UNIT TESTS***\n\n"
	@if [ -d mochatest/unit ]; then find mochatest/unit -name "*-tests.js" | $(mocha-command); else echo "mochatest/unit not found — skipping"; fi
