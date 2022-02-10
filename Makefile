all: build

$(CURDIR)/node_modules: package.json
	npm install
	touch $(CURDIR)/node_modules

publish:
	npm publish

test t: $(CURDIR)/node_modules
	npx ts-mocha

build: $(CURDIR)/node_modules
	rm -rf dist
	npx tsc -b

lint:
	npx eslint src --ext .ts

RELEASE ?= patch
release:
	make build
	bumpversion $(RELEASE)
	make publish
	git checkout master
	git merge develop
	git checkout develop
	git push origin develop master
