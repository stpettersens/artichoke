/*
  artichoke: Unix archiver (ar) implementation with Node.js.
  Copyright 2016 Sam Saint-Pettersen.

  Released under the MIT License.
*/

'use strict'

let USE_NATIVE = false

const fs = require('fs')
const conv = require('binstring')
let native = null

try {
  native = require('./build/Release/artichoke')
  USE_NATIVE = true
} catch (e) {
  USE_NATIVE = false
}

function getStats (filename) {
  let stats = fs.lstatSync(filename)
  let modified = Date.parse(stats['mtime']) / 1000
  let size = stats['size']

  return [modified, 1000, 1000, 100664, size]
}

function padData (n, data) {
  let padding = data
  for (let i = 0; i < (n - data.length); i++) {
    padding += String.fromCharCode(32)
  }
  return padding
}

function createEntry (filename) {
  let attribs = getStats(filename)
  return {
    file: filename,
    modified: attribs[0],
    owner: attribs[1],
    group: attribs[2],
    mode: attribs[3],
    size: attribs[4]
  }
}

function toBuffer (data) {
  return conv(data, {out: 'buffer'})
}

function writeArchive (archive, entries) {
  /**
   * COMMON AR FORMAT SPECIFICATION
   * (0) Global header
   * (a) Filename in ASCII [0:16]
   * (b) File modification timestamp (Decimal) [16:12]
   * (c) Owner ID (Decimal) [28:6]
   * (d) Group ID (Decimal) [34:6]
   * (e) File mode (Octal) [40:8]
   * (f) File size in bytes (Decimal) [48:10]
   * (g) Magic number ("0x60 0x0A") [58:2]
  */
  let ar = fs.createWriteStream(archive, {flags: 'w', encoding: 'binary'})
  let header = '!<arch>' + String.fromCharCode(0x0A) // (0)
  let data = []
  data.push(toBuffer(header))
  entries.map(function (entry) {
    let contents = fs.readFileSync(entry.file)
    data.push(toBuffer(padData(16, entry.file + '/'))) // (a)
    data.push(toBuffer(padData(12, entry.modified.toString()))) // (b)
    data.push(toBuffer(padData(6, entry.owner.toString()))) // (c)
    data.push(toBuffer(padData(6, entry.group.toString()))) // (d)
    data.push(toBuffer(padData(8, entry.mode.toString()))) // (e)
    data.push(toBuffer(padData(10, entry.size.toString()))) // (f)
    data.push(toBuffer(String.fromCharCode(0x60) + String.fromCharCode(0x0A))) // (g)
    data.push(contents)
  })
  ar.write(Buffer.concat(data))
  ar.close()
}

module.exports.createArchive = function (archive, files, options) {
  let entries = []
  if (Array.isArray(files)) {
    entries = files.map(function (f) {
      return createEntry(f)
    })
  } else {
    entries.push(createEntry(files))
  }

  if (options && options.native) {
    if (native === null) {
      USE_NATIVE = false
      console.warn('artichoke: Falling back to pure JS implementation ( native: ', USE_NATIVE, ')')
    }
  }

  if (options && !options.native) {
    USE_NATIVE = false
  }

  if (options && options.verbose) {
    console.info('Using native: ', USE_NATIVE)
    console.log(JSON.stringify(entries, null, 4))
  }

  if (USE_NATIVE) {
    let manifest = archive + '.entries'
    fs.writeFileSync(manifest, '')
    entries.map(function (entry) {
      fs.appendFileSync(manifest,
      `${entry.file}:${entry.modified}:${entry.owner}:` +
      `${entry.group}:${entry.mode}:${entry.size}\n`)
    })
    native.write_archive(archive, manifest)
  } else {
    writeArchive(archive, entries)
  }
}
