'use strict'

const timer = require('./timer')

class Option {
  constructor() {
    this._listeners = Object.create(null)
    this._bundlerOpts = { cache: {}, packageCache: {} }
    this._plugins = []
  }

  get reduce() {
    return this._bundlerOpts
  }
  set reduce(o) {
    if (!o) {
      return
    }
    const opts = this._bundlerOpts
    Object.assign(opts, o, {
      paths: [].concat(opts.paths, o.paths).filter(isString),
    })
  }

  get on() {
    return this._listeners
  }
  set on(o) {
    if (!o) {
      return
    }
    const listeners = this._listeners
    Object.keys(o).forEach(function (k) {
      listeners[k] = [].concat(listeners[k], o[k]).filter(isFunction)
    })
  }

  get plugin() {
    return this._plugins
  }
  set plugin(o) {
    if (!o) {
      return
    }
    this._plugins = this._plugins.concat(o)
  }

  static assign(option) {
    if (!(option instanceof Option)) {
      option = Option.from(option)
    }
    return Array.from(arguments).slice(1).reduce(optionAssign, option)
  }

  static from(opts) {
    return Option.assign(new Option(), opts)
  }
}

function create(opts, type) {
  let o = opts[type] || {}
  let envOpts = opts.env || {}
  let env = process.env.NODE_ENV || 'development'

  let options = merge({ plugin: timer }, o)
  options = merge(options, opts)

  if (envOpts[env]) {
    options = merge(options, envOpts[env][type])
    options = merge(options, envOpts[env])
  }

  if (options.dest) {
    options.plugin = [['dest'].concat(options.dest)]
  }

  /**
   * options.entries: `String`, `Array` patterns
   * options.reduce: `Object` options for browserify or depsify
   * options.dest: options passed to `b.dest`
   * options.bundleOptions: options passed to `common-bundle`
   * options.plugin: gulp plugins applied to `b.bundle()`
   * options.on: event listeners to be attached to `b`
   * options.watch: options passed to watchify
   *
   */
  return options
}

function merge(opts, extra) {
  extra = extra || {}
  let res = Option.assign(opts, extra)
  res.dest = extra.dest || opts.dest
  res.entries = extra.entries || opts.entries
  res.bundleOptions = extra.bundleOptions || opts.bundleOptions
  res.watch = extra.watch || opts.watch
  return res
}

function optionAssign(left, right) {
  if (right) {
    // options for browserify or depsify
    left.reduce = right.reduce

    // post-transforms for b.bundle()
    // better be renamed to transform?
    left.plugin = right.plugin

    // add event listeners
    left.on = right.on
  }
  return left
}

function isFunction(o) {
  return typeof o === 'function'
}

function isString(s) {
  return typeof s === 'string'
}

function createMap(option, mapOpts) {
  mapOpts = mapOpts || {}
  if (typeof mapOpts === 'string') {
    mapOpts = { file: mapOpts }
  }

  if (!mapOpts.file) {
    return
  }

  const data = {}
  const fs = require('fs')
  const path = require('path')
  const multimatch = require('multimatch')

  let listeners = {
    'common.map': function (o) {
      data[this._type] = o.entries.reduce(function (m, id) {
        let mod = o.modules[id]
        m[mod.file] = mod.bundles[0]
        return m
      }, {})
    },
    'reduce.end': function () {
      let output = {}
      Object.keys(data).forEach(function(type) {
        let inputs = Object.keys(data[type])
        if (mapOpts.filter) {
          inputs = multimatch(inputs, mapOpts.filter)
        }
        inputs.forEach(function(page) {
          let k = path.dirname(page)
          output[k] = output[k] || {}
          output[k][type] = data[type][page]
        })
      })
      fs.writeFileSync(mapOpts.file, JSON.stringify(output, null, 2))
    },
  }
  if (option.js) {
    option.js.on = listeners
  }
  if (option.css) {
    option.css.on = listeners
  }
}

module.exports = function (opts) {
  opts = opts || {}
  let res = {}

  if (opts.js !== false) {
    res.js = create(opts, 'js')
  }
  if (opts.css !== false) {
    res.css = create(opts, 'css')
    let reduceOpts = res.css.reduce
    if (typeof reduceOpts.resolve !== 'function' && reduceOpts.paths) {
      reduceOpts.resolve = Object.assign(
        {}, reduceOpts.resolve, {
          paths: [].concat(
            reduceOpts.resolve && reduceOpts.resolve.paths,
            reduceOpts.paths
          ).filter(Boolean),
        }
      )
    }
  }

  res.getStyle = opts.getStyle

  createMap(res, opts.map)

  return res
}

