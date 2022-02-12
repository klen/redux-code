all: build

node_modules: package.json
	npm install
	touch node_modules

build: node_modules
	@rm -rf dist
	@npx tsc
	@npx tsc -p tsconfig-esm.json
	@npx prettier -w dist/**/*.*s

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
