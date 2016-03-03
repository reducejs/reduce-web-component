'use strict'

const path = require('path')
const fixtures = path.resolve.bind(path, __dirname, 'src')
const resolver = require('custom-resolve')
const promisify = require('node-promisify')
const Clean = require('clean-remains')
const styleResolve = promisify(resolver({
  main: 'style',
  extensions: '.css',
  moduleDirectory: ['web_modules', 'node_modules'],
}))

module.exports = {
  getStyle: function (jsFile) {
    if (jsFile.indexOf(fixtures('page') + '/') === 0) {
      return path.dirname(jsFile) + '/index.css'
    }
    let prefix = fixtures('web_modules') + '/'
    if (jsFile.indexOf(prefix) === 0) {
      return styleResolve(
        jsFile.slice(prefix.length).split('/')[0],
        { filename: jsFile }
      )
    }

    prefix = fixtures('node_modules') + '/'
    if (jsFile.indexOf(prefix) === 0) {
      return styleResolve(
        jsFile.slice(prefix.length).split('/')[0],
        { filename: jsFile }
      )
    }
  },

  reduce: {
    basedir: fixtures(),
    paths: [fixtures('web_modules')],
  },

  on: {
    log: console.log.bind(console),
    error: function (err) {
      console.log(err.stack)
    },
    'common.map': function (map) {
      console.log('[%s bundles] %s', this._type.toUpperCase(), Object.keys(map).join(', '))
    },
    'reduce.end': function (bytes, duration) {
      console.log(
        '[%s done] %d bytes written (%d seconds)',
        this._type.toUpperCase(), bytes, (duration / 1000).toFixed(2)
      )
    },
  },

  js: {
    entries: 'page/**/index.js',
    bundleOptions: {
      groups: 'page/**/index.js',
      common: 'common.js',
    },
    reduce: {
      plugin: 'dedupify',
    },
    postTransform: [
      ['dest', 'build'],
      [Clean([])],
    ],
  },

  css: {
    entries: 'page/**/index.css',
    reduce: {
      atRuleName: 'external',
      resolve: styleResolve,
    },
    bundleOptions: {
      groups: 'page/**/index.css',
      common: 'common.css',
    },
    postTransform: [
      ['dest', 'build'],
      [Clean([])],
    ],
  },

  watch: {
    js: { entryGlob: 'page/**/index.js' },
    css: { entryGlob: 'page/**/index.css' },
  },
}

