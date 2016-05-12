# 自定义模块路径
默认情况下，JS中的`require`与CSS中的`@external`和`@import`在解析模块路径时规则与Node.js一致。

当本地有大量模块时，为了避免它们相互依赖时写复杂的相对路径，可以指定一个模块查找的路径。

## 实例
```
src/
├── component
│   ├── earth
│   │   ├── index.css
│   │   └── index.js
│   ├── helper
│   │   └── color.css
│   └── world
│       ├── index.css
│       └── index.js
├── node_modules
│   └── lodash
│       └── index.js
└── page
    ├── hello
    │   ├── index.css
    │   └── index.js
    └── hi
        └── index.js

```

`component`目录下存放有本地的模块，将其指定为模块查找路径之一时，便可以在`page`与`component`目录下均直接使用模块的名字。
譬如，在`page/hello/index.js`中：
```js
module.exports = 'hello, ' + require('world')

```

为做到这一点，只需要在配置文件中添加一项`paths`的配置：

```js
var path = require('path')

module.exports = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  reduce: {
    basedir: path.join(__dirname, 'src'),
    // 额外的模块查找路径
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

```

