var reduce = require('../')
var test = require('tap').test
var path = require('path')
var fs = require('fs')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')
var src = fixtures.bind(null, 'src', 'reduce')

test('inputMap', function(t) {
  var opts = require(fixtures('reduce.config'))
  return reduce.bundle(opts).then(function() {
    data = fs.readFileSync(opts.map)
    fs.unlinkSync(opts.map)
    var o = JSON.parse(data)
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
