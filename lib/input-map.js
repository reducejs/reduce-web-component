var fs = require('fs')
var Options = require('./options')
var path = require('path')
var multimatch = require('multimatch')

function create(opts) {
  var mapOpts = opts && opts.map || {}
  if (typeof mapOpts === 'string') {
    mapOpts = { file: mapOpts }
  }

  if (!mapOpts.file) {
    return
  }

  var data = {}
  var basedir = mapOpts.basedir || process.cwd()

  Options.addListener(opts, 'common.map', function (_, inputMap) {
    data[this._type] = inputMap
  })
  Options.addListener(opts, 'reduce.end', function () {
    var output = {}
    Object.keys(data).forEach(function(type) {
      var inputs = Object.keys(data[type])
      if (mapOpts.filter) {
        inputs = multimatch(inputs, mapOpts.filter)
      }
      inputs.forEach(function(page) {
        var k = path.dirname(path.relative(basedir, page))
        output[k] = output[k] || {}
        output[k][type] = data[type][page]
      })
    })
    fs.writeFileSync(mapOpts.file, JSON.stringify(output, null, 2))
  })
}

module.exports = {
  create,
}

