var mixy = require('mixy')

module.exports = function (opts) {
  // Options used by both reduce-js and reduce-css
  var commonOptions = mixy.pick(['paths', 'basedir'], opts)
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

  var r = { getStyle: opts.getStyle }
  var jsOpts = r.js = opts.js
  if (jsOpts !== false) {
    jsOpts = jsOpts || {}
    // All options used by reduce-js will be merged into r.js.reduce
    jsOpts.reduce = mixy.mix(
      mixy.exclude(componentFields, jsOpts),
      commonOptions,
      jsOpts.reduce
    )
    jsOpts.on = append(jsOpts.on, opts.on)
    r.js = jsOpts
  }

  var cssOpts = r.css = opts.css
  if (cssOpts !== false) {
    cssOpts = cssOpts || {}
    // All options used by reduce-css will be merged into r.css.reduce
    cssOpts.reduce = mixy.mix(
      mixy.exclude(componentFields, cssOpts),
      commonOptions,
      cssOpts.reduce
    )
    var reduceCssOpts = cssOpts.reduce
    if (reduceCssOpts.paths && typeof reduceCssOpts.resolve !== 'function') {
      reduceCssOpts.resolve = mixy.mix(
        { paths: [].concat(reduceCssOpts.paths) },
        reduceCssOpts.resolve
      )
    }
    cssOpts.on = append(cssOpts.on, opts.on)
    r.css = cssOpts
  }

  return r
}

function append(receiver, supplier) {
  receiver = receiver || {}

  mixy.each(supplier, function (v, k) {
    receiver[k] = [].concat(receiver[k], v).filter(Boolean)
  })

  return receiver
}

