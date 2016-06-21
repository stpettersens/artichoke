'use strict'

const gulp = require('gulp')
const mocha = require('gulp-mocha')
const clean = require('gulp-rimraf')
const wait = require('gulp-wait')
const file = require('gulp-file')
const sequence = require('gulp-sequence')
const glob = require('glob')

gulp.task('files', function () {
  return gulp.src('*')
  .pipe(file('control.tar.gz', ''))
  .pipe(file('data.tar.gz', ''))
  .pipe(file('debian-binary', ''))
  .pipe(gulp.dest('.'))
  .pipe(wait(30000))
})

gulp.task('list', function () {
  console.log(glob.sync('*'))
})

gulp.task('test1', function () {
  return gulp.src(['control.tar.gz', 'data.tar.gz', 'debian-binary'])
  .pipe(clean())
})

gulp.task('test2', function () {
  return gulp.src('artichoke.test.js')
  .pipe(mocha({reporter: 'min', timeout: 100000}))
})

gulp.task('clean', ['test1'])
gulp.task('test', sequence('test1', 'test2'))
gulp.task('appveyor_test', sequence('files', 'list')) //, 'test2'))
