'use strict';

const browserSync  = require( 'browser-sync' ).create();

const postcss      = require( 'gulp-postcss' );
const autoprefixer = require( 'autoprefixer' );
const mqpacker     = require( 'css-mqpacker' );
const csswring     = require( 'csswring' );

const gulp         = require( 'gulp' );
const concat       = require( 'gulp-concat' );
const consolidate  = require( 'gulp-consolidate' );
const iconfont     = require( 'gulp-iconfont' );
const plumber      = require( 'gulp-plumber' );
const rename       = require( 'gulp-rename' );
const sass         = require( 'gulp-sass' );
const uglify       = require( 'gulp-uglify' );

const runSequence  = require( 'run-sequence' ).use( gulp );


const AUTOPREFIXER_BROWSERS = {
	browsers: [
		'ie >= 9',
		'safari >= 7',
		'ios >= 7',
		'android >= 4'
	]
};


gulp.task( 'browser-sync', () => {

	browserSync.init({
		server: {
			baseDir: './',
			directory: true
		}
	} );

} );


gulp.task( 'sass', () => {

	const processors = [
		autoprefixer( AUTOPREFIXER_BROWSERS ),
		mqpacker,
		csswring
	];

	return gulp.src( './assets/css/src/style.scss' )
		.pipe( plumber() )
		.pipe( sass() )
		.pipe( postcss( processors ) )
		.pipe( gulp.dest( './assets/css/' ) )

} );


gulp.task( 'iconfont', () => {

	const fontName = 'icon';
	const runTimestamp = ( Date.now() * 0.001 ) | 0;

	return gulp.src( [ './assets/fonts/' + fontName + '/*.svg' ] )
		.pipe( iconfont( {
			fontName: fontName,
			prependUnicode: true,
			formats: [ 'ttf', 'eot', 'woff' ],
			timestamp: runTimestamp,
		} ) ) 
		.on( 'glyphs', function ( glyphs, options ) {

			gulp.src( './assets/fonts/' + fontName + '/_icon.scss' )
				.pipe( consolidate( 'underscore', {
					glyphs: glyphs,
					fontName: fontName,
					fontPath: '../fonts/',
					className: 'NS-' + fontName
				} ) )
				.pipe ( gulp.dest( './assets/css/src/' ) )

		} )
		.pipe( gulp.dest( './assets/fonts/' ) );

} );


gulp.task( 'js', () => {

	const srcFile  = ['./assets/js/src/**/*.js'];
	const destFile = './assets/js';
	const fileName = 'app.js';

	return gulp.src( srcFile )
	.pipe( plumber() )
	.pipe( concat( fileName ) )
	.pipe( uglify() )
	.pipe( gulp.dest( destFile ) );

} );


gulp.task( 'watch', () => {

	gulp.watch( [ './**/*.html' ], [ browserSync.reload ] );
	gulp.watch( [ './assets/css/src/*.scss' ], ['sass', browserSync.reload ] );

} );

gulp.task( 'default', function ( callback ) {

	runSequence( 'build', 'watch', 'browser-sync', callback );

} );

gulp.task( 'build', function ( callback ) {

	runSequence( 'iconfont', 'sass', 'js', callback );

} );
