var reduce = require('../')
var test = require('tap').test
var path = require('path')
var compare = require('compare-directory')
var del = require('del')

var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('single-bundle', function(t) {
  var bundler = reduce(require(fixtures('reduce.config')))
  return del(fixtures('build'))
    .then(bundler)
    .then(function () {
      compare(
        t,
        ['**/*.css', '**/*.js'],
        fixtures('build'),
        fixtures('expected')
      )
    })
})

