var mixy = require('mixy')
var collectCssDeps = require('./collectCssDeps')
var insertExtraDeps = require('./insertExtraDeps')
var buildOptions = require('./buildOptions')
var RESOLVED = Promise.resolve()

module.exports = Reduce

function Reduce(opts) {
  this._state = buildOptions(opts || {})
}

Reduce.prototype.bundle = function() {
  var state = this._state
  return Promise.all([
    state.js === false ? RESOLVED : bundleJs(state),
    state.css === false ? RESOLVED : bundleCss(state),
  ])
}

function bundleJs(state) {
  var reduce = require('reduce-js')

  if (state.getStyle) {
    state.cssDeps = new Promise(function (resolve) {
      state.resolve = resolve
    })
    reduce.once('instance', function (b) {
      b.once('css-deps', state.resolve)
      b.plugin(collectCssDeps, { getStyle: state.getStyle })
    })
  }

  return bundle(reduce, state.js)
}

function bundleCss(state) {
  var reduce = require('reduce-css')

  if (state.cssDeps) {
    reduce.once('instance', function (b) {
      b.plugin(insertExtraDeps, {
        getExtraDeps: function () {
          return state.cssDeps
        },
      })
    })
  }

  return bundle(reduce, state.css)
}

function bundle(reduce, opts) {
  var bundleTask = function () {
    var build = reduce.lazypipe()
    var trs = [].concat(opts.postTransform).filter(Boolean)
    trs.push(
      opts.dest
        ? [reduce.dest].concat(opts.dest)
        : reduce.dest
    )
    trs.forEach(function (tr) {
      build = build.pipe.apply(build, [].concat(tr))
    })

    mixy.each(opts.on, function (cbs, event) {
      [].concat(cbs).forEach(function (cb) {
        reduce.on(event, cb)
      })
    })

    return reduce.src(opts.entries, opts.reduce).pipe(build())
  }

  return new Promise(function (resolve, reject) {
    reduce.on('error', reject)
    reduce.run(bundleTask).then(resolve, reject)
  })
}

