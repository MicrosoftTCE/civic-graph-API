(function (require) {

    'use strict';

    var gulp = require('gulp'),
        minify = require('gulp-uglify'),
        cleanCss = require('gulp-clean-css'),
        jshint = require('gulp-jshint'),
        concat = require('gulp-concat'),
        notify = require('gulp-notify'),
        sourceMaps = require('gulp-sourcemaps'),
        config = require('./gulpConfig.json'),
        minifiedFile = 'app.min.js',
        concatConfig = {newLine: '\n;'},
        minifiedCss = 'app.min.css';

    function compileJs(cfg) {
        return gulp.src(cfg.src.js)
            .pipe(jshint())
            .pipe(jshint.reporter('fail'))
            .on('error', notify.onError("JSHint Error: <%= error.message %>"))
            .pipe(sourceMaps.init())
            .pipe(minify())
            .on('error', notify.onError("Error: <%= error.message %>"))
            .pipe(concat(minifiedFile), concatConfig)
            .pipe(sourceMaps.write())
            .pipe(gulp.dest(cfg.folder))
            .on('finish', function() { console.log("Safe to refresh"); });
    }

    function compileCss(cfg) {
        return gulp.src(cfg.src.css)
            .pipe(concat(minifiedCss))
            .pipe(cleanCss())
            .pipe(gulp.dest(cfg.folder));
    }

    gulp.task('js', function () {
        compileJs(config.dev);
    });

    gulp.task('css', function () {
        compileCss(config.dev);
    });

    // gulp.task('watch', function() {
    //     gulp.watch([config.dev.src.js, config.dev.src.css]);
    // });

    gulp.task('default', ['js', 'css'], function () {

    });
})(require);
