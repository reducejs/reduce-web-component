# 插件
Reduce中的插件根据发生作用的阶段可分为以下两类：
* 打包插件：控制包生成的插件。
* 后处理插件：包生成后的处理插件。

这里的“包”指的是[vinyl]对象。也就是说，第一类插件主要影响[vinyl]对象的生成，第二类插件则是对[vinyl]对象做进一步处理。

打包插件包括[browserify]和[depsify]的所有插件，分别作用于JS和CSS。
有些插件两者都适用，如[watchify]、[common-bundle]。

后处理插件实际就是处理[vinyl]流的插件，包括所有[gulp]插件。
实际使用时需要确定插件是处理JS还是CSS。
由于CSS中可能存在url，部分插件不能使用。
譬如[gulp-rename]。（但可以对JS使用）

## 实例
下面是一个使用插件的配置例子。
```js
const path = require('path')
const Clean = require('clean-remains')

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
    reduce: {
      // 这里是browserify插件
      plugin: 'dedupify',
    },
    // 这里是JS包的后处理插件
    plugin: [
      // 可以用字符串'dest'来代表一个特殊的插件
      // 等同于gulp.dest，可用来将文件写到磁盘
      ['dest', path.join(__dirname, 'build')],
      // 这个插件可以记录文件历史，从而将之前产生过但这次不在产生列表中的文件删除
      Clean([]),
    ],
  },

  css: {
    //entries: 'page/**/index.css',
    bundleOptions: {
      groups: 'page/**/index.css',
      common: 'common.css',
    },
    // 这里是CSS包的后处理插件
    plugin: [
      // 可以用字符串'dest'来代表一个特殊的插件
      // 类似于gulp.dest，可用来将文件写到磁盘，同时处理CSS中url引用的资源
      ['dest', path.join(__dirname, 'build')],
      // 这个插件可以记录文件历史，从而将之前产生过但这次不在产生列表中的文件删除
      Clean([]),
    ],
  },

  // 这里实际指定的是watchify的参数。
  watch: {
    js: { entryGlob: 'page/**/index.js' },
    css: { entryGlob: 'page/**/index.css' },
  },
}

```

[vinyl]: https://github.com/gulpjs/vinyl
[PostCSS]: https://github.com/postcss/postcss
[browserify]: https://github.com/substack/node-browserify
[watchify]: https://github.com/substack/watchify
[depsify]: https://github.com/reducejs/depsify
[watchify2]: https://github.com/reducejs/watchify2
[common-bundle]: https://github.com/reducejs/common-bundle
[reduce-css-postcss]: https://github.com/reducejs/reduce-css-postcss

