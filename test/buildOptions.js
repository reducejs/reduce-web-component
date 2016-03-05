'use strict'

const util = require('../lib/buildOptions')
const test = require('tap').test
const fs = require('fs')

test('plugin', function (t) {
  t.same(
    util.plugin({ plugin: ['x'] }, './delog'),
    {
      plugin: [
        'x',
        [require('../lib/delog')],
      ],
    },
    'plugin exists'
  )

  t.same(
    util.plugin({}, require('../lib/delog')),
    {
      plugin: [ [require('../lib/delog')] ],
    },
    'function'
  )

  t.same(
    util.plugin({}, './delog'),
    {
      plugin: [
        [require('../lib/delog')],
      ],
    },
    'string'
  )

  t.same(
    util.plugin({}, './delog', 1),
    {
      plugin: [
        [require('../lib/delog'), 1],
      ],
    },
    'string, single arg'
  )

  t.same(
    util.plugin({}, './delog', [1, 2]),
    {
      plugin: [
        [require('../lib/delog'), 1, 2],
      ],
    },
    'string, args'
  )

  t.end()
})

test('merge', function (t) {
  t.same(
    util.merge({}),
    {
      on: {},
      reduce: { cache: {}, packageCache: {}, paths: [] },
    },
    'default'
  )

  t.same(
    util.merge({ reduce: { x: 1 } }, { reduce: { x: 2, y: 2 } }).reduce,
    { cache: {}, packageCache: {}, paths: [], x: 1, y: 2 },
    'cascading'
  )

  t.same(
    util.merge({ reduce: { paths: [1] } }, { reduce: { paths: [2] } }).reduce.paths,
    [1, 2],
    'paths'
  )

  var cb1 = function () {}
  var cb2 = function () {}
  t.same(
    util.merge({ on: { error: cb1 } }, { on: { error: cb2, log: cb2 } }).on,
    { error: [cb1, cb2], log: [cb2] },
    'on'
  )

  t.same(
    util.merge({}, { dest: 'build' }).dest,
    'build',
    'dest'
  )

  t.equal(
    typeof util.merge({}, { map: 'map.json' }).on['common.map'][0],
    'function',
    'common.map'
  )

  var map = {}
  util.merge({}, { map: map }).on['common.map'][0]
    .call({ _type: 'css' }, null, { x: 1 })
  t.same(map, { css: { x: 1 } }, 'object map')

  t.end()
})

test('createListener', function (t) {
  util.createListener(
    function (map, type) {
      t.same(map, {})
      t.equal(type, 'css')
    }
  ).call({ _type: 'css' }, null, {})

  util.createListener(
    function (map) {
      t.same(map, {
        'page/A/index.css': ['common.css', 'page/A/index.css'],
        'page/B/index.css': ['common.css', 'page/B/index.css'],
      })
    },
    'page/**/index.css'
  ).call({ _type: 'css' }, null, {
    'page/A/index.css': ['common.css', 'page/A/index.css'],
    'page/B/index.css': ['common.css', 'page/B/index.css'],
    'node_modules/X/index.css': ['page/A/index.css'],
  })

  t.end()
})

test('writeObj', function (t) {
  t.same(
    util.writeObj({ js: {} }, { x: 1 }, 'css'),
    { css: { x: 1 }, js: {} }
  )

  t.same(
    util.writeObj({ css: { x: 2, y: 3 } }, { x: 1 }, 'css'),
    { css: { x: 1 } }
  )

  t.end()
})

test('writeFile', function (t) {
  var file = 'map.json'

  util.writeFile(file, { x: 1 }, 'js')
  t.same(
    JSON.parse(fs.readFileSync('map.json', 'utf8')),
    { js: { x: 1 } }
  )

  util.writeFile(file, { x: 2 }, 'css')
  t.same(
    JSON.parse(fs.readFileSync('map.json', 'utf8')),
    { css: { x: 2 }, js: { x: 1 } }
  )

  util.writeFile(file, { x: 1, z: 3, y: 2 }, 'js')
  t.same(
    Object.keys(JSON.parse(fs.readFileSync('map.json', 'utf8')).js),
    ['x', 'y', 'z']
  )

  fs.unlinkSync(file)

  t.end()
})

test('dest', function (t) {
  var reduce = require('reduce-js')
  t.same(
    util.dest({ plugin: [['dest', 'x']] }, reduce),
    { plugin: [[reduce.dest, 'x']] }
  )

  t.same(
    util.dest({ dest: 'x' }, reduce),
    { plugin: [[reduce.dest, 'x']], dest: 'x' }
  )

  t.end()
})

test('css', function (t) {
  t.same(
    util.css(
      { reduce: { resolve: { paths: 1 }, paths: [2] } }
    ).reduce,
    {
      paths: [2],
      resolve: { paths: [1, 2] },
      cache: {},
      packageCache: {},
    }
  )

  t.end()
})

test('js', function (t) {
  t.same(
    util.js({ reduce: { paths: [1] } }, { reduce: { paths: [2] } }).reduce,
    {
      paths: [1, 2],
      cache: {},
      packageCache: {},
    }
  )

  t.end()
})

