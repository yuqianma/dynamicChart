var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var babel = require('gulp-babel');

gulp.task('build', function() {
  return gulp.src('src/*.es')
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(gulp.dest('public'));
})

gulp.task('build-watch', ['build'], function(){
  browserSync.reload();
  console.log('build-watch run');
});

gulp.task('serve', ['build'], function() {

    browserSync.init({
        proxy: {
          target: "127.0.0.1:3000",
          ws: true
        }
    });

    gulp.watch('src/*.es', ['build-watch']);
    gulp.watch(['*.html', 'public/*.css']).on('change', browserSync.reload);
});

gulp.task('default', ['serve']);
