var thr = require('through2')
var fs = require('fs')
var promisify = require('node-promisify')
var fsStat = promisify(fs.stat)
var path = require('path')
var mix = require('mixy')

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
  var recorded = {}

  function write(row, _, next) {
    if (row.file) {
      var basedir = row.basedir || opts.basedir || process.cwd()
      recorded[path.resolve(basedir, row.file)] = true
    }
    next(null, row)
  }

  function end(done) {
    var self = this
    Promise.resolve().then(function () {
      return opts.getExtraDeps()
    }).then(function (rows) {
      if (!rows || rows.length === 0) return
      return Promise.all(
        rows.map(function (row) {
          var file = row.dependenciesFilter
          if (recorded[file]) {
            return self.push(row)
          }
          return fsStat(file).then(function () {
            self.push({ file: file })
          }, function () {
            self.push({ file: file, source: '' })
          }).then(function () {
            self.push(row)
          })
        })
      )
    })
    .then(function () {
      done()
    }, this.emit.bind(this, 'error'))
  }

  function exists(file) {
    var records = b._recorded || []
  }

  return thr.obj(write, end)
}

