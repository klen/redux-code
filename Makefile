all: build

node_modules: package.json
	npm install
	touch node_modules

build: node_modules
	@rm -rf dist es
	@npx tsc
	@npx tsc -p tsconfig-es.json
	@npx prettier -w es/*

publish:
	npm publish

lint: node_modules
	@./node_modules/.bin/eslint src/*.ts

test t: node_modules
	@./node_modules/.bin/jest

RELEASE ?= patch
release patch:
	bumpversion $(RELEASE)
	git checkout master
	git merge develop
	git checkout develop
	git push origin develop master

minor:
	make release RELEASE=minor

major:
	make release RELEASE=major
