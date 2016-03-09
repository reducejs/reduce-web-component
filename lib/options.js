'use strict'

const reducejs = require('reduce-js')
const reducecss = require('reduce-css')

function plugin(opts, p, args) {
  opts.plugin = [].concat(opts.plugin).filter(Boolean)
  if (typeof p === 'string') {
    p = require(p)
  }
  p = [p]
  if (arguments.length >= 3) {
    p.push.apply(p, [].concat(args))
  }
  opts.plugin.push(p)
  return opts
}

function merge(opts, extra) {
  opts = opts || {}
  extra = extra || {}

  opts.reduce = Object.assign(
    { cache: {}, packageCache: {} },
    extra.reduce, opts.reduce, {
      paths: [].concat(
        opts.reduce && opts.reduce.paths,
        extra.reduce && extra.reduce.paths
      ).filter(Boolean),
    }
  )

  opts.on = opts.on || {}

  Object.keys(extra.on || {}).forEach(function (k) {
    opts.on[k] = [].concat(opts.on[k], extra.on[k]).filter(Boolean)
  })

  if (!opts.dest && extra.dest) {
    opts.dest = extra.dest
  }

  return opts
}

function dest(opts, reduce) {
  if (Array.isArray(opts.plugin)) {
    opts.plugin.forEach(function (p) {
      if (p[0] === 'dest') {
        p[0] = reduce.dest
      }
    })
  }
  if (opts.dest) {
    plugin(opts, reduce.dest, opts.dest)
  }
  return opts
}

function css(opts, extra) {
  opts = merge(opts, extra)

  plugin(opts, './timer')

  var reduceOpts = opts.reduce
  if (typeof reduceOpts.resolve !== 'function') {
    reduceOpts.resolve = Object.assign(
      {}, reduceOpts.resolve, {
        paths: [].concat(
          reduceOpts.resolve && reduceOpts.resolve.paths,
          reduceOpts.paths
        ).filter(Boolean),
      }
    )
  }

  dest(opts, reducecss)

  /**
   * opts.entries: `String`, `Array` patterns
   * opts.reduce: `Object` options for depsify
   * opts.dest: options passed to `reduce.dest`
   * opts.bundleOptions: options passed to `reduce.bundle`
   * opts.plugin: gulp plugins applied to `reduce.bundle()`
   * opts.on: event listeners to be attached to `b`
   *
   */
  return opts
}

function js(opts, extra) {
  /**
   * opts.entries: patterns for locating entries
   * opts.reduce: options for browserify
   * opts.dest: options passed to `reduce.dest`
   * opts.bundleOptions: options passed to `reduce.bundle`
   * opts.plugin: gulp plugins applied to `reduce.bundle()`
   * opts.on: event listeners to be attached to `b`
   *
   */
  opts = merge(opts, extra)

  plugin(opts, './timer')

  dest(opts, reducejs)

  return opts
}

function create(opts) {
  opts = opts || {}

  if (opts.js !== false) {
    opts.js = js(opts.js, opts)
  }
  if (opts.css !== false) {
    opts.css = css(opts.css, opts)
  }

  return opts
}

module.exports = {
  create,
  css,
  js,

  plugin,
  merge,
  dest,
}

