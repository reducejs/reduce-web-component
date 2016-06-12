var path = require('path')
var createOptions = require('./lib/createOptions')

function bundle(opts) {
  var reduce = require('./lib/reduce')
  return reduce(opts)
}

function watch(opts) {
  var Watch = require('./lib/watch')
  return new Watch(opts).start()
}

function normalize(opts) {
  if (typeof opts === 'string') {
    opts = require(path.resolve(opts))
  }
  return createOptions(opts)
}

module.exports = function (opts) {
  opts = normalize(opts)
  if (opts.js && opts.js.watch || opts.css && opts.css.watch) {
    return watch(opts)
  }
  return bundle(opts)
}
module.exports.bundle = function (opts) {
  return bundle(normalize(opts))
}
module.exports.watch = function (opts) {
  return watch(normalize(opts))
}

