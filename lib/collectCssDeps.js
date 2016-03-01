'use strict'

const through = require('./through')

module.exports = function (b, opts) {
  function collect() {
    let stream = collectCssDeps(opts)
    stream.once('css-deps', b.emit.bind(b, 'css-deps'))
    b.pipeline.get('deps').push(stream)
  }

  b.on('reset', collect)
  collect()
}
module.exports.collectCssDeps = collectCssDeps

function collectCssDeps(opts) {
  opts = opts || {}
  let cssDeps = []
  function getStyle(jsFile) {
    return Promise.resolve().then(function () {
      if (opts.getStyle) {
        return opts.getStyle(jsFile)
      }
    })
    .catch(function () {})
  }

  function write(row, _, next) {
    getStyle(row.file).then(function (cssFile) {
      if (!cssFile) return next(null, row)

      let deps = Object.keys(row.deps).map(function (dep) {
        return row.deps[dep]
      })
      if (!deps.length) return next(null, row)

      return Promise.all(deps.map(getStyle))
        .then(function (cssFiles) {
          cssFiles = cssFiles.filter(Boolean)
          if (cssFiles.length) {
            cssDeps.push({
              dependenciesFilter: cssFile,
              deps: cssFiles,
            })
          }
          next(null, row)
        })
    })
    .catch(this.emit.bind(this, 'error'))
  }

  function end(done) {
    this.emit('css-deps', cssDeps)
    done()
  }

  return through(write, end)
}

