'use strict'

const path = require('path')
const SRC = path.join(__dirname, 'src')
const BUILD = path.join(__dirname, 'build')
const COMPONENT = path.join(SRC, 'component')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  map: ['reduce.map.json', 'page/**/index.+(jsx|css)'],

  js: {
    reduce: {
      basedir: SRC,
      paths: COMPONENT,
      transform: [
        ['babelify', {presets: ["es2015", "react"]}],
      ],
      extensions: '.jsx',
    },
    entries: 'page/**/index.jsx',
    bundleOptions: 'bundle.js',
    on: {
      log: console.log.bind(console),
      error: function (err) {
        console.error(err.stack)
      },
      'reduce.end': function (bytes, duration) {
        console.log(
          '[JS done] %d bytes written (%d seconds)',
          bytes, (duration / 1000).toFixed(2)
        )
      },
    },
    dest: BUILD,
  },

  css: {
    reduce: {
      basedir: SRC,
      paths: COMPONENT,
    },
    // No need to specify entries,
    // because we have done that implicitly by setting getStyle.
    //entries: 'page/**/index.css',
    bundleOptions: 'bundle.css',
    on: {
      log: console.log.bind(console),
      error: function (err) {
        console.error(err.stack)
      },
      'reduce.end': function (bytes, duration) {
        console.log(
          '[CSS done] %d bytes written (%d seconds)',
          bytes, (duration / 1000).toFixed(2)
        )
      },
    },
    dest: BUILD,
  },

  watch: {
    js: { entryGlob: 'page/**/index.jsx' },
    css: { entryGlob: 'page/**/index.css' },
  },
}

