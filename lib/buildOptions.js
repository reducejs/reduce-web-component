'use strict'

const fs = require('fs')
const reducejs = require('reduce-js')
const reducecss = require('reduce-css')
const multimatch = require('multimatch')

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

  if (extra.map) {
    let map = extra.map
    if (!Array.isArray(map)) {
      map = [map]
    }

    let write = getWriteFn(map[0])
    if (write) {
      opts.on['common.map'] = [].concat(opts.on['common.map']).filter(Boolean)
      opts.on['common.map'].push(createListener(write, map[1]))
    }
  }

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

function getWriteFn(target) {
  if (target && typeof target === 'object') {
    return writeObj.bind(null, target)
  }
  if (typeof target === 'string') {
    return writeFile.bind(null, target)
  }
}

function createListener(write, filter) {
  return function (bundleMap, inputMap) {
    if (filter) {
      let map = inputMap
      inputMap = Object.create(null)
      multimatch(Object.keys(map), filter)
        .forEach(k => { inputMap[k] = map[k] })
    }
    return write(inputMap, this._type)
  }
}

function writeObj(o, m, type) {
  delete o[type]
  o[type] = Object.create(null)
  Object.keys(m).forEach(k => {
    o[type][k] = m[k]
  })
  return o
}

function writeFile(file, m, type) {
  var o
  try {
    o = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    o = Object.create(null)
  }
  writeObj(o, m, type)
  var sorted = Object.create(null)
  if (o.css) {
    sorted.css = sortKeys(o.css)
  }
  if (o.js) {
    sorted.js = sortKeys(o.js)
  }

  fs.writeFileSync(file, JSON.stringify(sorted, null, 2))
}

function sortKeys(o) {
  return Object.keys(o).sort()
    .reduce(function (ret, k) {
      ret[k] = o[k]
      return ret
    }, Object.create(null))
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

module.exports = {
  css,
  js,

  createListener,
  writeFile,
  writeObj,
  plugin,
  merge,
  dest,
}

