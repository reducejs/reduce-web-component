var fs = require('fs')
var Options = require('./options')

function create(opts) {
  var data = {}
  if (!opts.map) {
    return
  }
  Options.addListener(opts, 'common.map', function (_, inputMap) {
    data[this._type] = inputMap
  })
  Options.addListener(opts, 'reduce.end', function () {
    var output = {}
    Object.keys(data).map(function(type) {
      Object.keys(data[type]).map(function(key) {
        output[key] = data[type][key]
      })
    })
    fs.writeFileSync(opts.map, JSON.stringify(output, null, 2))
  })
}

module.exports = {
  create,
}

