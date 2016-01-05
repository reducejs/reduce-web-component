var Reduce = require('./lib/reduce')
var Watch = require('./lib/watch')

module.exports = function (opts) {
  function bundler() {
    return new Reduce(opts).bundle()
  }

  bundler.watch = function (watchOpts) {
    return new Watch(watchOpts).watch(opts)
  }

  return bundler
}
