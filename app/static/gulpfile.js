(function (require) {

    'use strict';

    var gulp = require('gulp'),
        uglify = require('gulp-uglify'),
        cleanCss = require('gulp-clean-css'),
        concat = require('gulp-concat'),
        notify = require('gulp-notify'),
        config = require('./gulpConfig.json'),
        minifiedFile = 'app.min.js',
        concatConfig = {newLine: '\n;'},
        minifiedCss = 'app.min.css';

    gulp.task('js', function () {
        return gulp.src(config.dev.src.js)
            // .pipe(uglify())
            // .on('error', notify.onError("Error: <%= error.message %>"))
            .pipe(concat(minifiedFile), concatConfig)
            .pipe(gulp.dest(config.dev.folder));
    });

    gulp.task('css', function () {
        return gulp.src(config.dev.src.css)
            .pipe(concat(minifiedCss))
            .pipe(cleanCss())
            .pipe(gulp.dest(config.dev.folder));
    });

    // gulp.task('watch', function() {
    //     gulp.watch([config.dev.src.js, config.dev.src.css]);
    // });

    gulp.task('default', ['js', 'css'], function () {

    });
})(require);
