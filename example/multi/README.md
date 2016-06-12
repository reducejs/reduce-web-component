# 多包模式
多包模式下，可以指定某个模块及其依赖被打包进指定的包，从而导致最终生成多个包。同时，还可以指定从某些包中提取出公共的模块，生成一个供这些包共享的公共包。

## 实例

```
src/
├── node_modules
│   ├── earth
│   │   ├── index.css
│   │   └── index.js
│   ├── exclamation
│   │   ├── index.css
│   │   └── index.js
│   ├── helper
│   │   └── color.css
│   ├── round
│   │   └── index.css
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
可以使用如下的配置为每个页面均生成一个JS文件和CSS文件，同时额外生成一个JS和CSS公共包。

```js
const path = require('path')

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
    bundleOptions: {
      // 每个匹配到的文件均单独生成一个包
      groups: 'page/**/index.js',
      // 从所有已生成的包中提取公共包
      common: 'common.js',
    },
  },

  css: {
    //entries: 'page/**/index.css',
    bundleOptions: {
      // 每个匹配到的文件均单独生成一个包
      groups: 'page/**/index.css',
      // 从所有已生成的包中提取公共包
      common: 'common.css',
    },
  },
}

```

在本例子中，最终生成的目录为：
```
build/
├── common.css
├── common.js
└── page
    ├── hello
    │   ├── index.css
    │   └── index.js
    └── hi
        ├── index.css
        └── index.js

```

