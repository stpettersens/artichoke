'use strict'

const artichoke = require('./artichoke')

/* artichoke.createArchive('bar.deb', [ 'debian-binary', 'control.tar.gz', 'data.tar.gz' ],
 {native: true, verbose: true}) */
artichoke.unpackArchive('demo_0.1-1.deb', {native: false, verbose: true})
