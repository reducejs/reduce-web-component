var gulp = require('gulp')
var reduce = require('..')
var path = require('path')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')
var resolver = require('custom-resolve')
var promisify = require('node-promisify')
var styleResolve = promisify(resolver({
  main: 'style',
  extensions: '.css',
  moduleDirectory: ['web_modules', 'node_modules'],
}))

gulp.task('clean', function () {
  var del = require('del')
  return del('build')
})

var helloWorld = reduce({
  getStyle: function (jsFile) {
    if (jsFile.indexOf(fixtures('page') + '/') === 0) {
      return path.dirname(jsFile) + '/index.css'
    }
    var prefix = fixtures('web_modules') + '/'
    if (jsFile.indexOf(prefix) === 0) {
      return styleResolve(jsFile.slice(prefix.length).split('/')[0], {
        filename: jsFile,
      })
    }
  },
  js: {
    entries: '**/*.js',
    opts: {
      basedir: fixtures('page'),
      paths: [fixtures('web_modules')],
      factor: {
        common: 'common.js',
        needFactor: true,
      },
    },
    dest: 'build/js',
  },
  css: {
    opts: {
      atRuleName: 'external',
      basedir: fixtures('page'),
      factor: {
        entries: [
          fixtures('page', 'hello', 'index.css'),
          fixtures('page', 'hi', 'index.css'),
        ],
        common: 'common.css',
      },
      resolve: styleResolve,
    },
    dest: 'build/css',
  },
})

var log = console.log.bind(console)

gulp.task('bundle', ['clean'], helloWorld)

gulp.task('watch', ['clean'], function () {
  helloWorld.watch()
    .on('log', log)
    .on('error', function (err) {
      log(err.stack)
    })
})

