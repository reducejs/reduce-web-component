const path = require('path')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  reduce: {
    basedir: path.join(__dirname, 'src'),
  },
  dest: path.join(__dirname, 'build'),

  map: {
    file: path.join(__dirname, 'map.json'),
    basedir: path.join(__dirname, 'src'),
    filter: '**/page/**/index.+(js|jsx|css)',
  },

  js: {
    entries: 'page/**/index.js',
    bundleOptions: {
      groups: 'page/**/index.js',
      common: 'common.js',
    },
  },

  css: {
    //entries: 'page/**/index.css',
    bundleOptions: {
      groups: 'page/**/index.css',
      common: 'common.css',
    },
  },
}

