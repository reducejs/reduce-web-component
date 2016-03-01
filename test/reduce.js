'use strict'

const reduce = require('../')
const test = require('tap').test
const path = require('path')
const compare = require('compare-directory')
const del = require('del')
const fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('single-bundle', function(t) {
  let bundler = reduce(require(fixtures('reduce.config')))
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

