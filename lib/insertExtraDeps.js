'use strict'

const through = require('./through')
const fs = require('fs')
const promisify = require('node-promisify')
const fsStat = promisify(fs.stat)
const path = require('path')
const mix = require('mixy')

module.exports = function (b, opts) {
  function insert() {
    b.pipeline.get('deps').unshift(
      insertExtraDeps(mix({ basedir: b._options.basedir }, opts))
    )
  }

  b.on('reset', insert)
  insert()
}

function insertExtraDeps(opts) {
  let recorded = {}

  function write(row, _, next) {
    if (row.file) {
      let basedir = row.basedir || opts.basedir || process.cwd()
      recorded[path.resolve(basedir, row.file)] = true
    }
    next(null, row)
  }

  function end(done) {
    Promise.resolve().then(function () {
      return opts.getExtraDeps()
    }).then(rows => {
      if (!rows || rows.length === 0) return
      return Promise.all(
        rows.map(row => {
          let file = row.dependenciesFilter
          if (recorded[file]) {
            return this.push(row)
          }
          return fsStat(file).then(() => {
            this.push({ file: file })
          }, () => {
            this.push({ file: file, source: '' })
          }).then(() => {
            this.push(row)
          })
        })
      )
    })
    .then(function () {
      done()
    }, err => this.emit('error', err))
  }

  return through(write, end)
}

