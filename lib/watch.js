'use strict'

var EventEmitter = require('events')
var delog = require('./delog')
var collectCssDeps = require('./collectCssDeps')
var combine = require('stream-combiner2')
var resolver = require('resolve')
var cssDepsPatcher = require('deps-patch')
var depsDiff = require('./deps-diff')

class Watch extends EventEmitter {
  constructor(opts) {
    super()
    opts = opts || {}

    this.opts = opts
    var wopts = opts.watch || {}
    this.state = {
      getStyle: opts.getStyle,
    }
    if (opts.js) {
      this._jsBundler = createBundler(opts.js, 'js', wopts.js || {})
    }
    if (opts.css) {
      this._cssBundler = createBundler(opts.css, 'css', wopts.css || {})
    }
    if (this._jsBundler && this._cssBundler && opts.getStyle) {
      applyDepsPatch(this._jsBundler, this._cssBundler, opts.getStyle)
    }

    this._watching = false
    this._pending = 0
  }

  _watch(b, opts) {
    this.once('close', () => b.close())

    Object.keys(opts.on || {}).forEach(function (event) {
      [].concat(opts.on[event]).forEach(cb => b.on(event, cb))
    })

    var done = (err) => {
      if (--this._pending === 0) {
        this.emit('done', err)
      }
    }

    b.on('error', done)

    var _bundle = () => {
      ++this._pending
      bundle(b, opts, done)
    }
    b.on('update', _bundle)
    _bundle()
  }

  start() {
    if (this._watching) return
    this._watching = true
    if (this._jsBundler) {
      this._watch(this._jsBundler, this.opts.js)
    }
    if (this._cssBundler) {
      this._watch(this._cssBundler, this.opts.css)
    }
    return this
  }

  close() {
    if (this._watching) {
      this._watching = false
      this.emit('close')
    }
    return this
  }

}

function createBundler(opts, type, wopts) {
  var reduce
  if (type === 'css') {
    reduce = require('reduce-css')
  } else {
    reduce = require('reduce-js')
  }
  var bundlerOptions = Object.assign({
    basedir: process.cwd(),
  }, opts.reduce)

  var args = [bundlerOptions, opts.bundleOptions, wopts]
  if (opts.entries) {
    args.unshift(opts.entries)
  }
  var b = reduce.create.apply(reduce, args)
  b.plugin(delog)
  b._type = type
  return b
}

function applyDepsPatch(jsBundler, cssBundler, getStyle) {
  var shouldRebundleCssToApplyPatch = false
  cssBundler.on('reset', function () {
    shouldRebundleCssToApplyPatch = false
  })

  jsBundler.plugin(collectCssDeps, { getStyle })

  var cssDeps = new Promise(function (resolve) {
    jsBundler.once('css-deps', resolve)
  })
  jsBundler.on('css-deps', function (deps) {
    if (!Array.isArray(cssDeps)) {
      // cssBundler is waiting for the first time
      // so, do not bother to rebundle
      cssDeps = deps
      return
    }
    var diff = depsDiff(deps, cssDeps)
    cssDeps = deps
    if (diff && shouldRebundleCssToApplyPatch) {
      cssBundler.emit('update')
    }
  })

  cssBundler.plugin(cssDepsPatcher, function () {
    // now 'cssDeps' may be stale
    // rebundle it if new deps detected
    shouldRebundleCssToApplyPatch = true
    return cssDeps
  })
}

function bundle(b, opts, done) {
  var pipeline = [].concat(opts.plugin || []).map(function (args) {
    args = [].concat(args)
    if (args[0] === 'dest') {
      args[0] = b.dest
    } else if (typeof args[0] === 'string') {
      args[0] = require(resolver.sync(args[0], { basedir: b._options.basedir }))
    }
    return args[0].apply(b, args.slice(1))
  })

  var handleError = function (err) {
    b.emit('error', err)
  }
  b.bundle().on('error', handleError)
    .pipe(combine.obj(pipeline))
    .on('error', handleError)
    .on('data', () => {})
    .once('end', done)
}

module.exports = Watch

