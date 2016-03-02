'use strict'

const mixy = require('mixy')

exports.css = function (opts, extra) {
  opts = opts || {}
  extra = extra || {}

  let reduceOpts = opts.reduce = mixy.mix(
    { cache: {}, packageCache: {} },
    extra.reduce, opts.reduce, {
      paths: [].concat(
        opts.reduce && opts.reduce.paths,
        extra.reduce && extra.reduce.paths
      ).filter(Boolean),
    }
  )

  if (typeof reduceOpts.resolve !== 'function') {
    reduceOpts.resolve = mixy.mix(
      {}, reduceOpts.resolve, {
        paths: [].concat(
          reduceOpts.resolve && reduceOpts.resolve.paths,
          reduceOpts.paths
        ).filter(Boolean),
      }
    )
  }

  if (reduceOpts.postcss !== false) {
    reduceOpts.plugin = [].concat(reduceOpts.plugin).filter(Boolean)
    reduceOpts.plugin.push([
      require('reduce-css-postcss'),
      {
        processorFilter: function (pipeline) {
          pipeline.get('postcss-simple-import').push({
            resolve: reduceOpts.resolve,
          })

          if (typeof opts.postcss === 'function') {
            return opts.postcss(pipeline)
          }

          pipeline.push.apply(pipeline, [].concat(opts.postcss).filter(Boolean))
        },
      },
    ])
  }

  opts.on = append(opts.on, extra.on)

  /**
   * opts.entries: `String`, `Array` patterns
   * opts.reduce: `Object` options for depsify
   * opts.dest: options passed to `reduce.dest`
   * opts.bundleOptions: options passed to `reduce.bundle`
   * opts.postTransform: transforms applied to `reduce.bundle()`
   * opts.on: event listeners to be attached to `b`
   *
   */
  return opts
}

exports.js = function (opts, extra) {
  opts = opts || {}
  extra = extra || {}

  opts.reduce = mixy.mix(
    { cache: {}, packageCache: {} },
    extra.reduce, opts.reduce, {
      paths: [].concat(
        opts.reduce && opts.reduce.paths,
        extra.reduce && extra.reduce.paths
      ).filter(Boolean),
    }
  )
  opts.on = append(opts.on, extra.on)

  /**
   * opts.entries: patterns for locating entries
   * opts.reduce: options for browserify
   * opts.dest: options passed to `reduce.dest`
   * opts.bundleOptions: options passed to `reduce.bundle`
   * opts.postTransform: transforms applied to `reduce.bundle()`
   * opts.on: event listeners to be attached to `b`
   *
   */
  return opts
}

function append(receiver, supplier) {
  receiver = receiver || {}

  mixy.each(supplier, function (v, k) {
    receiver[k] = [].concat(receiver[k], v).filter(Boolean)
  })

  return receiver
}

