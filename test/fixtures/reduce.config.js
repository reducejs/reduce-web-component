var path = require('path')
var fixtures = path.resolve.bind(path, __dirname)
var resolver = require('custom-resolve')
var promisify = require('node-promisify')
var styleResolve = promisify(resolver({
  main: 'style',
  extensions: '.css',
  moduleDirectory: ['web_modules', 'node_modules'],
}))

module.exports = {
  getStyle: function (jsFile) {
    if (jsFile.indexOf(fixtures('src', 'page') + '/') === 0) {
      return path.dirname(jsFile) + '/index.css'
    }

    var prefix = fixtures('src', 'web_modules') + '/'
    if (jsFile.indexOf(prefix) === 0) {
      return styleResolve(
        jsFile.slice(prefix.length).split('/')[0],
        { filename: jsFile }
      )
    }
  },

  basedir: fixtures('src'),
  paths: [fixtures('src', 'web_modules')],

  on: {
    error: function (err) {
      console.log(err.stack)
    },
  },

  js: {
    entries: 'page/**/*.js',
    bundleOptions: {
      groups: '**/page/**/index.js',
      common: 'common.js',
    },
    dest: fixtures('build'),
  },

  css: {
    atRuleName: 'external',
    bundleOptions: {
      groups: '**/page/**/index.css',
      common: 'common.css',
    },
    resolve: styleResolve,
    dest: fixtures('build'),
  },
}

