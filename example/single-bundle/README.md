# 单包模式
单包模式，即将所有JS打成一个包，CSS也打成一个包。

## 实例
```
src/
├── node_modules
│   ├── earth
│   │   ├── index.css
│   │   └── index.js
│   ├── helper
│   │   └── color.css
│   └── world
│       ├── index.css
│       └── index.js
└── page
    ├── hello
    │   ├── index.css
    │   └── index.js
    └── hi
        └── index.js

```

输入中有两个页面：`hello`和`hi`。
可以使用如下的配置将所有JS打包成`bundle.js`，所有CSS打包成`bundle.css`。

```js
var path = require('path')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  reduce: {
    basedir: path.join(__dirname, 'src'),
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

```

打包策略通过`bundleOptions`设置。直接指定为目标路径时，便打成一个包。
JS与CSS的设置方式一样。

在本例子中，最终生成的目录为：
```
build/
├── bundle.css
└── bundle.js

```

