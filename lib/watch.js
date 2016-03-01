'use strict'

const mixy = require('mixy')
const EventEmitter = require('events')

const depsDiff = require('./deps-diff')
const collectCssDeps = require('./collectCssDeps')
const insertExtraDeps = require('./insertExtraDeps')
const buildOptions = require('./buildOptions')

class Watch extends EventEmitter {
  constructor(opts) {
    this.opts = opts
  }

  watch(opts) {
    let state = buildOptions(opts || {})
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

  close() {
    if (this.watching) {
      this.watching = false
      this.emit('close')
    }
    return this
  }
}

function watchJs(watcher, state) {
  let reduce = require('reduce-js')
  let wopts = watcher.opts || {}
  let w = reduce.watch(
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
        let diff = depsDiff(cssDeps, state.cssDeps)
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
  let reduce = require('reduce-css')
  let wopts = watcher.opts || {}
  let w = reduce.watch(
    mixy.exclude(['js', 'css'], wopts, wopts.css)
  )

  if (state.cssDeps) {
    w.once('instance', function (b) {
      watcher.on('update-css', function (diff) {
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
    })
  }

  watch(watcher, reduce, w, state.css)
}

function watch(watcher, reduce, w, opts) {
  watcher.once('close', w.close.bind(w))
  w.on('error', watcher.emit.bind(watcher, 'error'))
  w.on('log', watcher.emit.bind(watcher, 'log'))

  let trs = [].concat(opts.postTransform).filter(Boolean)
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

module.exports = Watch

