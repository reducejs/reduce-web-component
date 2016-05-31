const path = require('path')
const Clean = require('clean-remains')
const csi = require('ansi-escape')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  reduce: {
    basedir: path.join(__dirname, 'src'),
  },

  on: {
    log: console.log.bind(console),
    error: function (err) {
      console.error(err.stack)
    },
    'common.map': function (o) {
      console.log(
        csi.green.escape('[%s bundles] %s'),
        this._type.toUpperCase(),
        Object.keys(o.bundles).join(', ')
      )
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
    plugin: [
      //'vinyl-buffer',
      'gulp-uglify',
      ['dest', path.join(__dirname, 'build')],
      Clean([]),
    ],
  },

  css: {
    //entries: 'page/**/index.css',
    bundleOptions: {
      groups: 'page/**/index.css',
      common: 'common.css',
    },
    plugin: [
      //'vinyl-buffer',
      //'gulp-uglifycss',
      ['dest', path.join(__dirname, 'build')],
      Clean([]),
    ],
  },

  watch: {
    js: { entryGlob: 'page/**/index.js' },
    css: { entryGlob: 'page/**/index.css' },
  },
}

