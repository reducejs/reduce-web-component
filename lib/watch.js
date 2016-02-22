var mixy = require('mixy')
var util = require('util')
util.inherits(Watch, require('events'))

var depsDiff = require('./deps-diff')
var collectCssDeps = require('./collectCssDeps')
var insertExtraDeps = require('./insertExtraDeps')
var buildOptions = require('./buildOptions')

module.exports = Watch

function Watch(watchOpts) {
  this.opts = watchOpts
}

Watch.prototype.watch = function(opts) {
  var state = buildOptions(opts || {})
  state.watching = false
  if (!state.watching) {
    state.watching = true
    if (state.js !== false) {
      watchJs(this, state)
    }
    if (state.css !== false) {
      watchCss(this, state)
    }
  }
  return this
}

Watch.prototype.close = function() {
  if (this.watching) {
    this.watching = false
    this.emit('close')
  }
  return this
}

function watchJs(watcher, state) {
  var reduce = require('reduce-js')
  var wopts = watcher.opts || {}
  var w = reduce.watch(
    mixy.exclude(['js', 'css'], wopts, wopts.js)
  )

  if (state.getStyle) {
    state.cssDeps = new Promise(function (resolve) {
      state.resolve = resolve
    })
    w.once('instance', function (b) {
      b.on('css-deps', function (cssDeps) {
        if (!Array.isArray(state.cssDeps)) {
          state.cssDeps = cssDeps
          state.resolve(cssDeps)
          return
        }

        // invalidate reduce-css cache
        var diff = depsDiff(cssDeps, state.cssDeps)
        if (diff) {
          state.cssDeps = cssDeps
          watcher.emit('update-css', diff)
        }
      })
      b.plugin(collectCssDeps, { getStyle: state.getStyle })
    })
  }

  watch(watcher, reduce, w, state.js)
}

function watchCss(watcher, state) {
  var reduce = require('reduce-css')
  var wopts = watcher.opts || {}
  var w = reduce.watch(
    mixy.exclude(['js', 'css'], wopts, wopts.css)
  )

  if (state.cssDeps) {
    w.once('instance', function (b) {
      watcher.on('update-css', function (diff) {
        var cache = b._options.cache
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
    })
  }

  watch(watcher, reduce, w, state.css)
}

function watch(watcher, reduce, w, opts) {
  watcher.once('close', w.close.bind(w))
  w.on('error', watcher.emit.bind(watcher, 'error'))
  w.on('log', watcher.emit.bind(watcher, 'log'))

  var trs = [].concat(opts.postTransform).filter(Boolean)
  trs.push(
    opts.dest
      ? [reduce.dest].concat(opts.dest)
      : reduce.dest
  )
  trs.forEach(function (tr) {
    w.pipe.apply(w, [].concat(tr))
  })

  mixy.each(opts.on, function (cbs, event) {
    [].concat(cbs).forEach(function (cb) {
      w.on(event, cb)
    })
  })

  w.src(opts.entries, opts.reduce)
}

