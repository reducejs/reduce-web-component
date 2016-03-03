var gulp = require('gulp')
var reduce = require('..')

var bundler = reduce(require('./reduce.config'))

gulp.task('clean', function () {
  var del = require('del')
  return del('build')
})

gulp.task('build', ['clean'], bundler)
gulp.task('watch', ['clean'], function (cb) {
  bundler.watch()
    .on('close', cb)
    .on('done', () => console.log('-'.repeat(80)))
})

