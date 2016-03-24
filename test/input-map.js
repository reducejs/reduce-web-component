var reduce = require('../')
var test = require('tap').test
var path = require('path')
var fs = require('fs')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('inputMap', function(t) {
  var opts = require(fixtures('reduce.config'))
  opts.map = fixtures('deps.js')
  return reduce.bundle(opts).then(function() {
    var data = fs.readFileSync(opts.map)
    fs.unlinkSync(opts.map)
    var o = JSON.parse(data)
    t.same(
      o['page/hi/index.css'],
      ['common.css', 'page/hi/index.css']
    )
    t.same(
      o['page/hello/index.css'],
      ['common.css', 'page/hello/index.css']
    )
    t.same(
      o['page/hi/index.js'],
      ['common.js', 'page/hi/index.js']
    )
    t.same(
      o['page/hello/index.js'],
      ['common.js', 'page/hello/index.js']
    )
  })
})
