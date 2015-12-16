var EventEmitter = require('events')
var inherits = require('util').inherits
inherits(Watch, EventEmitter)

var depsDiff = require('./deps-diff')
var collectCssDeps = require('./collectCssDeps')
var insertExtraDeps = require('./insertExtraDeps')

module.exports = Watch

function Watch(opts) {
  if (!(this instanceof Watch)) {
    return new Watch(opts)
  }
  this.opts = opts

  var self = this
  this.cssDeps = new Promise(function (resolve) {
    self.once('css-deps', resolve)
  })

  this.watching = false
}

Watch.prototype.watch = function(opts) {
  opts = opts || {}
  if (!this.watching) {
    this.watching = true
    this._watchJs(opts.js, opts)
    this._watchCss(opts.css, opts)
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

Watch.prototype._watchJs = function(opts, extra) {
  var reduce = require('reduce-js')
  var watcher = reduce.watch(this.opts)
  var update = this._updateCssDeps.bind(this)
  watcher.once('instance', function (b) {
    b.on('css-deps', update)
    b.plugin(collectCssDeps, { getStyle: extra.getStyle })
  })

  return this._watch(reduce, watcher, opts)
}

Watch.prototype._watchCss = function(opts) {
  var self = this
  var reduce = require('reduce-css')
  var watcher = reduce.watch(this.opts)
  watcher.once('instance', function (b) {
    self.on('update-css', function (diff) {
      var cache = b._options.cache
      diff.forEach(function (file) {
        delete cache[file]
      })
      b.emit('update')
    })
    b.plugin(insertExtraDeps, {
      getExtraDeps: function () {
        return self.cssDeps
      },
    })
  })

  return this._watch(reduce, watcher, opts)
}

Watch.prototype._watch = function(reduce, watcher, opts) {
  opts = opts || {}
  this.once('close', watcher.close.bind(watcher))
  watcher.on('error', this.emit.bind(this, 'error'))
  watcher.on('log', this.emit.bind(this, 'log'))
  var trs = [].concat(opts.transform).filter(Boolean)
  trs.push(
    opts.dest
      ? [reduce.dest].concat(opts.dest)
      : reduce.dest
  )
  trs.forEach(function (tr) {
    watcher.pipe.apply(watcher, [].concat(tr))
  })
  watcher.src(opts.entries, opts.opts)
}

Watch.prototype._updateCssDeps = function(cssDeps) {
  if (!Array.isArray(this.cssDeps)) {
    this.cssDeps = cssDeps
    return this.emit('css-deps', cssDeps)
  }

  // invalidate reduce-css cache
  var diff = depsDiff(cssDeps, this.cssDeps)
  if (diff) {
    this.cssDeps = cssDeps
    this.emit('update-css', diff)
  }
}

