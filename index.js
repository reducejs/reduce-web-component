'use strict'

const reduce = require('./lib/reduce')
const Watch = require('./lib/watch')
const Options = require('./lib/options')

exports = module.exports = function (opts) {
  opts = Options.create(opts)

  function bundler() {
    return reduce(opts)
  }

  bundler.watch = function () {
    return new Watch(opts).start()
  }

  return bundler
}
exports.deps = require('./lib/pageDeps')

