# reduce-web-component
[![version](https://img.shields.io/npm/v/reduce-web-component.svg)](https://www.npmjs.org/package/reduce-web-component)
[![status](https://travis-ci.org/reducejs/reduce-web-component.svg)](https://travis-ci.org/reducejs/reduce-web-component)
[![coverage](https://img.shields.io/coveralls/reducejs/reduce-web-component.svg)](https://coveralls.io/github/reducejs/reduce-web-component)
[![dependencies](https://david-dm.org/reducejs/reduce-web-component.svg)](https://david-dm.org/reducejs/reduce-web-component)
[![devDependencies](https://david-dm.org/reducejs/reduce-web-component/dev-status.svg)](https://david-dm.org/reducejs/reduce-web-component#info=devDependencies)
![node](https://img.shields.io/node/v/reduce-web-component.svg)

**Features**

* Automatically pack styles together when one component requires another (in scripts).
* Use [`browserify`] and [`depsify`] to pack scripts and styles into common shared bundles.
* Use [`watchify2`] to watch file changes, addition and deletion.
* Use [`postcss`] to preprocess styles by default.

## Example
Suppose we put pages under the directory `/path/to/src/page`,
and other components under `/path/to/src/node_modules`.

A page or component may have a style entry as well as a script entry.
For simplicity, entries are named as `index.[js|css]` if present.

There are two pages (`hello` and `hi`), as well as two components (`world`, `earth`).

The `hello` page will present the `world` component (both scripts and styles needed).
We can do this by adding `require('world')` in `hello/index.js`,
and `@import "world";` in `hello/index.css`.
However, if `world` is no longer needed,
we have to remove both `require('world')` and `@import "world"`,
which is really cumbersome.

So, we decide that if the script entry is `require`d,
the corresponding style entry should also be `@import`ed.
In such cases, we say the component is required.
This is achieved by adding style dependencies according to script dependencies.

Eventually, we want scripts required by all pages to be packed into `/path/to/build/bundle.js`,
and styles into `/path/to/build/bundle.css`.

We can use this package to do that.

### Input

**The `hello` page**

* Script entry (`page/hello/index.js`)
```js
module.exports = 'hello, ' + require('world')

```

* Style entry (`page/hello/index.css`)
```css
.hello {}

```

**The `hi` page**

* Script entry (`page/hi/index.js`)
```js
module.exports = 'hi, ' + require('earth')

```

* Style entry (`null`)

**The `world` component**

* Script entry (`node_modules/world/index.js`)
```js
module.exports = 'world'

```

* Style entry (`node_modules/world/index.css`)
```css
.world {
  color: red;
}

```

**The `earth` component**

* Script entry (`node_modules/earth/index.js`)
```js
module.exports = 'earth'

```

* Style entry (`node_modules/earth/index.css`)
```css
.earth {
  color: blue;
}

```

The original dependency graph looks like:

![native dependency graph](example/images/native-deps-graph.png)

The dependency graph we want for bundling should look like:

![component dependency graph](example/images/component-deps-graph.png)

**NOTE**
As `hi` requires `earth` and `earth` is shipped with styles,
`hi` will need styles at last.
So a virtual `hi/index.css` is created (but not written into disk).

### Output

We run the following script to bundle js and css:

```js
'use strict'

const path = require('path')
const reduce = require('reduce-web-component')

const options = {
  getStyle: function (jsFile) {
    return path.dirname(jsFile) + '/index.css'
  },

  reduce: {
    basedir: path.resolve(__dirname, 'src'),
  },

  on: {
    log: console.log.bind(console),
    error: function (err) {
      console.error(err.stack)
    },
    'reduce.end': function (bytes, duration) {
      console.log(
        '[%s done] %d bytes written (%d seconds)',
        this._type, bytes, (duration / 1000).toFixed(2)
      )
    },
  },

  js: {
    entries: 'page/**/index.js',
    bundleOptions: 'bundle.js',
    dest: 'build',
  },

  css: {
    // No need to specify entries,
    // because we have done that implicitly by setting getStyle.
    // entries: 'page/**/index.css',
    bundleOptions: 'bundle.css',
    dest: 'build',
  },
}

reduce.bundle(options).then(() => console.log('DONE'))


```

Besides `hello/index.css` and `world/index.css`,
`earth/index.css` will also be included in `bundle.css`.

## Usage

```js
const reduce = require('reduce-web-component')

// pack
reduce.bundle(options).then(() => {})

// watch mode
reduce.watch(options).on('done', () => {})

```

To work with [`gulp`]:

```js
const gulp = require('gulp')
const reduce = require('reduce-web-component')

gulp.task('build', () => {
  return reduce.bundle(options)
})
gulp.task('watch', function (cb) {
  reduce.watch(options)
    .on('close', cb)
    .on('done', () => console.log('-'.repeat(40)))
})

```

## Common shared bundles
Check the [configure](example/multi/reduce.config.js) file.

## Browserify
Scripts are bundled with [`browserify`].
So, plugins and transforms can be applied during the build process.

Check [`browserify-handbook`] for more information.

## PostCss
Styles are preprocessed with [`postcss`].
Check [`reduce-css-postcss`] to see the default processors.

[`depsify`] is used to bundle styles,
so that styles can be packed into common shared multiple bundles.

## options
Options for both JS and CSS bundling are configurable.

Check [`reduce-js`] and [`reduce-css`] for the following options:

* `entries`. Type: `String`, `Array`. *Optional* Globs to locate entries.
* `reduce`. Type: `Object`. Options passed to [`browserify`] or [`depsify`].
* `bundleOptions`. Type: `Object`. Options passed to [`common-bundle`].
* `dest`. Type: `String`, `Array`. Options passed to [`b.dest`].
* `watch`. Type: `Object`. Options passed to [`watchify2`].

Other options:
* `on`. Type: `Object`. Listeners to be added to the bundler instance.
* `plugin`. Plugins to process the vinyl stream. They are just like gulp plugins.

Example:

```js
{
  js: { 
    entries: 'page/**/index.js',
    reduce: { basedir: '/path/to/src' },
    bundleOptions: {
      groups: 'page/**/index.js',
      common: 'common.js',
    },
    watch: {
      ignoreWatch: ['**/node_modules/**'],
      entryGlob: 'page/**/index.js',
    },
    on: { 
      'common.map': o => {},
      error: console.log,
    }
  },
  css: {
    entries: 'page/**/index.css',
    reduce: { basedir: '/path/to/src' },
    bundleOptions: { groups: 'page/**/index.css', common: 'common.css' },
    watch: {
      ignoreWatch: ['**/node_modules/**'],
      entryGlob: 'page/**/index.css',
    },
    on: { 
      error: console.log,
    }
  },
}

```

Meanwhile, we have:
* `getStyle`: bind JS and CSS together so that when js is required, the corresponding css will also be imported implicitly by the dependant's css.

```js
{ 
  getStyle: jsFile => { 
    return path.dirname(jsFile) + '/index.css'
  },
  js: {},
  css: {},
}

```

Suppose there are `/path/to/component/x/index.js` and `/path/to/component/y/index.js`,
and their binding CSS are `/path/to/component/x/index.css` and `/path/to/component/y/index.css` respectively.

If we `require('../y')` in `x/index.js`,
then CSS will be bundled as if there is `@external "../y";` in `x/index.css`.

Common options for both `options.js` and `options.css` could also be specified as properties of `options`:

```js
{
  // common options
  reduce: { basedir: '/path/to/src' },
  on: { 
    error: console.log,
  },

  js: { 
    entries: 'page/**/index.js',
    bundleOptions: {
      groups: 'page/**/index.js',
      common: 'common.js',
    },
    watch: {
      ignoreWatch: ['**/node_modules/**'],
      entryGlob: 'page/**/index.js',
    },
    on: { 
      'common.map': o => {},
    }
  },
  css: {
    entries: 'page/**/index.css',
    bundleOptions: { groups: 'page/**/index.css', common: 'common.css' },
    watch: {
      ignoreWatch: ['**/node_modules/**'],
      entryGlob: 'page/**/index.css',
    },
  },
}

```

Environment-specific options are possible:

```js
{
  reduce: { basedir: '/path/to/src' },
  on: { 
    error: console.log,
  },

  js: { 
    entries: 'page/**/index.js',
    bundleOptions: {
      groups: 'page/**/index.js',
      common: 'common.js',
    },
    watch: {
      ignoreWatch: ['**/node_modules/**'],
      entryGlob: 'page/**/index.js',
    },
    on: { 
      'common.map': o => {},
    }
  },
  css: {
    entries: 'page/**/index.css',
    bundleOptions: { groups: 'page/**/index.css', common: 'common.css' },
    watch: {
      ignoreWatch: ['**/node_modules/**'],
      entryGlob: 'page/**/index.css',
    },
  },
  env: { 
    development: { 
      js: { 
        reduce: { 
          plugin: ['index-hashify', 'browserify-hmr']
        },
      }
    },
    production: { 
      js: { 
        plugin: 'gulp-uglify'
      },
      css: { 
        plugin: 'gulp-uglifycss'
      }
    },
  }
}

```

## Related
* [`reduce-js`]
* [`reduce-css`]

[`reduce-js`]: https://github.com/reducejs/reduce-js
[`browserify`]: https://github.com/substack/node-browserify
[`browserify-handbook`]: https://github.com/substack/browserify-handbook
[`depsify`]: https://github.com/reducejs/depsify
[`common-bundle`]: https://github.com/reducejs/common-bundle
[`watchify2`]: https://github.com/reducejs/watchify2
[`reduce-css`]: https://github.com/reducejs/reduce-css
[`gulp`]: https://github.com/gulpjs/gulp
[`vinyl`]: https://github.com/gulpjs/vinyl
[`vinyl-fs#src`]: https://github.com/gulpjs/vinyl-fs#srcglobs-options
[`postcss`]: https://github.com/postcss/postcss
[`reduce-css-postcss`]: https://github.com/reducejs/reduce-css-postcss#default-plugins
[`custom-resolve`]: https://github.com/zoubin/custom-resolve

