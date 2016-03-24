var fs = require('fs')
var Options = require('./options')
var path = require('path')

function create(opts) {
  var data = {}
  var filePath = ''
  var basedir = ''
  if (!opts.map) {
    return
  }
  if (typeof opts.map === 'string') {
    filePath = opts.map
    basedir = process.cwd()
  } else if (typeof opts.map === 'object' &&
          typeof opts.map.file === 'string' &&
          typeof opts.map.basedir === 'string'
    ) {
    filePath = opts.map.file
    basedir = opts.map.basedir
  } else {
    return
  }
  Options.addListener(opts, 'common.map', function (_, inputMap) {
    data[this._type] = inputMap
  })
  Options.addListener(opts, 'reduce.end', function () {
    var output = {}
    Object.keys(data).map(function(type) {
      Object.keys(data[type]).map(function(key) {
        output[path.relative(basedir, key)] = data[type][key]
      })
    })
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2))
  })
}

module.exports = {
  create,
}

