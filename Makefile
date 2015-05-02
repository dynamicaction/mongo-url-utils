SRC ?= lib src
TESTS = test
INTEGRATION_TESTS = test/integration

NAME ?= $(shell node -e 'console.log(require("./package.json").name)')
VERSION ?= $(shell node -e 'console.log(require("./package.json").version)')

NODE ?= $(shell which node)
NPM ?= $(shell which npm)
JSHINT ?= node_modules/jshint/bin/jshint
MOCHA ?= node_modules/mocha/bin/mocha
REPORTER ?= spec
NODEMON ?= node_modules/nodemon/bin/nodemon.js

all: build

build:
	@echo -----------------------------
	@echo - BUILDING PARSERS FROM SRC -
	@echo -----------------------------
	$(NODE) ./build.js

build-dev:
	@echo ---------------------------------------------------------
	@echo - BUILDING PARSERS AUTOMATICALLY RERUNS ON FILE CHANGES -
	@echo ---------------------------------------------------------
	$(NODE) $(NODEMON) --ext pegjs --watch src --exec node ./build.js

test: build
	@echo -----------------
	@echo - RUNNING TESTS -
	@echo -----------------
	$(NODE) $(MOCHA) --reporter $(REPORTER) $(TESTS)

integration-test: build
	@echo --------------------------------------------
	@echo - RUNNING INTEGRATION TESTS requires mongo -
	@echo --------------------------------------------
	$(NODE) $(MOCHA) --reporter $(REPORTER) $(INTEGRATION_TESTS)

test-dev:
	@echo ---------------------------------------------
	@echo - TESTS AUTOMATICALLY RERUN ON FILE CHANGES -
	@echo ---------------------------------------------
	$(NODE) $(MOCHA) $(TESTS) $(INTEGRATION_TESTS) --reporter $(REPORTER) --watch $(SRC)

dev:
	@echo -----------------------
	@echo - INSTALLING DEV DEPS -
	@echo -----------------------
	$(NPM) install

lint:
	@echo ------------------
	@echo - LINTING SOURCE -
	@echo ------------------
	$(NODE) $(JSHINT) $(SRC)

	@echo -----------------
	@echo - LINTING TESTS -
	@echo -----------------
	$(NODE) $(JSHINT) $(TESTS)

release: lint build test

.PHONY: dev lint test test-dev integration-test build build-dev
