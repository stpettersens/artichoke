/*
  artichoke: Unix archiver (ar) implementation with Node.js.
  Copyright 2016 Sam Saint-Pettersen.

  Dual licensed under the GPL and MIT licenses;
  see GPL-LICENSE and MIT-LICENSE respectively.
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

function toUtf8 (data) {
  return conv(data, {in: 'hex', out: 'utf8'})
}

function fromHexToBuffer (data) {
  return conv(data, {in: 'hex', out: 'buffer'})
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

function checkArchive (ar) {
  let valid = true
  let signature = ''
  for (let i = 0; i < 7; i++) {
    signature += String.fromCharCode(ar[i])
  }
  if (signature !== '!<arch>') {
    valid = false
  }
  return valid
}

function readArchive (archive) {
  let ar = fs.readFileSync(archive)
  let iheaders = []
  let idata = []
  if (checkArchive(ar)) {
    for (let i = 8; i < ar.length; i++) {
      if (String.fromCharCode(ar[i]) !== '`') {
        iheaders.push(String.fromCharCode(ar[i]))
      }
      idata.push(ar[i])
    }
    let hpattern = /([\.\-_\w\/]+\s*\d{10}\s{2}\d{4}\s{2}\d{4}\s{2}\d{6}\s{2}\d{1,4})/g
    let headers = iheaders.join('').match(hpattern)
    console.log(headers)
    let data = []
    for (let i = 0; i < idata.length; i++) {
      data.push(idata[i].toString(16))
    }
    data = data.join('|').split(/\|a\|/g)
    data.splice(0, 1) // Remove first header.
    let fdata = []
    let ffdata = []
    for (let i = 0; i < data.length; i++) {
      let mh = toUtf8(data[i].replace(/\|/g, ''))
      if (!hpattern.test(mh)) {
        fdata.push(data[i].replace(/\|/g, ''))
      }
    }
    // console.log('Header length = ', headers.length)
    // console.log('FData length = ', fdata.length)
    let drops = []
    for (let i = 0; i < fdata.length; i++) {
      if (fdata[i].startsWith('1f') && fdata[i + 1] !== undefined) {
        // console.log('Concating ' + i + ' and ' + (i + 1))
        ffdata.push(`${fdata[i]}a${fdata[i + 1]}`)
        drops.push(i + 1)
      } else {
        ffdata.push(fdata[i])
      }
    }
    fdata = []
    drops.map(function (d) {
      ffdata.splice(d, 1)
    })
    ffdata.splice(headers.length, 1)
    // console.log('FFData length = ', ffdata.length)
    console.log(ffdata)
    for (let i = 0; i < ffdata.length; i++) {
      let out = fs.createWriteStream('out.bin', {flags: 'w', encoding: 'binary'})
      let n = 0
      if (ffdata[1].length % 2 !== 0) {
        n = 1
      }
      out.write(fromHexToBuffer(ffdata[1].substr(0, ffdata[1].length - n)))
      out.close()
    }
  } else {
    console.warn('artichoke: File is not a valid archive')
  }
}

function setCommonOptions (options) {
  if (options && options.native) {
    if (native === null) {
      USE_NATIVE = false
      console.warn('artichoke: Falling back to pure JS implementation ( native: ', USE_NATIVE, ')')
    }
  }
  if (options && !options.native) {
    USE_NATIVE = false
  }
  return options
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

  options = setCommonOptions(options)
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

module.exports.unpackArchive = function (archive, options) {
  options = setCommonOptions(options)
  if (options && options.verbose) {
    console.info('Use native: ', USE_NATIVE)
    console.info('Unpacking archive: ', archive)
  }

  if (USE_NATIVE) {
    native.read_archive(archive)
  } else {
    readArchive(archive)
  }
}
