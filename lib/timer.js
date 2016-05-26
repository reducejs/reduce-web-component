var through = require('./through')

module.exports = function () {
  var b = this
  var time = Date.now()
  var bytes = 0

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

  return through(write, end)
}

