var fs = require('fs')
var Options = require('./options')
var path = require('path')

function create(opts) {
  var data = {}
  var filePath = ''
  var basedir = ''
  var extension
  if (!opts.map) {
    return
  }
  extension = opts.map.extension || '.js'
  if (typeof opts.map !== 'string' && typeof opts.map.file !== 'string' && typeof extension !== 'string') {
    return
  }
  filePath = opts.map.file || opts.map

  if (typeof opts.map.basedir !== 'string') {
    basedir = process.cwd()
  } else {
    basedir = opts.map.basedir
  }

  Options.addListener(opts, 'common.map', function (_, inputMap) {
    data[this._type] = inputMap
  })
  Options.addListener(opts, 'reduce.end', function () {
    var output = {}
    Object.keys(data).map(function(type) {
      Object.keys(data[type]).map(function(key) {
        var k = path.join(path.dirname(path.relative(basedir, key)), '/index' + extension)
        output[k] = output[k] || {}
        output[k][type] = data[type][key]
      })
    })
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2))
  })
}

module.exports = {
  create,
}

