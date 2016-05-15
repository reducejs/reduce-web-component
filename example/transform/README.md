# Transform
解析依赖时，读取文件内容后，会先经过一些Transform进行变换，然后才进行语法解析。所以可以通过Transform进行预处理，如[babelify]。

## 实例
下面是一个使用Transform的例子。

```js
const path = require('path')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  dest: path.join(__dirname, 'build'),

  reduce: {
    basedir: path.join(__dirname, 'src'),
    paths: path.join(__dirname, 'src', 'component'),
  },

  js: {
    reduce: {
      // 供JS用的Transform
      transform: [
        ['babelify', { presets: ["es2015", "react"] }],
      ],
      extensions: '.jsx',
    },
    entries: 'page/**/index.jsx',
    bundleOptions: 'bundle.js',
  },

  css: {
    // CSS默认由reduce-css-postcss提供的Transform进行处理
    // 即基于PostCSS的预处理
    bundleOptions: 'bundle.css',
  },

  watch: {
    js: { entryGlob: 'page/**/index.jsx' },
    css: { entryGlob: 'page/**/index.css' },
  },
}


```

[babelify]: https://github.com/babel/babelify

