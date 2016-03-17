var reduce = require('../')
var test = require('tap').test
var path = require('path')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')
var src = fixtures.bind(null, 'src', 'reduce')

test('getDeps', function(t) {
  var opts = require(fixtures('reduce.config'))
  return reduce.getDeps('**/page/**/index.*', opts)
    .then(function (o) {
      t.same(
        o[src('page/hi/index.css')],
        ['common.css', 'page/hi/index.css']
      )
      t.same(
        o[src('page/hello/index.css')],
        ['common.css', 'page/hello/index.css']
      )
      t.same(
        o[src('page/hi/index.js')],
        ['common.js', 'page/hi/index.js']
      )
      t.same(
        o[src('page/hello/index.js')],
        ['common.js', 'page/hello/index.js']
      )
    })
})

