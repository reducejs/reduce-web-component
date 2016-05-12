const path = require('path')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  reduce: {
    basedir: path.join(__dirname, 'src'),
    paths: path.join(__dirname, 'src', 'component'),
  },
  dest: path.join(__dirname, 'build'),

  js: {
    entries: 'page/**/index.js',
    bundleOptions: 'bundle.js',
  },

  css: {
    // No need to specify entries,
    // because we have done that implicitly by setting getStyle.
    // entries: 'page/**/index.css',
    bundleOptions: 'bundle.css',
  },

  watch: {
    js: { entryGlob: 'page/**/index.js' },
    css: { entryGlob: 'page/**/index.css' },
  },
}

