# map.json
从[多包](../multi-bundles/)的例子中可以发现，普通包与公共包之间有一种依赖关系，这个信息是可以写入到指定的文件中。

## 实例
与[多包](../multi-bundles/)的配置几乎相同，只是添加了一个`map`的配置：

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

  map: {
    file: path.join(__dirname, 'map.json'),
    basedir: path.join(__dirname, 'src'),
    filter: '**/page/**/index.+(js|jsx|css)',
  },

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

输出的`map.json`文件内容为：
```json
{
  "page/hello": {
    "js": [
      "common.js",
      "page/hello/index.js"
    ],
    "css": [
      "common.css",
      "page/hello/index.css"
    ]
  },
  "page/hi": {
    "js": [
      "common.js",
      "page/hi/index.js"
    ],
    "css": [
      "common.css",
      "page/hi/index.css"
    ]
  }
}

```

第一级键值为页面路径，对应的值为该页面需要使用的JS、CSS。
数组中元素（包）的顺序隐含了资源需要加载的先后。

