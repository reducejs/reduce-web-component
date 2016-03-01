'use strict'

const mixy = require('mixy')
const collectCssDeps = require('./collectCssDeps')
const insertExtraDeps = require('./insertExtraDeps')
const buildOptions = require('./buildOptions')
const RESOLVED = Promise.resolve()

class Reduce {
  constructor(opts) {
    this._state = buildOptions(opts || {})
  }

  bundle() {
    let state = this._state
    return Promise.all([
      state.js === false ? RESOLVED : bundleJs(state),
      state.css === false ? RESOLVED : bundleCss(state),
    ])
  }

}

function bundleJs(state) {
  let reduce = require('reduce-js')

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
  let reduce = require('reduce-css')

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
  let bundleTask = function () {
    let build = reduce.lazypipe()
    let trs = [].concat(opts.postTransform).filter(Boolean)
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

module.exports = Reduce
