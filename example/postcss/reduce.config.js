const path = require('path')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  reduce: {
    basedir: path.join(__dirname, 'src'),
  },

  js: {
    entries: 'page/**/index.js',
    bundleOptions: {
      groups: 'page/**/index.js',
      common: 'common.js',
    },
    dest: path.join(__dirname, 'build'),
  },

  css: {
    //entries: 'page/**/index.css',
    bundleOptions: {
      groups: 'page/**/index.css',
      common: 'common.css',
    },
    dest: [path.join(__dirname, 'build'), {
      maxSize: 5,
      name: '[name].[hash]',
      assetOutFolder: path.join(__dirname, 'build', 'assets'),
    }],
  },
}

