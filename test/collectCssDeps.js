var test = require('tap').test
var collect = require('../lib/collectCssDeps')
var collectCssDeps = collect.collectCssDeps
var reduce = require('reduce-js')
var path = require('path')

test('getStyle', function(tt) {
  tt.test('null', wrap())

  tt.test('sync', wrap(function (jsFile) {
    if (jsFile.indexOf('/component/') === 0) {
      return path.dirname(jsFile) + '/index.css'
    }
  }))

  tt.test('promise', wrap(function (jsFile) {
    if (jsFile.indexOf('/component/') === 0) {
      return Promise.resolve(path.dirname(jsFile) + '/index.css')
    }
  }))

  function wrap(getStyle) {
    var expected = []
    if (getStyle) {
      expected = [{
        dependenciesFilter: '/component/a/index.css',
        deps: ['/component/b/index.css', '/component/c/index.css'],
      }]
    }

    return function (t) {
      t.plan(1)

      var stream = collectCssDeps({ getStyle: getStyle })

      stream.once('css-deps', function (deps) {
        t.same(deps, expected)
      })

      stream.write({
        file: '/component/a/index.js',
        deps: {
          'b': '/component/b/index.js',
          'c': '/component/c/index.js',
        },
      })
      stream.write({
        file: '/d.js',
        deps: { 'b': '/component/b/index.js' },
      })
      stream.write({ file: '/e.js', deps: {} })
      stream.end()
    }
  }

  tt.end()
})

