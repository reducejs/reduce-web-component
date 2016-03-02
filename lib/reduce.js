'use strict'

const mixy = require('mixy')
const collectCssDeps = require('./collectCssDeps')
const insertExtraDeps = require('./insertExtraDeps')
const buildOptions = require('./buildOptions')
const RESOLVED = Promise.resolve()
const Stream = require('stream')

module.exports = function (opts) {
  opts = opts || {}
  let state = { getStyle: opts.getStyle }
  return Promise.all([
    opts.js === false
      ? RESOLVED
      : bundleJs(state, buildOptions.js(opts.js, opts)),
    opts.css === false
      ? RESOLVED
      : bundleCss(state, buildOptions.css(opts.css, opts)),
  ])
}

function bundleJs(state, opts) {
  let reduce = require('reduce-js')
  let browserify = require('browserify')

  let b = browserify(mixy.mix({
    basedir: process.cwd(),
  }, opts.reduce))

  if (state.getStyle) {
    state.cssDeps = new Promise(function (resolve) {
      b.once('css-deps', resolve)
    })
    b.plugin(collectCssDeps, { getStyle: state.getStyle })
  }

  return bundle(reduce, b, opts)
}

function bundleCss(state, opts) {
  let reduce = require('reduce-css')
  let depsify = require('depsify')

  let b = depsify(mixy.mix({
    basedir: process.cwd(),
  }, opts.reduce))

  if (state.cssDeps) {
    b.plugin(insertExtraDeps, {
      getExtraDeps: function () {
        return state.cssDeps
      },
    })
  }

  return bundle(reduce, b, opts)
}

function bundle(reduce, b, opts) {
  return new Promise(function (resolve, reject) {
    b.on('error', reject)
    mixy.each(opts.on, function (cbs, event) {
      [].concat(cbs).forEach(cb => b.on(event, cb))
    })

    let pipeline = []

    if (opts.entries) {
      pipeline.push(reduce.src(opts.entries, { cwd: b._options.basedir }))
    } else {
      pipeline.push(Stream.Readable({
        read: function () {
          this.push(null)
        },
      }))
    }
    pipeline.push(reduce.bundle(b, opts.bundleOptions))

    if (opts.postTransform) {
      pipeline.push(postTransform())
    }

    if (opts.dest) {
      pipeline.push(reduce.dest.apply(null, [].concat(opts.dest)))
    }

    pipeline.reduce(function (up, down) {
      return up.pipe(down).on('error', err => b.emit('error', err))
    })
    .on('data', file => {})
    .once('end', resolve)
  })
}

