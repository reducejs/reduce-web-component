'use strict'

const path = require('path')
const fixtures = path.resolve.bind(path, __dirname)
const resolver = require('custom-resolve')
const promisify = require('node-promisify')
const styleResolve = promisify(resolver({
  main: 'style',
  extensions: '.css',
  moduleDirectory: ['web_modules', 'node_modules'],
}))
const Transform = require('stream').Transform

module.exports = {
  getStyle: function (jsFile) {
    if (jsFile.indexOf(fixtures('src', 'page') + '/') === 0) {
      return path.dirname(jsFile) + '/index.css'
    }

    let prefix = fixtures('src', 'web_modules') + '/'
    if (jsFile.indexOf(prefix) === 0) {
      return styleResolve(
        jsFile.slice(prefix.length).split('/')[0],
        { filename: jsFile }
      )
    }
  },

  reduce: {
    basedir: fixtures('src'),
    paths: [fixtures('src', 'web_modules')],
  },

  on: {
    error: function (err) {
      console.log(err.stack)
    },
  },

  js: {
    entries: 'page/**/*.js',
    bundleOptions: {
      groups: 'page/**/index.js',
      common: 'common.js',
    },
    dest: fixtures('build'),
  },

  css: {
    bundleOptions: {
      groups: 'page/**/index.css',
      common: 'common.css',
    },
    reduce: {
      atRuleName: 'external',
      resolve: styleResolve,
    },
    dest: fixtures('build'),
  },
}

