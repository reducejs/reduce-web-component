'use strict'

const buildOptions = require('../lib/buildOptions')
const test = require('tap').test

test('paths', function(tt) {
  tt.test('top', function(t) {
    let opts = { reduce: { paths: 'a' } }
    let jsOpts = buildOptions.js(opts.js, opts)
    let cssOpts = buildOptions.css(opts.css, opts)

    t.same(jsOpts.reduce.paths, ['a'])
    t.same(cssOpts.reduce.paths, ['a'])

    t.end()
  })

  tt.test('cascading', function(t) {
    let options = {
      reduce: { paths: ['a'] },
      js: {
        reduce: { paths: ['c'] },
      },
      css: {
        reduce: { paths: ['b'] },
      },
    }
    let jsOpts = buildOptions.js(options.js, options)
    let cssOpts = buildOptions.css(options.css, options)

    t.same(jsOpts.reduce.paths, ['c', 'a'])
    t.same(cssOpts.reduce.paths, ['b', 'a'])

    t.end()
  })

  tt.test('style resolve', function(t) {
    let options = { reduce: { paths: ['a'] } }
    let cssOpts = buildOptions.css(options.css, options)

    t.same(cssOpts.reduce.resolve.paths, ['a'])

    t.end()
  })

  tt.end()
})

test('basedir', function(tt) {
  tt.test('top', function(t) {
    let options = { reduce: { basedir: '/path/to/basedir' } }
    let jsOpts = buildOptions.js(options.js, options)
    let cssOpts = buildOptions.css(options.css, options)

    t.equal(jsOpts.reduce.basedir, '/path/to/basedir')
    t.equal(cssOpts.reduce.basedir, '/path/to/basedir')

    t.end()
  })

  tt.test('cascading', function(t) {
    let options = {
      reduce: { basedir: '/path/to/basedir/a' },
      js: {
        reduce: { basedir: '/path/to/basedir/c' },
      },
    }
    let jsOpts = buildOptions.js(options.js, options)

    t.equal(jsOpts.reduce.basedir, '/path/to/basedir/c')

    t.end()
  })

  tt.end()
})

test('on', function(t) {
  let cb1 = function () {}
  let cb2 = function () {}
  let options = {
    on: { log: cb1, error: cb2 },
  }
  let jsOpts = buildOptions.js(options.js, options)
  let cssOpts = buildOptions.css(options.css, options)

  t.same(jsOpts.on.log, [cb1])
  t.same(jsOpts.on.error, [cb2])

  t.same(cssOpts.on.log, [cb1])
  t.same(cssOpts.on.error, [cb2])

  t.end()
})

