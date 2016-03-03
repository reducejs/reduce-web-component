'use strict'

const stream = require('stream')
const _combine = require('stream-combiner2')
const buffer = require('vinyl-buffer')
const reduce = {
  js: require('reduce-js'),
  css: require('reduce-css'),
}

function through(write, end) {
  return stream.Transform({
    objectMode: true,
    transform: write,
    flush: end,
  })
}

function createPipeline(opts, type) {
  if (typeof opts === 'function') {
    opts = opts()
  }
  opts = opts || []
  return [].concat(opts).map(function (args) {
    args = [].concat(args)
    if (args[0] === 'dest') {
      return reduce[type].dest.apply(null, args.slice(1))
    }
    return args[0].apply(null, args.slice(1))
  })
}

function combine(streams) {
  return _combine.obj(streams)
}

function timer(b) {
  let time = Date.now()
  let bytes = 0

  let ret = combine([buffer(), through(write, end)])

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

module.exports = {
  createPipeline,
  through,
  combine,
  timer,
}

