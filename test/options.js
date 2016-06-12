'use strict'

const create = require('../lib/createOptions')
const test = require('tap').test

test('default', function (t) {
  let o

  o = create()
  t.same(o.js.reduce, { cache: {}, packageCache: {} }, 'default js options')
  t.same(o.css.reduce, { cache: {}, packageCache: {} }, 'default css options')

  o = create({ css: false })
  t.equal(o.css, undefined, 'css disabled')

  o = create({ js: false })
  t.equal(o.js, undefined, 'js disabled')

  t.end()
})

test('reduce', function (t) {
  let o

  o = create({
    reduce: {
      basedir: '/path/to/src',
      paths: '/path/to/lib',
    },
    js: {
      reduce: { paths: '/path/to/modules' },
    },
    css: {
      reduce: { paths: '/path/to/modules' },
    },
  })
  t.same(o.js.reduce, {
    paths: [ '/path/to/modules', '/path/to/lib' ],
    basedir: '/path/to/src',
    cache: {},
    packageCache: {},
  }, 'js.reduce')
  t.same(o.css.reduce, {
    paths: [ '/path/to/modules', '/path/to/lib' ],
    basedir: '/path/to/src',
    cache: {},
    packageCache: {},
    resolve: {
      paths: [ '/path/to/modules', '/path/to/lib' ],
    },
  }, 'css.reduce')

  t.end()
})

test('entries', function (t) {
  let o

  o = create({
    js: {
      entries: 'page/**/index.js',
    },
    css: {
      entries: [ 'page/**/index.css' ],
    },
  })
  t.equal(o.js.entries, 'page/**/index.js', 'js.entries')
  t.same(o.css.entries, [ 'page/**/index.css' ], 'css.entries')

  t.end()
})

test('plugin', function (t) {
  let o

  function plugin() {}

  o = create({
    plugin: [[plugin, 1, 2]],
    js: {
      plugin: [plugin],
    },
    css: {
      plugin: [[plugin]],
    },
  })
  t.same(o.js.plugin, [
    require('../lib/timer'),
    plugin,
    [plugin, 1, 2],
  ], 'js.plugin')
  t.same(o.css.plugin, [
    require('../lib/timer'),
    [plugin],
    [plugin, 1, 2],
  ], 'css.plugin')

  t.end()
})

test('on', function (t) {
  let o

  function cb1() {}
  function cb2() {}
  o = create({
    on: { x: cb1, y: cb2 },
    js: {
      on: { x: cb2 },
    },
    css: {
      on: { y: cb1 },
    },
  })
  t.same(o.js.on, { x: [cb2, cb1], y: [cb2] }, 'js.on')
  t.same(o.css.on, { x: [cb1], y: [cb1, cb2] }, 'css.on')

  t.end()
})

test('dest', function (t) {
  let o

  o = create({ dest: 'build' })
  t.same(o.js.plugin, [
    require('../lib/timer'),
    ['dest', 'build'],
  ], 'common js.plugin.dest')
  t.same(o.css.plugin, [
    require('../lib/timer'),
    ['dest', 'build'],
  ], 'common css.plugin.dest')

  o = create({
    js: { dest: 'build' },
    css: { dest: ['build', 1] },
  })
  t.same(o.js.plugin, [
    require('../lib/timer'),
    ['dest', 'build'],
  ], 'js.plugin.dest')
  t.same(o.css.plugin, [
    require('../lib/timer'),
    ['dest', 'build', 1],
  ], 'css.plugin.dest')

  t.end()
})

test('bundleOptions', function (t) {
  let o

  let opts1 = {}
  let opts2 = {}
  o = create({
    bundleOptions: opts1,
    js: { bundleOptions: opts2 },
  })
  t.equal(o.js.bundleOptions, opts1, 'js.bundleOptions')
  t.equal(o.css.bundleOptions, opts1, 'css.bundleOptions')

  t.end()
})

test('watch', function (t) {
  let o

  let opts1 = {}
  let opts2 = {}
  o = create({
    js: { watch: opts1 },
    css: { watch: opts2 },
  })
  t.equal(o.js.watch, opts1, 'js.watch')
  t.equal(o.css.watch, opts2, 'css.watch')

  o = create({
    watch: opts2,
    js: { watch: opts1 },
  })
  t.equal(o.js.watch, opts2, 'js.watch')
  t.equal(o.css.watch, opts2, 'css.watch')

  t.end()
})

test('env', function (t) {
  let o

  function plugin() {}
  function log() {}

  o = create({
    on: { error: log },
    dest: 'build',
    plugin: plugin,

    js: {
      plugin: [[plugin, 1]],
    },
    env: {
      development: {
        dest: 'dist',
        on: { log: log },
        js: { plugin: [[plugin, 2]] },
      },
    },
  })

  t.same(o.js.plugin, [
    require('../lib/timer'),
    [plugin, 1],
    plugin,
    [plugin, 2],
    ['dest', 'dist'],
  ], 'js.plugin')
  t.same(o.js.on, {
    error: [ log ],
    log: [ log ],
  }, 'js.on')

  process.env.NODE_ENV = 'product'
  o = create({
    on: { error: log },
    dest: 'build',
    plugin: plugin,

    js: {
      plugin: [[plugin, 1]],
    },
    env: {
      product: {
        dest: 'dist',
        on: { log: log },
        js: { plugin: [[plugin, 2]] },
      },
    },
  })

  t.same(o.js.plugin, [
    require('../lib/timer'),
    [plugin, 1],
    plugin,
    [plugin, 2],
    ['dest', 'dist'],
  ], 'js.plugin')
  t.same(o.js.on, {
    error: [ log ],
    log: [ log ],
  }, 'js.on')

  t.end()
})

