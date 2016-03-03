'use strict'

const mixy = require('mixy')
const collectCssDeps = require('./collectCssDeps')
const insertExtraDeps = require('./insertExtraDeps')
const buildOptions = require('./buildOptions')
const util = require('./util')

module.exports = function (opts) {
  opts = opts || {}
  let state = { getStyle: opts.getStyle }
  let ret = []
  if (opts.js !== false) {
    ret.push(bundleJs(state, buildOptions.js(opts.js, opts)))
  }
  if (opts.css !== false) {
    ret.push(bundleCss(state, buildOptions.css(opts.css, opts)))
  }
  return Promise.all(ret)
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

  b._type = 'js'
  return bundle(reduce, b, opts, 'js')
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
  b._type = 'css'
  return bundle(reduce, b, opts, 'css')
}

function bundle(reduce, b, opts) {
  return new Promise(function (resolve, reject) {
    b.on('error', reject)
    mixy.each(opts.on, function (cbs, event) {
      [].concat(cbs).forEach(cb => b.on(event, cb))
    })

    let pipeline = []
    pipeline.push(reduce.bundle(b, opts.bundleOptions))
    pipeline = pipeline.concat(util.createPipeline(opts.postTransform, b._type))
    if (opts.dest) {
      pipeline.push(reduce.dest.apply(null, [].concat(opts.dest)))
    }
    pipeline.push(util.timer(b))
    pipeline = util.combine(pipeline)
      .on('error', err => b.emit('error', err))
      .on('data', () => {})
      .once('end', resolve)
    b.plugin(require('./delog'))
    if (opts.entries) {
      reduce.src(opts.entries, { cwd: b._options.basedir })
        .pipe(pipeline)
    } else {
      pipeline.end()
    }
  })
}

