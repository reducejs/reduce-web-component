var path = require('path')
var Watch = require('./lib/watch')
var reduce = require('./lib/reduce')
var Options = require('./lib/options')
var inputMap = require('./lib/input-map')

function bundle(opts) {
  if (typeof opts === 'string') {
    opts = require(path.resolve(opts))
  }
  return reduce(Options.create(opts))
}

function watch(opts, id) {
  if (typeof opts === 'string') {
    id = id || opts
    opts = require(path.resolve(opts))
  }
  if (id) {
    inputMap.createServer(id, opts)
  }
  return new Watch(Options.create(opts)).start()
}

module.exports = {
  bundle,
  watch,
  getDeps: inputMap.getDeps,
}

