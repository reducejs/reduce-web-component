# 定制PostCSS
默认使用的PostCSS插件有：

* [postcss-simple-import]。支持`@import`。
  需要区分@import与@external的使用。
* [postcss-custom-url]。自动变换CSS中的url。
* [postcss-advanced-variables]。支持变量。
* [postcss-mixins]。支持mixin。
* [postcss-nested]。支持嵌套。
* [postcss-extend]。支持扩展。
* [autoprefixer]。自动添加浏览器厂商前缀。

这些插件的使用可以支持近似[SASS]的代码风格，具体写法可参考上面给出的链接。
这里主要介绍一下前两个插件的使用，以及如何去增加、删除插件。

## @import v.s. @external
`@import`由[postcss-simple-import]处理，**在预处理中**起作用，影响**编译**结果。

譬如下面的情况中，在预处理时，必须将vars.css中的内容插入到a.css中相应位置，后者才能处理成预期的结果。
```scss
/* vars.css */

$red: #ff0000;
$green: #00ff00;
$blue: #0000ff;

```

```scss
/* a.css */

@import "./vars.css";
a {
  color: $red;
}

```

预处理结果：
```css
a {
  color: #ff0000;
}

```

`@external`只是依赖声明。
**在预处理后**，进行依赖解析时可确定模块之间的依赖关系，影响**打包**结果。

如果将上面例子中的`@import`换成`@external`，则将a.css打成包后结果为：
```scss
a {
  color: $red;
}

```

这是因为在预处理a.css时，并未引入变量的定义。
同时在打包时，虽然a.css依赖了vars.css，但vars.css的预处理结果为空字符串，没有任何内容。

下面是一个正确使用`@external`的例子。

```css
/* a.css */

@external "reset";
a {
  color: red;
}

```

```css
/* b.css */

@external "reset";
b {
  color: green;
}

```

```css
/* reset.css */

a, b {
  color: black;
}

```

打成一个包的配置：
```js
{
  css: {
    bundleOptions: 'bundle.css',
  },
}

```
结果：

```css
/* bundle.css */

a, b {
  color: black;
}

a {
  color: red;
}

b {
  color: green;
}

```

打成多个包的配置：
```js
{
  css: {
    bundleOptions: {
      // 分别以a.css和b.css为入口生成两个包
      groups: ['a.css', 'b.css'],
      // 提取a.css和b.css的公共依赖，生成第三个包
      common: 'c.css',
    },
  },
}

```
结果：
```css
/* 必须在a.css和b.css加载前先加载c.css */

/* a.css */
a {
  color: red;
}

/* b.css */
b {
  color: green;
}

/* c.css */
a, b {
  color: black;
}

```

**区别小结**

- `@external`的目标文件是预处理后的内容，所以一定是要有具体CSS的才有意义。
- `@import`的目标文件是预处理中的辅助内容，一般是变量定义、mixin等。

## url变换
由于`@import`和`@external`的影响，文件内容最终出现打包结果中时，`url()`中的相对路径需要做一些调整。
这主要由[postcss-custom-url]完成。

在Reduce中，默认情况下小于10k的资源将以base-64的形式内嵌，其它则根据配置进行相应的拷贝。

可以在配置中修改这个上限。
```js
{
  css: {
    // 小于5k以下的资源被inline
    // 其余的拷贝到/path/to/assets
    dest: ['/path/to/dest', null, { maxSize: 5, assetOutFolder: '/path/to/assets' }],
  }
}

```

## 修改插件列表
### 添加插件
直接指定需要添加的插件列表：
```js
{
  css: {
    reduce: {
      postcss: creators,
    },
  },
}

```

**creators**

Type: `Array`

每个元素可以有以下三种形式（以`postcss-modules`为例）
* `require('postcss-modules')`
* `require('postcss-modules')(opts)`
* `[require('postcss-modules')，opts]`

### 更复杂的操作
指定函数操作[pipeline][postcss-processor-splicer]对象。
```js
{
  css: {
    reduce: {
      postcss: pipeline => {
        // 使用postcss-simple-vars代替postcss-advanced-variables
        pipeline.splice('postcss-advanced-variables', 1, require('postcss-simple-vars'))

        var creator = pipeline.get('autoprefixer')
        // 给autoprefixer指定配置
        creator[1] = { add: false, browsers: [] }
      },
    },
  },
}

```

[autoprefixer]: https://github.com/postcss/autoprefixer
[PostCSS]: https://github.com/postcss/postcss
[postcss-advanced-variables]: https://github.com/jonathantneal/postcss-advanced-variables
[postcss-custom-url]: https://github.com/reducejs/postcss-custom-url
[postcss-extend]: https://github.com/travco/postcss-extend
[postcss-mixins]: https://github.com/postcss/postcss-mixins
[postcss-nested]: https://github.com/postcss/postcss-nested
[postcss-processor-splicer]: https://github.com/reducejs/postcss-processor-splicer
[postcss-simple-import]: https://github.com/reducejs/postcss-simple-import
[reduce-css-postcss]: https://github.com/reducejs/reduce-css-postcss
[SASS]: http://sass-lang.com/

