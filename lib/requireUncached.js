var Module = require('module')

module.exports = function (request) {
  var filename = Module._resolveFilename(request)
  var mod = new Module(filename)
  mod.load(filename)
  return mod.exports
}

