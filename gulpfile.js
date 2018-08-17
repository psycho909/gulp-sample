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

var tinypng = require('gulp-tinypng-nokey');
var fs = require('fs');
var data = require('gulp-data');
var merge = require('gulp-merge-json');
var path = require('path');
var ejs = require('gulp-ejs');
var colors = require('colors');

var paths={
	"scss":"./src/scss/",
	"css":"./dist/css/",
	"pug":"./src/pug/",
	"ejs":"./src/ejs/",
	"html":"./dist/",
	"js":"./src/js/",
	"json":"./src/data/json/",
	"images":"./src/images/",
	"dist":{
		"sprite":"./dist/images/sprite/",
		"css":"./dist/css/",
		"js":"./dist/js/",
	}
}

gulp.task('tinypng',function(){
	console.log(colors.red('TINYPNG : COMPILE'))
	gulp.src('./dist/images/**/*')
	.pipe(tinypng())
	.pipe(gulp.dest('./dist/images/'))
})

gulp.task('sprite', function () {
	console.log(colors.red('SPRITE : COMPILE'))
	gulp.src(paths.images+'*.png').pipe(spritesmith({
		imgName: 'sprite.png',
		cssName: 'sprites.scss',
		cssFormat:'scss'
	}))
	.pipe(gulp.dest(paths.dist.sprite));
});

gulp.task('server', ['sass'], function() {
	console.log(colors.red('SERVER'))
	browserSync.use(htmlInjector,{
		files:paths.html+'*.html'
	})
    browserSync.init({
        server: paths.html
	});
});

gulp.task('sass',function(){
	console.log(colors.red('SASS'))
	gulp.src(paths.scss+'*.scss')
	.pipe(sass({
		outputStyle:'compressed',
		includePaths: ['./node_modules/bootstrap/scss']
	})
	.on('error',sass.logError))
	.pipe(sourcemaps.init())
	.pipe(postcss([autoprefixer()]))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest(paths.dist.css))
	.pipe(browserSync.reload({
		stream:true
	}));
})

gulp.task('json:merge',function(){
	console.log(colors.red('JSON : MERGE'))
	return gulp.src("./src/data/json/*.json")
		.pipe(plumber())
		.pipe(merge({
			fileName:"data.json",
			edit:(json,file)=>{
				
				var filename=path.basename(file.path),
				primaryKey=filename.replace(path.extname(filename),'')

				var data={};
				data[primaryKey.toUpperCase()]=json;

				return data
			}
		}))
		.pipe(gulp.dest('./src/data'))
})

// EJS
gulp.task('ejs',function(){
	console.log(colors.red("EJS : COMPILE"))
	gulp.src('./src/ejs/*.ejs')
		.pipe(plumber())
		.pipe(data(function(file){
			return JSON.parse(fs.readFileSync('./src/data/data.json'))
		}))
		.pipe(ejs({},{},{ext:".html"}))
		.pipe(gulp.dest('./dist'))
})

// PUG
gulp.task("pug",function(){
	console.log(colors.red("PUG : COMPILE"))
	gulp.src(paths.pug+'*.pug')
	.pipe(plumber())
	.pipe(data(function(file){
		return JSON.parse(fs.readFileSync('./src/data/data.json'))
	}))
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
	console.log(colors.red("ES6 : Browserify"))
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
gulp.task('watch',['server','sass'],function(){
	watch(paths.html+'*.html').on('add',function(){
		console.log("add html")
		browserSync.reload("*.html")
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

	gulp.watch(paths.html+'*.html', htmlInjector);
})
gulp.task('watch_ejs',['ejs'],function(){
	watch(paths.ejs+'*.ejs').on('add',function(){
		console.log(colors.yellow("ADD : ejs"))
		gulp.start('ejs');
	})

	watch(paths.ejs+'*.ejs').on('change',function(){
		console.log(colors.yellow("CHANGE : ejs"))
		gulp.start('ejs');
	})

	watch(paths.ejs+'includes/*.ejs').on('add',function(){
		console.log(colors.yellow("ADD INCLUDES : ejs"))
		gulp.start('ejs');
	})

	watch(paths.ejs+'includes/*.ejs').on('change',function(){
		console.log(colors.yellow("CHANGE INCLUDES : ejs"))
		gulp.start('ejs');
	})

	watch(paths.json+'*.json').on('add',function(){
		console.log(colors.yellow("ADD JSON"))
		gulp.start('json:merge');
	})
	watch(paths.json+'*.json').on('change',function(){
		console.log(colors.yellow("MERGE JSON"))
		gulp.start('json:merge');
		gulp.start('ejs');
		browserSync.reload()
	})

	gulp.watch(paths.ejs+'*.ejs', ['ejs']);
	gulp.watch(paths.ejs+'includes/*.ejs', ['ejs']);
})
gulp.task('watch_pug',['pug'],function(){
	watch(paths.pug+'*.pug').on('add',function(){
		console.log(colors.yellow("ADD : pug"))
		gulp.start('pug');
	})

	watch(paths.pug+'*.pug').on('change',function(){
		console.log(colors.yellow("CHANGE : pug"))
		gulp.start('pug');
	})

	watch(paths.pug+'includes/*.pug').on('add',function(){
		console.log(colors.yellow("ADD INCLUDES : pug"))
		gulp.start('pug');
	})

	watch(paths.pug+'includes/*.pug').on('change',function(){
		console.log(colors.yellow("CHANGE INCLUDES : pug"))
		gulp.start('pug');
	})

	watch(paths.json+'*.json').on('add',function(){
		console.log(colors.yellow("ADD JSON"))
		gulp.start('json:merge');
	})
	watch(paths.json+'*.json').on('change',function(){
		console.log(colors.yellow("MERGE JSON"))
		gulp.start('json:merge');
		gulp.start('pug');
		browserSync.reload()
	})

	gulp.watch(paths.pug+'*.pug', ['pug']);
	gulp.watch(paths.pug+'includes/*.pug', ['pug']);
})

gulp.task('default', ['server','watch']);
gulp.task('gulp_es6', ['server','watch','browserify']);
gulp.task('gulp_ejs', ['server','watch','watch_ejs','json:merge']);
gulp.task('gulp_pug', ['server','watch','watch_pug','json:merge']);