var {src,dest,parallel,series,watch}=require('gulp'),
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

function sprite(){
	console.log(colors.red('SPRITE : COMPILE'))
	return src(paths.images+'*.png').pipe(spritesmith({
			imgName: 'sprite.png',
			cssName: 'sprites.scss',
			cssFormat:'scss'
		}))
		.pipe(dest(paths.dist.sprite));
}

function tinypngImg(){
	console.log(colors.red('TINYPNG : COMPILE'))
	return src('./dist/images/**/*')
	.pipe(tinypng())
	.pipe(dest('./dist/images/'))
}

function sassToCss(){
	console.log(colors.red('SASS'))
	return src(paths.scss+'*.scss')
	.pipe(sass({
		includePaths: ['./node_modules/bootstrap/scss']
	})
	.on('error',sass.logError))
	.pipe(sourcemaps.init())
	.pipe(postcss([autoprefixer()]))
	.pipe(sourcemaps.write('.'))
	.pipe(dest(paths.dist.css))
	.pipe(browserSync.reload({
		stream:true
	}));
}

function server(){
	console.log(colors.red('SERVER'))
	browserSync.use(htmlInjector,{
		files:paths.html+'*.html'
	})
    browserSync.init({
        server: paths.html
	});
}

function watchHTML(){
	watch(paths.html+'*.html').on('add',function(){
		console.log("add html")
		browserSync.reload("*.html")
	})
}

function watchingSass(){
	watch(paths.scss+'*.scss',parallel(sassToCss)).on('change',function(){
		browserSync.reload()
	})
}

const watchSass=parallel(server,watchHTML,watchingSass);

function jsonMerge(){
	console.log(colors.red('JSON : MERGE'))
	return src("./src/data/json/*.json")
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
		.pipe(dest('./src/data'))
}

// EJS
function ejsToHtml(){
	console.log(colors.red("EJS : COMPILE"))
	return src('./src/ejs/*.ejs')
		.pipe(plumber())
		.pipe(data(function(file){
			return JSON.parse(fs.readFileSync('./src/data/data.json'))
		}))
		.pipe(ejs({},{},{ext:".html"}))
		.pipe(dest('./dist'))
}

function watchingEJS(){
	watch(paths.ejs+'*.ejs',parallel(ejsToHtml)).on('add',function(){
		console.log(colors.yellow("ADD : ejs"))
	})

	watch(paths.ejs+'*.ejs',parallel(ejsToHtml)).on('change',function(){
		console.log(colors.yellow("CHANGE : ejs"))
	})

	watch(paths.ejs+'includes/*.ejs',parallel(ejsToHtml)).on('add',function(){
		console.log(colors.yellow("ADD INCLUDES : ejs"))
	})

	watch(paths.ejs+'includes/*.ejs',parallel(ejsToHtml)).on('change',function(){
		console.log(colors.yellow("CHANGE INCLUDES : ejs"))
	})

	watch(paths.json+'*.json',parallel(jsonMerge)).on('add',function(){
		console.log(colors.yellow("ADD JSON"))
	})
	watch(paths.json+'*.json',parallel(ejsToHtml,jsonMerge)).on('change',function(){
		console.log(colors.yellow("MERGE JSON"))
		browserSync.reload()
	})
}
const watchEJS=parallel(server,watchingEJS,watchingSass);

// PUG
function pugToHtml(){
	console.log(colors.red("PUG : COMPILE"))
	return src(paths.pug+'*.pug')
	.pipe(plumber())
	.pipe(data(function(file){
		return JSON.parse(fs.readFileSync('./src/data/data.json'))
	}))
	.pipe(pug({
		pretty:true
	}))
	.pipe(dest(paths.html))
	.pipe(browserSync.reload({stream: true}))
}

function watchingPug(){
	watch(paths.pug+'*.pug',parallel(pugToHtml)).on('add',function(){
		console.log(colors.yellow("ADD : pug"))
	})

	watch(paths.pug+'*.pug',parallel(pugToHtml)).on('change',function(){
		console.log(colors.yellow("CHANGE : pug"))
	})

	watch(paths.pug+'includes/*.pug',parallel(pugToHtml)).on('add',function(){
		console.log(colors.yellow("ADD INCLUDES : pug"))
	})

	watch(paths.pug+'includes/*.pug',parallel(pugToHtml)).on('change',function(){
		console.log(colors.yellow("CHANGE INCLUDES : pug"))
	})

	watch(paths.json+'*.json',parallel(jsonMerge)).on('add',function(){
		console.log(colors.yellow("ADD JSON"))
	})
	watch(paths.json+'*.json',parallel(jsonMerge,pugToHtml)).on('change',function(){
		console.log(colors.yellow("MERGE JSON"))
		browserSync.reload()
	})
}

const watchPug=parallel(server,watchingPug,watchingSass);


function browserifyJS(){
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
	.pipe(dest(paths.dist.js))
	.pipe(browserSync.reload({
		stream:true
	}));
}

function js(){
	console.log(colors.red('JS'))
	return src(paths.js+'app.js')
		.pipe(babel({
			presets:["@babel/preset-env"]
		}))
		.pipe(dest(paths.dist.js))
}


exports.sprite=sprite;
exports.tinypng=tinypngImg;
exports.js=js;
exports.sass=sassToCss;
exports.pug=pugToHtml;
exports.ejs=ejsToHtml;
exports.jsonMerge=jsonMerge;

exports.watchSass=watchSass;
exports.watchPug=watchPug;
exports.watchEJS=watchEJS;

// gulp.task('gulp_es6', ['server','watch','browserify']);
// gulp.task('gulp_pug', ['server','watch','watch_pug','json:merge']);