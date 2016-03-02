'use strict'

const mixy = require('mixy')
const EventEmitter = require('events')
const reducejs = require('reduce-js')
const browserify = require('browserify')
const reducecss = require('reduce-css')
const depsify = require('depsify')

const depsDiff = require('./deps-diff')
const collectCssDeps = require('./collectCssDeps')
const insertExtraDeps = require('./insertExtraDeps')
const buildOptions = require('./buildOptions')

class Watch extends EventEmitter {
  constructor(opts) {
    super()
    opts = opts || {}
    this.opts = opts
    this.wopts = opts.watch || {}
    if (opts.js !== false) {
      opts.js = buildOptions.js(opts.js, opts)
    }
    if (opts.css !== false) {
      opts.css = buildOptions.css(opts.css, opts)
    }
    this.state = {
      getStyle: opts.getStyle,
      watching: false,
    }
  }

  _browserify(opts) {
    let b = browserify(mixy.mix({
      basedir: process.cwd(),
    }, opts))

    let state = this.state
    if (state.getStyle) {
      state.cssDeps = new Promise(resolve => {
        b.on('css-deps', cssDeps => {
          if (!Array.isArray(state.cssDeps)) {
            state.cssDeps = cssDeps
            resolve(cssDeps)
            return
          }

          // invalidate reduce-css cache
          let diff = depsDiff(cssDeps, state.cssDeps)
          if (diff) {
            state.cssDeps = cssDeps
            this.emit('update-css', diff)
          }
        })
      })
      b.plugin(collectCssDeps, { getStyle: state.getStyle })
    }
    return b
  }

  _depsify(opts) {
    let b = depsify(mixy.mix({
      basedir: process.cwd(),
    }, opts))

    let state = this.state
    if (state.cssDeps) {
      this.on('update-css', function (diff) {
        let cache = b._options.cache
        diff.forEach(function (file) {
          delete cache[file]
        })
        b.emit('update')
      })
      b.plugin(insertExtraDeps, {
        getExtraDeps: function () {
          return state.cssDeps
        },
      })
    }
    return b
  }

  _watch(reduce, b, type) {
    let opts = this.opts[type]
    this.once('close', () => b.close())
    b.on('error', this.emit.bind(this, 'error'))
    b.on('log', this.emit.bind(this, 'log'))

    mixy.each(opts.on, function (cbs, event) {
      [].concat(cbs).forEach(cb => b.on(event, cb))
    })

    let handleError = function (err) {
      b.emit('error', err)
    }

    b.on('bundle-stream', bundleStream => {
      bundleStream.on('error', handleError)
      if (opts.postTransform) {
        bundleStream = bundleStream.pipe(postTransform())
          .on('error', handleError)
      }
      if (opts.dest) {
        bundleStream = bundleStream.pipe(reduce.dest.apply(null, [].concat(opts.dest)))
          .on('error', handleError)
      }
      bundleStream
        .on('data', file => {})
        .once('end', () => this.emit('done', type))
    })

    let watchStream = reduce.watch(
      b, opts.bundleOptions, this.wopts[type]
    )
    if (opts.entries) {
      reduce.src(opts.entries, { cwd: b._options.basedir })
        .pipe(watchStream)
    } else {
      watchStream.end()
    }
  }

  start() {
    if (this.state.watching) return
    if (this.opts.js !== false) {
      this._watch(
        reducejs,
        this._browserify(this.opts.js.reduce),
        'js'
      )
    }
    if (this.opts.css !== false) {
      this._watch(
        reducecss,
        this._depsify(this.opts.css.reduce),
        'css'
      )
    }
    return this
  }

  close() {
    if (this.state.watching) {
      this.state.watching = false
      this.emit('close')
    }
    return this
  }

}

module.exports = Watch

