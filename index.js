'use strict'

const reduce = require('./lib/reduce')
const Watch = require('./lib/watch')

module.exports = function (opts) {
  function bundler() {
    return reduce(opts)
  }

  bundler.watch = function () {
    return new Watch(opts).start()
  }

  return bundler
}
