'use strict'

const gulp = require('gulp')
const mocha = require('gulp-mocha')
const clean = require('gulp-rimraf')
const wait = require('gulp-wait')
const sequence = require('gulp-sequence')

gulp.task('test1', function () {
  return gulp.src(['control.tar.gz', 'data.tar.gz', 'debian-binary'])
  .pipe(clean())
  .pipe(wait(1500))
})

gulp.task('test2', function () {
  return gulp.src('artichoke.test.js')
  .pipe(mocha({reporter: 'min', timeout: 100000}))
})

gulp.task('clean', ['test1'])
gulp.task('test', sequence('test1', 'test2'))
