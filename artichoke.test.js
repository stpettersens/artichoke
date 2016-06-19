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

  /* it('Should create archive using native implementation.', function (done) {
    artichoke.createArchive(archives[0], sources, {native: true, verbose: true})
    if (!fs.existsSync(archives[0])) {
      throw Error
    }
    done()
  }) */

  it('Should create archive using pure JS implementation.', function (done) {
    artichoke.createArchive(archives[1], sources, {native: false, verbose: true})
    assert.equal(fs.existsSync(archives[1]), true)
    done()
  })

  /* it('Archives created by native and pure JS implementations should be equal.', function (done) {
    let stats = []
    archives.map(function (archive) {
      fs.lstat(archive, function (err, stat) {
        if (err) {
          throw Error
        }
        stats.push(stat.size)
        if (stats.length === 2) {
          console.log(stats)
          assert.equal(stats[0], stats[1])
        }
      })
    })
    done()
  }) */
})
