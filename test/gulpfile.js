var gulp = require('gulp');
var templater = require('gulp-templater');


gulp.task('create_template', function() {
    gulp.src([
            './_source/pages/**.html'
        ])
        .pipe(templater({
            layout: "_source/layout/index.html",
            dist: "public",
            source: "_source/pages",
            partials: "_source/partials"
        }));
});


gulp.task('default', ['create_template']);