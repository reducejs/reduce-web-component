const gulp = require('gulp')
const reduce = require('reduce-web-component')
const options = require('./reduce.config.js')
const del = require('del')

gulp.task('clean', () => {
  return del('build')
})

gulp.task('build', ['clean'], () => {
  return reduce.bundle(options)
})
gulp.task('watch', ['clean'], function (cb) {
  reduce.watch(options)
    .on('close', cb)
    .on('done', () => console.log('-'.repeat(40)))
})
