'use strict'

const fs = require('fs')
const path = require('path')
const through = require('./through')

module.exports = function (b, opts) {
  function insert() {
    b.pipeline.get('record').push(
      insertExtraDeps(Object.assign({ basedir: b._options.basedir }, opts))
    )
    let empty = Object.create(null)
    b.pipeline.get('deps').push(through(function (row, _, next) {
      if (!row.source && isEmpty(row.deps)) {
        // empty css
        empty[row.id] = true
        return next()
      }
      next(null, row)
    }))
  }

  b.on('reset', insert)
  insert()
}

function fsStat(file) {
  return new Promise(function (resolve, reject) {
    fs.stat(file, function (err) {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

function isEmpty(o) {
  return Object.keys(o).length === 0
}

function insertExtraDeps(opts) {
  let recorded = Object.create(null)

  function write(row, _, next) {
    if (row.file) {
      let basedir = row.basedir || opts.basedir || process.cwd()
      recorded[path.resolve(basedir, row.file)] = true
    }
    next(null, row)
  }

  function end(next) {
    Promise.resolve()
      .then(() => opts.getExtraDeps())
      .then(rows => {
        if (!rows || rows.length === 0) return
        return Promise.all(
          rows.map(row => {
            let file = row.dependenciesFilter
            if (recorded[file]) {
              return this.push(row)
            }
            return fsStat(file)
              .then(() => this.push({ file: file }))
              .catch(() => this.push({ file: file, source: '' }) )
              .then(() => {
                if (row.deps) {
                  this.push(row)
                }
              })
          })
        )
      })
      .then(() => next(), err => this.emit('error', err))
  }

  return through(write, end)
}

