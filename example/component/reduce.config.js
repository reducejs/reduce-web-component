'use strict'

const path = require('path')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  reduce: {
    basedir: path.resolve(__dirname, 'src'),
  },

  on: {
    log: console.log.bind(console),
    error: function (err) {
      console.error(err.stack)
    },
    'reduce.end': function (bytes, duration) {
      console.log(
        '[%s done] %d bytes written (%d seconds)',
        this._type, bytes, (duration / 1000).toFixed(2)
      )
    },
  },

  js: {
    entries: 'page/**/index.js',
    bundleOptions: 'bundle.js',
    dest: 'build',
  },

  css: {
    // No need to specify entries,
    // because we have done that implicitly by setting getStyle.
    // entries: 'page/**/index.css',
    bundleOptions: 'bundle.css',
    dest: 'build',
  },

  watch: {
    js: { entryGlob: 'page/**/index.js' },
    css: { entryGlob: 'page/**/index.css' },
  },
}

