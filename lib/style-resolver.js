var mix = require('util-mix')
var promisify = require('node-promisify')
var resolver = require('custom-resolve')
var path = require('path')

module.exports = function (opts) {
  opts = opts || {}
  var extensions = ['.css'].concat(opts.extensions).filter(Boolean)
  var moduleDirectory = opts.moduleDirectory || 'web_components'
  var resolve = promisify(
    resolver(mix({
      packageEntry: 'style',
      symlinks: true,
    }, opts, {
      extensions: extensions,
      moduleDirectory: moduleDirectory,
    }))
  )

  return function () {
    return resolve.apply(this, arguments).then(function (file) {
      return extensions.indexOf(path.extname(file)) === -1 ? '' : file
    })
  }
}

