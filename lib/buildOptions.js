var mixy = require('mixy')

// Options used by reduce-web-component
var componentFields = [
  // first argument passed to reduce-js or reduce-css
  'entries',
  // second argument passed to reduce-js or reduce-css
  'reduce',
  // arguments passed to `reduce.dest`
  'dest',
  // transforms applied to the stream created by `bundle()`
  'postTransform',
]

module.exports = function (opts) {
  var r = { getStyle: opts.getStyle }

  r.js = opts.js
  if (r.js !== false) {
    r.js = buildJs(r.js, opts)
  }

  r.css = opts.css
  if (r.css !== false) {
    r.css = buildCss(r.css, opts)
  }

  return r
}

function buildCss(opts, parent) {
  opts = opts || {}
  // All options used by reduce-css will be merged into r.css.reduce
  var reduceOpts = opts.reduce = mixy.mix(
    { basedir: parent.basedir },
    mixy.exclude(componentFields, opts),
    opts.reduce,
    {
      paths: [].concat(
        opts.reduce && opts.reduce.paths,
        opts.paths,
        parent.paths
      ).filter(Boolean),
    }
  )

  if (typeof reduceOpts.resolve !== 'function') {
    reduceOpts.resolve = mixy.mix(
      {},
      reduceOpts.resolve,
      {
        paths: [].concat(
          reduceOpts.resolve && reduceOpts.resolve.paths,
          reduceOpts.paths
        ).filter(Boolean),
      }
    )
  }
  opts.on = append(opts.on, parent.on)

  if (opts.postcss !== false) {
    opts.on = append(opts.on, {
      instance: function (b) {
        b.plugin(require('reduce-css-postcss'), {
          processorFilter: function (pipeline) {
            pipeline.get('postcss-simple-import').push({
              resolve: reduceOpts.resolve,
            })
            if (typeof opts.postcss === 'function') {
              opts.postcss(pipeline)
            } else {
              pipeline.push.apply(
                pipeline,
                [].concat(opts.postcss).filter(Boolean)
              )
            }
          },
        })
      },
    })
  }

  return opts
}

function buildJs(opts, parent) {
  opts = opts || {}
  // All options used by reduce-js will be merged into r.js.reduce
  opts.reduce = mixy.mix(
    { basedir: parent.basedir },
    mixy.exclude(componentFields, opts),
    opts.reduce,
    {
      paths: [].concat(
        opts.reduce && opts.reduce.paths,
        opts.paths,
        parent.paths
      ).filter(Boolean),
    }
  )
  opts.on = append(opts.on, parent.on)

  return opts
}

function append(receiver, supplier) {
  receiver = receiver || {}

  mixy.each(supplier, function (v, k) {
    receiver[k] = [].concat(receiver[k], v).filter(Boolean)
  })

  return receiver
}

