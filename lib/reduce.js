var EventEmitter = require('events')
var run = require('reduce-js').run
var inherits = require('util').inherits
inherits(Reduce, EventEmitter)

var collectCssDeps = require('./collectCssDeps')
var insertExtraDeps = require('./insertExtraDeps')

function Reduce(opts) {
  if (!(this instanceof Reduce)) {
    return new Reduce(opts)
  }
  this.opts = opts || {}

  var self = this
  this.cssDeps = new Promise(function (resolve) {
    self.once('css-deps', resolve)
  })
}

Reduce.prototype.bundle = function() {
  return Promise.all([this._jsBundle(), this._cssBundle()])
}

Reduce.prototype._jsBundle = function() {
  var opts = this.opts
  var boot = this.emit.bind(this, 'css-deps')
  var reduce = require('reduce-js')

  reduce.once('instance', function (b) {
    b.once('css-deps', boot)
    b.plugin(collectCssDeps, { getStyle: opts.getStyle })
  })

  return this._bundle(reduce, opts.js)
}

Reduce.prototype._cssBundle = function() {
  var self = this
  var opts = this.opts
  var reduce = require('reduce-css')

  reduce.once('instance', function (b) {
    b.plugin(insertExtraDeps, {
      getExtraDeps: function () {
        return self.cssDeps
      },
    })
  })

  return this._bundle(reduce, opts.css)
}

Reduce.prototype._bundle = function(reduce, opts) {
  return new Promise(function (resolve, reject) {
    reduce.on('error', reject)
    run(function () {
      var build = reduce.lazypipe()
      var trs = [].concat(opts.transform).filter(Boolean)
      trs.push(
        opts.dest
          ? [reduce.dest].concat(opts.dest)
          : reduce.dest
      )
      trs.forEach(function (tr) {
        build = build.pipe.apply(build, [].concat(tr))
      })
      return reduce.src(opts.entries, opts.opts).pipe(build())
    })
    .then(resolve, reject)
  })
}

module.exports = Reduce

