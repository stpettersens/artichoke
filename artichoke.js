/*
  Artichoke
  Unix archiver (ar) implementation with Node.js.
  Copyright 2016 Sam Saint-Pettersen.

  Released under the MIT License.
*/

'use strict'

const fs = require('fs')

function getStats (filename) {
  let stats = fs.lstatSync(filename)
  let modified = Date.parse(stats['mtime']) / 1000
  let size = stats['size']
  let magic = `${String.fromCharCode(96)}${String.fromCharCode(10)}`

  return [modified, 1000, 1000, 100664, size, magic]
}

function padData (length) {
  let padding = ''
  for (let i = 1; i < length; i++) {
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
    size: attribs[4],
    magic: attribs[5]
  }
}

module.exports.createArchive = function (archive, files) {
  let entries = [];
  if (Array.isArray(files)) {
    entries = files.map(function (f) {
      return createEntry(f)
    })
  } else {
    let attribs = getStats(files)
    entries.push(createEntry(files))
  }

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
  let ar = fs.createWriteStream(archive)
  let header = `!<arch>${String.fromCharCode(10)}` // (0)
  let data = ''
  entries.map(function (entry) {
    let contents = fs.readFileSync(entry.file, 'ascii').toString()
    console.log(JSON.stringify(entry, null, 4))
    data += `${entry.file}/${padData(16 - entry.file.length)}` // (a)
    data += `${entry.modified}${padData(13 - entry.modified.toString().length)}` // (b)
    data += `${entry.owner}${padData(7 - entry.owner.toString().length)}` // (c) 
    data += `${entry.group}${padData(7 - entry.group.toString().length)}${entry.mode}` // (d, e)
    data += `${padData(9 - entry.mode.toString().length)}${entry.size}` // (f)
    data += `${padData(11 - entry.size.toString().length)}${entry.magic}` // (g)
    data += contents
  })
  ar.write(header + data + String.fromCharCode(10))
  ar.close()
}
