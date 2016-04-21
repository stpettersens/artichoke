/*
  Test artichoke.
*/

/* global describe it */
'use strict'

const artichoke = require('./artichoke')
const assert = require('chai').assert
const fs = require('fs')
const _exec = require('child_process').exec

let archives = ['artichoke_na.ar', 'artichoke_js.ar']
let files = ['artichoke.js', 'LICENSE']
let sources = ['artichoke.js', 'artichoke.test.js']

describe('Test artichoke:', function () {
    it('Test code conforms to JS Standard Style (http://standardjs.com).', function (done) {
    _exec(`standard ${sources.join(' ')}`, function (err, stdout, stderr) {
      let passed = true
      if (err || stderr.length > 0) {
        console.log('\n' + stderr)
        console.log(stdout)
        passed = false
      }
      assert.equal(passed, true)
      done()
    })
  })
  
  it('Should create archive using native add-on.', function (done) {
    artichoke.createArchive(archives[0], files, {native: true, verbose: true})
    if (!fs.existsSync(archives[0])) {
      throw Error
    }
    done()
  })

  it('Should create archive using pure JS implementation.', function (done) {
    artichoke.createArchive(archives[1], files, {native: false, verbose: true})
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
