var test = require('tap').test
var Reduce = require('../')
var path = require('path')
var fixtures = path.resolve.bind(path, __dirname)

test('single-bundle', function(t) {
  var r = Reduce({
    entries: '**/*.js',
    basedir: fixtures('src', 'single-bundle'),
    js: {
      dest: fixtures('build', 'js'),
    },
    css: {
      reduceOpts: {
        factor: 'common.js',
      },
      dest: [
        fixtures('build', 'css'),
        null,
        {
          maxSize: 0,
          name: '[name].[hash]',
          assetOutFolder: fixtures('build', 'assets'),
        },
      ],
    },
  })
})

