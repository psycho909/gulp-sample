var gulp=require('gulp'),
	sass=require('gulp-sass'),
	browserSync=require('browser-sync').create(),
	notify=require('gulp-notify'),
	babelify=require('babelify'),
	babel=require('gulp-babel'),
	spritesmith = require('gulp.spritesmith'),
	autoprefixer=require('gulp-autoprefixer'),
	browserify=require('browserify'),
	sourcemaps=require('gulp-sourcemaps'),
	source=require('vinyl-source-stream'),
	buffer=require('vinyl-buffer'),
	stringify=require('stringify'),
	uglify=require('gulp-uglify');

gulp.task('sprite', function () {
	gulp.src('src/images/*.png').pipe(spritesmith({
		imgName: 'sprite.png',
		cssName: 'sprites.scss',
		cssFormat:'scss'
	}))
	.pipe(gulp.dest('./dist/images/sprite/'));
});

gulp.task('server', ['sass'], function() {
    browserSync.init({
        server: "./dist/"
    });
});

gulp.task('watch',function(){
	gulp.watch('./src/scss/*.scss',['sass']);
	//gulp.watch('./src/js/*.js',['build']);
	gulp.watch('./src/js/*.js',['browserify']);
	// gulp.watch('./src/js/*.html',['browserify']);
	gulp.watch('./src/js/*.js').on('change',browserSync.reload);
	gulp.watch('./dist/*.html').on('change',browserSync.reload);
})

gulp.task('sass',function(){
	gulp.src('./src/scss/*.scss')
	.pipe(sass({
		//outputStyle:'compressed',
		includePaths: ['./node_modules/bootstrap/scss']
	})
	.on('error',sass.logError))
	.pipe(autoprefixer({
		browsers:['last 2 versions','> 5%','not ie <= 8']
	}))
	.pipe(gulp.dest('./dist/css'))
	.pipe(browserSync.reload({
		stream:true
	}));
})

// gulp.task('build',function(){
// 	gulp.src('./src/js/app.js')
// 	.pipe(babel({
// 		presets:['env']
// 	}))
// 	.on('error',console.error.bind(console))
// 	.pipe(gulp.dest('./dist/js'))
// 	.pipe(browserSync.stream());
// })
gulp.task('browserify',function(){
	browserify({
		entries:['./src/js/app.js'],
		debug:true
	})
	.transform('babelify',{presets:['env']})
	.transform(stringify(['.html']))
	.bundle()
	.on('error',function(err){
		console.log(err.message)
		this.emit('end')
	})
	.pipe(source('app.js'))
	.pipe(buffer())
	.pipe(uglify())
	// .pipe(sourcemaps.init({loadMaps:true}))
	// .pipe(sourcemaps.write('.'))
	.pipe(gulp.dest('./dist/js'))
	.pipe(browserSync.reload({
		stream:true
	}));
	//.pipe(notify({ message: 'browserify task complete' }));

})
gulp.task('default', ['server','watch','browserify']);