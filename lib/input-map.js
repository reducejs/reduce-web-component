var fs = require('fs')
var os = require('os')
var net = require('net')
var path = require('path')
var shasum = require('shasum')
var multimatch = require('multimatch')
var concat = require('concat-stream')

var through = require('./through')
var Options = require('./options')
var reduce = require('./reduce')

var tmpdir = os.tmpdir()

function fromObj(input, opts) {
  var ret = {}
  function add(_, map) {
    ret[this._type] = map
  }
  opts = Options.addListener(opts, 'common.map', add)
  opts = Options.create(opts)
  addEmptify(opts.js)
  addEmptify(opts.css)
  return reduce(opts).then(() => filter(ret, input))
}

function filter(o, input) {
  var ret = {}
  if (o.js) {
    multimatch(Object.keys(o.js), input)
    .forEach(k => { ret[k] = o.js[k] })
  }
  if (o.css) {
    multimatch(Object.keys(o.css), input)
    .forEach(k => { ret[k] = o.css[k] })
  }
  return ret
}

function addEmptify(opts) {
  opts = opts || {}
  opts.plugin = opts.plugin || []
  opts.plugin.unshift(emptify)
  return opts
}

function emptify() {
  return through(function (file, _, next) {
    file.contents = null
    next(null, file)
  })
}

function getDeps(input, opts, id) {
  return new Promise(function (resolve, reject) {
    if (typeof opts === 'string') {
      id = id || opts
      opts = require(path.resolve(opts))
    }

    var build = function () {
      fromObj(input, opts).then(resolve, reject)
    }
    if (!id) {
      return build()
    }

    var sockPath = getSockPath(id)
    var sock = new net.Socket()
    sock.on('error', build)
    sock.connect(sockPath, function () {
      sock.write(JSON.stringify(input))
    })
    sock.pipe(concat(function (buf) {
      resolve(JSON.parse(buf.toString('utf8')))
    }))
  })
}

function getSockPath(id) {
  var sockPath = path.join(
    tmpdir,
    'reduce-watch-' + shasum(id).slice(0, 7)
  )
  if (process.platform === 'win32') {
    // on Windows, use a named pipe, convert sockPath into a valid pipe name
    // based on https://gist.github.com/domenic/2790533
    sockPath = sockPath.replace(/^\//, '')
    sockPath = sockPath.replace(/\//, '-')
    sockPath = '\\\\.\\pipe\\' + sockPath
  }
  return sockPath
}

function createServer(id, opts) {
  var data = {}
  Options.addListener(opts, 'common.map', function (_, inputMap) {
    data[this._type] = inputMap
  })

  var sockPath = getSockPath(id)
  try {
    fs.accessSync(sockPath)
    fs.unlinkSync(sockPath)
  } catch (e) {
  }
  var server = net.createServer()
  server.listen(sockPath)
  server.once('listening', function () {
    console.log('listening socket path:', sockPath)
  })
  server.on('connection', function (sock) {
    sock.on('data', function (buf) {
      var pat = JSON.parse(buf.toString('utf8'))
      var ret = filter(data, pat)
      sock.end(JSON.stringify(ret))
    })
  })
}

module.exports = {
  createServer,
  getDeps,
}

