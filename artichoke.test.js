/*
  Test artichoke.
*/

/* global describe it */
'use strict'

const artichoke = require('./artichoke')
const assert = require('chai').assert
const fs = require('fs')

let archives = ['artichoke_na.ar', 'artichoke_js.ar']
let files = ['artichoke.js', 'LICENSE']

describe('Test artichoke:', function () {
  it('Should create archive using native add-on.', function (done) {
    artichoke.createArchive(archives[0], files,
    {native: true, verbose: true})
    if (!fs.existsSync(archives[0])) {
      throw Error
    }
    done()
  })

  it('Should create archive using pure JS implementation.', function (done) {
    artichoke.createArchive(archives[1], files,
    {native: false, verbose: true})
    if (!fs.existsSync(archives[1])) {
      throw Error
    }
    done()
  })

  it('Archives created by native and pure JS implementations should be equal.', function (done) {
    let stats = []
    archives.map(function (archive) {
      stats.push(fs.lstatSync(archive))
    })
    assert.equal(stats[0]['size'], stats[1]['size'])
    archives.map(function (archive) {
      fs.unlinkSync(archive)
    })
    done()
  })
})
