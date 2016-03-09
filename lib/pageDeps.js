const multimatch = require('multimatch')
const through = require('./through')
const Options = require('./options')
const reduce = require('./reduce')

module.exports = function (input, opts) {
  return new Promise(function (resolve, reject) {
    var ret = {}
    opts.on = opts.on || {}
    opts.on['common.map'] = [].concat(opts.on['common.map']).filter(Boolean)
    opts.on['common.map'].push(function (_, inputMap) {
      var r = ret[this._type] = []
      var bundles = new Set()
      multimatch(Object.keys(inputMap), input)
        .forEach(function (e) {
          inputMap[e].forEach(x => bundles.add(x))
        })
      bundles.forEach(i => r.push(i))
    })

    opts = Options.create(opts)
    if (opts.js) {
      addEmptify(opts.js)
    }
    if (opts.css) {
      addEmptify(opts.css)
    }

    reduce(opts).then(() => resolve(ret), reject)
  })
}

function addEmptify(opts) {
  opts.plugin = opts.plugin || []
  opts.plugin.unshift(emptify)
}

function emptify() {
  return through(function (file, _, next) {
    file.contents = null
    next(null, file)
  })
}

