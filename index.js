'use strict'

const Reduce = require('./lib/reduce')
const Watch = require('./lib/watch')

module.exports = function (opts) {
  function bundler() {
    return new Reduce(opts).bundle()
  }

  bundler.watch = function (watchOpts) {
    return new Watch(watchOpts || opts && opts.watch).watch(opts)
  }

  return bundler
}
