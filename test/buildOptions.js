var buildOptions = require('../lib/buildOptions')
var test = require('tap').test

test('paths', function(tt) {
  tt.test('top', function(t) {
    var options = buildOptions({
      paths: 'a',
    })

    t.same(options.js.reduce.paths, ['a'])
    t.same(options.css.reduce.paths, ['a'])

    t.end()
  })

  tt.test('cascading', function(t) {
    var options = buildOptions({
      paths: ['a'],
      js: {
        paths: ['b'],
        reduce: {
          paths: ['c'],
        },
      },
      css: {
        paths: ['b'],
      },
    })

    t.same(options.js.reduce.paths, ['c', 'b', 'a'])
    t.same(options.css.reduce.paths, ['b', 'a'])

    t.end()
  })

  tt.test('style resolve', function(t) {
    var options = buildOptions({
      paths: ['a'],
    })

    t.same(options.css.reduce.resolve.paths, ['a'])

    t.end()
  })

  tt.end()
})

test('basedir', function(tt) {
  tt.test('top', function(t) {
    var options = buildOptions({
      basedir: '/path/to/basedir',
    })

    t.equal(options.js.reduce.basedir, '/path/to/basedir')
    t.equal(options.css.reduce.basedir, '/path/to/basedir')

    t.end()
  })

  tt.test('cascading', function(t) {
    var options = buildOptions({
      basedir: '/path/to/basedir/a',
      js: {
        basedir: '/path/to/basedir/b',
        reduce: {
          basedir: '/path/to/basedir/c',
        },
      },
      css: {
        basedir: '/path/to/basedir/b',
      },
    })

    t.equal(options.js.reduce.basedir, '/path/to/basedir/c')
    t.equal(options.css.reduce.basedir, '/path/to/basedir/b')

    t.end()
  })

  tt.end()
})

test('on', function(t) {
  var cb1 = function () {}
  var cb2 = function () {}

  var options = buildOptions({
    on: { log: cb1, error: cb2 },
  })

  t.same(options.js.on, {
    log: [cb1],
    error: [cb2],
  })
  t.same(options.css.on, {
    log: [cb1],
    error: [cb2],
  })

  t.end()
})

