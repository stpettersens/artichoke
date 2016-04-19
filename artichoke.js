/*
  artichoke: Unix archiver (ar) implementation with Node.js.
  Copyright 2016 Sam Saint-Pettersen.

  Released under the MIT License.
*/

'use strict'

let USE_NATIVE = false

const fs = require('fs')
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

function formatBytes (bytes) {
  let never = false;
  let formatted = '';
  for (let i = 0; i < bytes.length; i++) {
    if (bytes.charCodeAt(i) === 11) {
      let offset = bytes.charCodeAt(i) + 128
      let repla = String.fromCharCode(offset)
      formatted += repla
    } else {
      formatted += bytes.charAt(i)
    }
  }
  return formatted
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
  let ar = fs.createWriteStream(archive)
  let header = `!<arch>${String.fromCharCode(10)}` // (0)
  let data = ''
  for (let i = 0; i < entries.length; i++) {
    let contents = fs.readFileSync(entries[i].file, 'ascii').toString()
    data += `${entries[i].file}/${padData(16 - entries[i].file.length)}` // (a)
    data += `${entries[i].modified}${padData(13 - entries[i].modified.toString().length)}` // (b)
    data += `${entries[i].owner}${padData(7 - entries[i].owner.toString().length)}` // (c) 
    data += `${entries[i].group}${padData(7 - entries[i].group.toString().length)}${entries[i].mode}` // (d, e)
    data += `${padData(9 - entries[i].mode.toString().length)}${entries[i].size}` // (f)
    data += `${padData(11 - entries[i].size.toString().length)}${entries[i].magic}` // (g)
    data += contents
    if(i > 0) {
      data += String.fromCharCode(0)
    }
  }
  ar.write(header + data + String.fromCharCode(10))
  ar.close()
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

  console.log(JSON.stringify(entries, null, 4))

  if (USE_NATIVE) {
    let manifest = archive + '.entries'
    fs.writeFileSync(manifest, '')
    entries.map(function (entry) {
      fs.appendFileSync(manifest,
      `${entry.file}:${entry.modified}:${entry.owner}:`
      +  `${entry.group}:${entry.mode}:${entry.size}\n`)
    })
    native.write_archive(archive, manifest)
  } else {
    writeArchive(archive, entries)
  }
}
