'use strict'

const reduce = require('../')
const test = require('tap').test
const path = require('path')
const compare = require('compare-directory')
const del = require('del')
const fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('postTransform', function(t) {
  return del(fixtures('build'))
    .then(reduce(require(fixtures('postTransform.config'))))
    .then(function () {
      compare(
        t,
        ['**/*.css', '**/*.js'],
        fixtures('build'),
        fixtures('expected/reduce')
      )
    })
})

