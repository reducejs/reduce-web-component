exports.css = function (opts, watchOpts) {
  return create(require('reduce-css'), opts, watchOpts)
}

exports.js = function (opts, watchOpts) {
  return create(require('reduce-js'), opts, watchOpts)
}

function create(reduce, opts, watchOpts) {
  var transforms = reduce.lazypipe()
  if (opts.transform) {
    opts.transform.forEach(function (tr) {
      transforms.pipe.apply(transforms, Array.isArray(tr) ? tr : [tr])
    })
  }
  var destOpts = opts.dest || 'build'
  transforms.pipe.apply(transforms, [reduce.dest].concat(destOpts))

  function bundle(r) {
    Object.keys(opts.on).forEach(function (evt) {
      [].concat(opts.on[evt]).forEach(function (fn) {
        r.on(evt, fn)
      })
    })
    return r.src(opts.entries, opts.reduceOpts)
  }

  function bundler() {
    return bundle(reduce).pipe(transforms())
  }

  function watch() {
    return bundle(reduce.watch(watchOpts)).pipe(transforms)
  }

  bundler.watch = watch
  return bundler
}

