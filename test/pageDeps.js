'use strict'

const reduce = require('../')
const test = require('tap').test
const path = require('path')
const fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('page-deps', function(t) {
  var opts = require(fixtures('reduce.config'))
  return reduce.deps('page/**/index.*', opts)
    .then(function (o) {
      t.same(o, {
        css: ['page/hello/index.css', 'page/hi/index.css'],
        js: ['page/hello/index.js', 'page/hi/index.js'],
      })
    })
})

