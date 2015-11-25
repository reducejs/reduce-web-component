var test = require('tape')
var same = require('../lib/same')

test('same', function(t) {
  t.ok(
    same({ x: 1 }, { x: 1 }),
    'same simple objects'
  )
  t.notOk(
    same({ x: 1 }, { y: 1 }),
    'not same simple objects'
  )
  t.ok(
    same({ x: [1, 2] }, { x: [1, 2] }),
    'arrays'
  )
  t.ok(
    same({ x: { x: [1, 2] } }, { x: { x: [1, 2] } }),
    'nested'
  )
  t.ok(
    same({ x: { x: [1, 2] }, y: [3, 4] }, { x: { x: [1, 2] }, y: [3, 4] }),
    'multiple nested'
  )
  t.end()
})

