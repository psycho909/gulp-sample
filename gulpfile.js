var gulp=require('gulp'),
	sass=require('gulp-sass'),
	browserSync=require('browser-sync').create(),
	babelify=require('babelify'),
	babel=require('gulp-babel'),
	spritesmith = require('gulp.spritesmith'),
	autoprefixer=require('autoprefixer'),
	browserify=require('browserify'),
	sourcemaps=require('gulp-sourcemaps'),
	postcss=require('gulp-postcss'),
	source=require('vinyl-source-stream'),
	buffer=require('vinyl-buffer'),
	stringify=require('stringify'),
	uglify=require('gulp-uglify'),
	watch=require('gulp-watch'),
	plumber=require('gulp-plumber'),
	pug=require('gulp-pug'),
	htmlInjector = require("bs-html-injector");

var paths={
	"scss":"./src/scss/",
	"css":"./dist/css/",
	"pug":"./src/pug/",
	"html":"./dist/",
	"js":"./src/js/",
	"images":"./src/images/",
	"dist":{
		"sprite":"./dist/images/sprite/",
		"css":"./dist/css/",
		"js":"./dist/js/",
	}
}

gulp.task('sprite', function () {
	gulp.src(paths.images+'*.png').pipe(spritesmith({
		imgName: 'sprite.png',
		cssName: 'sprites.scss',
		cssFormat:'scss'
	}))
	.pipe(gulp.dest(paths.dist.sprite));
});

gulp.task('server', ['sass'], function() {
	console.log('server')
	browserSync.use(htmlInjector,{
		files:paths.html+'*.html'
	})
    browserSync.init({
        server: paths.html
	});
});

gulp.task('watch',['server','sass','pug'],function(){

	watch(paths.html+'*.html').on('add',function(){
		console.log("add html")
		browserSync.reload("*.html")
	})

	watch(paths.pug+'*.pug').on('add',function(){
		console.log("add : pug")
		gulp.start('pug');
	})

	watch(paths.pug+'*.pug').on('change',function(){
		console.log("change : pug")
		gulp.start('pug');
	})

	watch(paths.pug+'includes/*.pug').on('add',function(){
		console.log("add includes : pug")
		gulp.start('pug');
	})

	watch(paths.pug+'includes/*.pug').on('change',function(){
		console.log("change includes : pug")
		gulp.start('pug');
	})

	watch(paths.scss+'*.scss').on('change',function(){
		console.log("change sass")
		gulp.start('sass');
	})

	watch(paths.js+'*.js').on('change',function(){
		console.log("change js")
		gulp.start('browserify');
		browserSync.reload()
	})

	gulp.watch(paths.pug+'*.pug', ['pug']);
	gulp.watch(paths.pug+'includes/*.pug', ['pug']);
	gulp.watch(paths.html+'*.html', htmlInjector);
})

gulp.task('sass',function(){
	gulp.src(paths.scss+'*.scss')
	.pipe(sass({
		outputStyle:'compressed',
		includePaths: ['./node_modules/bootstrap/scss']
	})
	.on('error',sass.logError))
	.pipe(sourcemaps.init())
	.pipe(postcss([autoprefixer({
		browsers :[
			"> 1%",
			"last 7 versions",
			"Firefox >= 45",
			"ios >= 8",
			"Safari >= 8",
			"ie >= 8"
		]
	})]))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest(paths.dist.css))
	.pipe(browserSync.reload({
		stream:true
	}));
})

gulp.task("pug",function(){
	console.log("pug:compile")
	gulp.src(paths.pug+'*.pug')
	.pipe(plumber())
	.pipe(pug({
		pretty:true
	}))
	.pipe(gulp.dest(paths.html))
	.pipe(browserSync.reload({stream: true}))
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
	console.log("browserify")
	browserify({
		entries:[paths.js+'app.js'],
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
	.pipe(gulp.dest(paths.dist.js))
	.pipe(browserSync.reload({
		stream:true
	}));

})
gulp.task('default', ['server','watch','browserify','pug']);