var combine = require('stream-combiner2')
var collectCssDeps = require('./collectCssDeps')
var cssDepsPatcher = require('deps-patch')
var resolver = require('resolve')

module.exports = function (opts) {
  opts = opts || {}
  var jsBundler
  var cssBundler
  var ret = []
  if (opts.js !== false) {
    jsBundler = createBundler(opts.js, 'js')
    ret.push(bundle(jsBundler, opts.js))
  }
  if (opts.css !== false) {
    cssBundler = createBundler(opts.css, 'css')
    ret.push(bundle(cssBundler, opts.css))
  }

  if (jsBundler && cssBundler && opts.getStyle) {
    applyDepsPatch(jsBundler, cssBundler, opts.getStyle)
  }

  return Promise.all(ret)
}

function createBundler(opts, type) {
  var reduce
  if (type === 'css') {
    reduce = require('reduce-css')
  } else {
    reduce = require('reduce-js')
  }
  var bundlerOptions = Object.assign({
    basedir: process.cwd(),
  }, opts.reduce)

  var args = [bundlerOptions, opts.bundleOptions]
  if (opts.entries) {
    args.unshift(opts.entries)
  }
  var b = reduce.create.apply(reduce, args)
  b._type = type
  return b
}

function applyDepsPatch(jsBundler, cssBundler, getStyle) {
  jsBundler.plugin(collectCssDeps, { getStyle })
  cssBundler.plugin(cssDepsPatcher, () => new Promise(function (resolve) {
    jsBundler.once('css-deps', resolve)
  }))
}

function bundle(b, opts) {
  return new Promise(function (resolve, reject) {
    b.on('error', reject)
    Object.keys(opts.on || {}).forEach(function (event) {
      [].concat(opts.on[event]).forEach(cb => b.on(event, cb))
    })

    var pipeline = [].concat(opts.plugin || []).map(function (args) {
      args = [].concat(args)
      if (args[0] === 'dest') {
        args[0] = b.dest
      } else if (typeof args[0] === 'string') {
        args[0] = require(resolver.sync(args[0], { basedir: b._options.basedir }))
      }
      return args[0].apply(b, args.slice(1))
    })
    process.nextTick(() => {
      b.bundle().pipe(combine.obj(pipeline))
        .on('error', err => b.emit('error', err))
        .on('data', () => {})
        .once('end', resolve)
    })
  })
}

