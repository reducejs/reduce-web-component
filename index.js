var thr = require('through2')
var merge = require('merge-stream')
var EventEmitter = require('events')
var path = require('path')
var nub = require('nub')
var glob = require('globby')
var promisify = require('node-promisify')
var run = promisify(require('run-callback'))
var mix = require('util-mix')

var resolver = require('./lib/style-resolver')
var same = require('./lib/same')
var bundler = require('./lib/bundler')

var inherits = require('util').inherits
inherits(Reduce, EventEmitter)

module.exports = Reduce

function Reduce(opts) {
  if (!(this instanceof Reduce)) {
    return new Reduce(opts)
  }
  this.opts = opts = opts || {}

  opts.js = opts.js || {}
  var jsReduceOpts = opts.js.reduceOpts = opts.js.reduceOpts  || {}
  var jsExtensions = ['.js', '.jsx'].concat(jsReduceOpts.extensions).filter(Boolean)

  opts.css = opts.css || {}
  var cssReduceOpts = opts.css.reduceOpts = opts.css.reduceOpts  || {}
  var cssExtensions = ['.css'].concat(cssReduceOpts.extensions).filter(Boolean)

  function isJs(file) {
    return jsExtensions.indexOf(path.extname(file)) > -1
  }

  function isCss(file) {
    return cssExtensions.indexOf(path.extname(file)) > -1
  }

  // resolve css files that should be loaded together with the given js file
  if (typeof opts.resolve === 'function') {
    this.resolve = opts.resolve
  } else {
    this.resolve = resolver(mix({ extensions: cssExtensions }, opts.resolve))
  }

  var self = this
  var basedir = path.resolve(opts.basedir || '.')
  jsReduceOpts.basedir = basedir
  cssReduceOpts.basedir = basedir
  this._initialize = glob(opts.entries, { cwd: basedir })
    .then(function (files) {
      var jsEntries = files.filter(isJs).reduce(function (o, f) {
        o[f] = true
        return o
      }, {})
      var cssEntries = files.filter(isCss).reduce(function (o, f) {
        o[f] = true
        return o
      }, {})
      return Promise.all(jsEntries.map(function (file) {
        var dir = path.dirname(file)
        return self.resolve(dir)
          .catch(function () {
            return path.join(dir, 'index.css')
          })
          .then(function (f) {
            cssEntries[f] = true
          })
      }))
      .then(function () {
        opts.js.entries = Object.keys(jsEntries)
        opts.css.entries = Object.keys(cssEntries)
      })
    })
}

Reduce.prototype.bundler = function() {
  var self = this
  return function () {
    self._initialize.then(function () {
      return run(function () {
        return merge(self._cssBundler(), self._jsBundler())
      })
    })
  }
}

Reduce.prototype.watcher = function() {
  var self = this
  return function () {
    self._initialize.then(function () {
      self._jsBundler.watch()
      self._cssBundler.watch()
    })
  }
}

Reduce.prototype._init = function() {
  this._initJs()
  this._initCss()

  this._collectJsDeps()

  var latestJsDeps
  this.on('js-deps', function (deps) {
    // For simplicity, update css whenever there is a change in js deps
    if (latestJsDeps && !same(deps, latestJsDeps)) {
      this.emit('updata-css')
    }
    latestJsDeps = deps
  })
}

Reduce.prototype._initJs = function() {
  var watchOpts = this.opts.watchJs || this.opts.watch
  var opts = this.opts.js || {}
  var self = this
  opts.on = opts.on || {}
  opts.on.instance = [].concat(opts.on.instance, function (b) {
    b.on('reset', self._collectJsDeps.bind(self))
    b.plugin(self._emitDeps.bind(self))
  }).filter(Boolean)
  this._jsBundler = bundler.js(opts, watchOpts)
}

Reduce.prototype._initCss = function() {
  var watchOpts = this.opts.watchCss || this.opts.watch
  var opts = this.opts.css || {}
  var self = this
  opts.on = opts.on || {}
  opts.on.instance = [].concat(opts.on.instance, function (b) {
    // css dependencies changed due to changes in js dependencies
    self.on('update-css', b.emit.bind(b, 'update'))
  }).filter(Boolean)
  var dependenciesFilter = opts.dependenciesFilter
  opts.dependenciesFilter = function (file, deps) {
    return self._getExtraDeps(file)
      .then( function (extra) {
        return [].concat(deps, extra).filter(Boolean)
      } )
      .then( function (dependencies) {
        if (dependenciesFilter) {
          return dependenciesFilter(file, dependencies)
        }
        return dependencies
      } )
  }
  this._cssBundler = bundler.css(opts, watchOpts)
}

Reduce.prototype._collectJsDeps = function() {
  var self = this
  this._jsDeps = new Promise( function (resolve) {
    self.once('js-deps', resolve)
  } )
}

// how css depends upon js
Reduce.prototype._getJsDepsForCss = function(file) {
  var opts = this.opts
  return Promise.resolve()
    .then( function () {
      if (typeof opts.jsDepsForCss === 'function') {
        return opts.jsDepsForCss(file)
      }
      return opts.jsDepsForCss && opts.jsDepsForCss[file] || []
    } )
    .catch( function () {
      return []
    } )
}

Reduce.prototype._getExtraDeps = function(file) {
  var self = this
  var resolveCache = this._jsDeps.resolveCache || {}
  this._jsDeps.resolveCache = resolveCache

  var depsCache = this._jsDeps.depsCache || {}
  this._jsDeps.depsCache = depsCache

  return this._jsDeps.then( function (graph) {
    return self._getJsDepsForCss(file)
      .then( function (deps) {
        return [].concat((deps || []).map( function (dep) {
          return self._getFlattenedDeps(dep, graph, depsCache)
        } ))
      } )
      .then(nub)
      .then( function (deps) {
        return [].concat(deps.map( function (dep) {
          if (!resolveCache[dep]) {
            resolveCache[dep] = Object.keys(graph[dep] || {}).map( function (exp) {
              return self.resolve(exp, {
                basedir: path.dirname(dep),
                filename: dep,
                jsFile: graph[dep][exp],
                cssFile: file,
              }).catch(function () {
                return
              })
            } )
          }
          return resolveCache[dep]
        } ))
      } )
      .then( Promise.all.bind(Promise) )
  } )
}

Reduce.prototype._emitDeps = function(b) {
  var self = this

  b.on('reset', collect)
  collect()

  function collect() {
    var graph = {}
    b.pipeline.get('deps').push(thr.obj(function (row, _, next) {
      graph[row.file] = row.deps || {}
      next(null, row)
    }, function (done) {
      self.emit('js-deps', graph)
      done()
    }))
  }
}

Reduce.prototype._getFlattenedDeps = function(file, graph, cache) {
  var self = this
  if (!cache[file]) {
    cache[file] = [].concat.apply([],
      Object.keys(graph[file] || {}).map(function (dep) {
        return self._getFlattenedDeps(graph[file][dep], graph, cache)
      })
    )
  }
  return cache[file]
}

