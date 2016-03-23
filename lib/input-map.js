var fs = require('fs')
var Options = require('./options')

function create(opts) {
  var data = {}
  Options.addListener(opts, 'common.map', function (_, inputMap) {
    data[this._type] = inputMap
  })
  Options.addListener(opts, 'reduce.end', function () {
    var output = {}
    if (!opts.map) {
      return
    }
    Object.keys(data).filter(Boolean).map(function(type) {
      Object.keys(data[type]).filter(Boolean).map(function(key) {
        output[key] = data[type][key]
      })
    })
    fs.writeFileSync(opts.map, JSON.stringify(output))
  })
}

module.exports = {
  create,
}

