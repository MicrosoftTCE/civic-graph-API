(function (require) {

    'use strict';

    var gulp = require('gulp'),
        uglify = require('gulp-uglify'),
        cleanCss = require('gulp-clean-css'),
        concat = require('gulp-concat'),
        notify = require('gulp-notify'),
        build = 'build/',
        jsSrc = 'js/**/*.js',
        minifiedFile = 'app.min.js',
        concatConfig = {newLine: '\n;'},
        cssSrc = 'css/**/*.css',
        minifiedCss = 'app.min.css';
    
    gulp.task('js', function () {
        return gulp.src(jsSrc)
            .pipe(uglify())
            .on('error', notify.onError("Error: <%= error.message %>"))
            .pipe(concat(minifiedFile), concatConfig)
            .pipe(gulp.dest(build));
    });

    gulp.task('css', function () {
        return gulp.src(cssSrc)
            .pipe(concat(minifiedCss))
            .pipe(cleanCss())
            .pipe(gulp.dest(build));
    });

    gulp.task('default', ['js', 'css'], function () {

    });
})(require);
