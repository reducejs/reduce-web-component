var path = require('path')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')
var resolver = require('custom-resolve')
var promisify = require('node-promisify')
var styleResolve = promisify(resolver({
  main: 'style',
  extensions: '.css',
  moduleDirectory: ['web_modules', 'node_modules'],
}))

module.exports = {
  getStyle: function (jsFile) {
    if (jsFile.indexOf(fixtures('page') + '/') === 0) {
      return path.dirname(jsFile) + '/index.css'
    }
    var prefix = fixtures('web_modules') + '/'
    if (jsFile.indexOf(prefix) === 0) {
      return styleResolve(
        jsFile.slice(prefix.length).split('/')[0],
        { filename: jsFile }
      )
    }
  },

  basedir: fixtures(),
  paths: [fixtures('web_modules')],

  on: {
    log: console.log.bind(console),
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
    dest: 'build',
  },
  css: {
    atRuleName: 'external',
    bundleOptions: {
      groups: '**/page/**/index.css',
      common: 'common.css',
    },
    dest: 'build',
  },
}

