const path = require('path')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  map: ['reduce.map.json', 'page/**/index.+(jsx|css)'],
  dest: path.join(__dirname, 'build'),
  reduce: {
    basedir: path.join(__dirname, 'src'),
    paths: path.join(__dirname, 'src', 'component'),
  },

  js: {
    reduce: {
      transform: [
        ['babelify', { presets: ["es2015", "react"] }],
      ],
      extensions: '.jsx',
    },
    entries: 'page/**/index.jsx',
    bundleOptions: 'bundle.js',
  },

  css: {
    // No need to specify entries,
    // because we have done that implicitly by setting getStyle.
    //entries: 'page/**/index.css',
    bundleOptions: 'bundle.css',
  },

  watch: {
    js: { entryGlob: 'page/**/index.jsx' },
    css: { entryGlob: 'page/**/index.css' },
  },
}

