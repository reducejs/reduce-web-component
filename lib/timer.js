'use strict'

const through = require('./through')
const combine = require('stream-combiner2')
const buffer = require('vinyl-buffer')

module.exports = function () {
  let b = this
  let time = Date.now()
  let bytes = 0

  let ret = combine.obj(buffer(), through(write, end))

  function write(file, enc, next) {
    if (!file.isNull()) {
      bytes += file.contents.length
    }
    next(null, file)
  }

  function end(next) {
    b.emit('reduce.end', bytes, Date.now() - time)
    next()
  }

  return ret
}

