var Reduce = require('./lib/reduce')
var Watch = require('./lib/watch')

module.exports = function (opts) {
  function bundler() {
    return Reduce(opts).bundle()
  }

  bundler.watch = function (watchOpts) {
    return Watch(watchOpts).watch(opts)
  }

  return bundler
}
