#### artichoke
![artichoke](artichoke_logo.png)
> :package: Unix archiver (ar) implementation with Node.js.

[![Build Status](https://travis-ci.org/stpettersens/artichoke.png?branch=master)](https://travis-ci.org/stpettersens/artichoke)
[![Build status](https://ci.appveyor.com/api/projects/status/ls5e2ditpj0h6js5?svg=true)](https://ci.appveyor.com/project/stpettersens/artichoke)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)
[![npm version](https://badge.fury.io/js/ssp-artichoke.svg)](http://npmjs.com/package/ssp-artichoke)
[![Dependency Status](https://david-dm.org/stpettersens/artichoke.png?theme=shields.io)](https://david-dm.org/stpettersens/artichoke) [![Development Dependency Status](https://david-dm.org/stpettersens/artichoke/dev-status.png?theme=shields.io)](https://david-dm.org/stpettersens/artichoke#info=devDependencies)

##### Install

- `npm install ssp-artichoke --production`

##### Tests

If you want to run the tests, install without `--production` flag.
You may also need to first install [Gulp](https://github.com/gulpjs/gulp) globally with:

- `npm install -g gulp`

Then run tests with:

- `npm test`

##### Usage

```js
'use strict'

const artichoke = require('ssp-artichoke')
let options = {native: true, verbose: false}
artichoke.createArchive('my_archive.ar', ['package.json', 'GPL-LICENSE', 'MIT-LICENSE'], options)
```

The omittable options object has parameters to force use of the native add-on (i.e. prompt a message on fallback) and whether to use verbose output on creation of archive.

##### Other requirements

If you wish to make use of the native-addon. Your system will need:

* [node-gyp](https://github.com/nodejs/node-gyp)
* Python 2.7+ (not 3.0+)
* A C++11 compiler (e.g. g++ 4.8+)


##### Logo

Special thanks to [James Warman](https://github.com/jwarman87) for designing the logo.

##### License

Artichoke is dual licensed under the GNU General Public License and MIT licenses respectively.
