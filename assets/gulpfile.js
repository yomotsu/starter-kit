'use strict';

const browserSync  = require( 'browser-sync' ).create();

const gulp         = require( 'gulp' );

// js bundler
const webpack      = require( 'webpack' );

// sass and postcss
const sass         = require( 'gulp-sass' );
const postcss      = require( 'gulp-postcss' );
const autoprefixer = require( 'autoprefixer' );
const mqpacker     = require( 'css-mqpacker' );
const csswring     = require( 'csswring' );

// icon fonts
const consolidate  = require( 'gulp-consolidate' );
const iconfont     = require( 'gulp-iconfont' );

const runSequence  = require( 'run-sequence' ).use( gulp );

const isProd = ( process.env.NODE_ENV === 'production' );
const browserslist = [
  "last 2 versions",
  "ie >= 11",
  "safari >= 8",
  "ios >= 8",
  "android >= 4"
];

const webpackConfig = {
	watch: ! isProd,
	resolve: {
		alias: {}
	},
	entry: {
		bundle: __dirname + '/js/src/main.js'
	},
	output: {
		path:  __dirname + '/js/',
		filename: '[name].js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: [ [
								'es2015',
								{
									'targets': { 'browsers': browserslist },
									'loose': true,
									'modules': false
								}
							] ],
							plugins: [
								'transform-proto-to-assign',
								'transform-object-assign'
							]
						}
					}
				]
			}
		]
	},
	devtool: '#eval-source-map'
}

if ( !isProd ) {

	delete webpackConfig.devtool;

	webpackConfig.plugins = ( webpackConfig.plugins || [] ).concat( [
		new webpack.DefinePlugin( {
			'process.env': { NODE_ENV: '"production"' }
		} ),
		new webpack.optimize.UglifyJsPlugin( {
			sourceMap: true,
			compress: { warnings: false }
		} ),
		new webpack.LoaderOptionsPlugin( {
			minimize: true
		} )
	] );

}


gulp.task( 'browser-sync', () => {

	browserSync.init( {
		server: {
			baseDir: '../',
			directory: true
		},
		startPath: './'
	} );

} );


gulp.task( 'webpack', ( done ) => {

	webpack( webpackConfig, ( error, status ) => {

		const time = ( status.endTime - status.startTime ) * 0.001;
		console.log( 'webpack after', time.toFixed( 2 ) + ' sec' );
		browserSync.reload();
		done();

	} );

} );


gulp.task( 'sass', () => {

	const processors = [
		autoprefixer( browserslist ),
		mqpacker,
		csswring
	];

	return gulp.src( './css/src/main.scss' )
		.pipe( sass() )
		.on( 'error', function ( err ) {

			console.log( err.messageFormatted );
			this.emit( 'end' );

		} )
		.pipe( postcss( processors ) )
		.pipe( gulp.dest( './css/' ) );

} );


gulp.task( 'iconfont', () => {

	const fontName = 'Icon';
	const runTimestamp = ( Date.now() * 0.001 ) | 0;

	return gulp.src( [ './icons/src/*.svg' ] )
		.pipe( iconfont( {
			fontName: fontName,
			prependUnicode: true,
			formats: [ 'ttf', 'woff' ],
			timestamp: runTimestamp,
		} ) ) 
		.on( 'glyphs', function ( glyphs, options ) {

			gulp.src( './icons/src/_icon.scss' )
				.pipe( consolidate( 'underscore', {
					glyphs: glyphs,
					fontName: fontName,
					fontPath: './',
					className: fontName
				} ) )
				.pipe ( gulp.dest( './css/src/' ) ) // scssファイル出力場所

		} )
		.pipe( gulp.dest( './icons/' ) ); // fontファイル出力場所

} );


gulp.task( 'watch', () => {

	gulp.watch( [ '../index.html' ], () => {
		browserSync.reload();
	} );

	gulp.watch( [ './css/**/*.scss' ], () => {
		runSequence( 'sass', browserSync.reload );
	} );

} );


gulp.task( 'build', ( callback ) => {

	return runSequence( 'iconfont', [ 'sass', 'webpack' ], callback );

} );

gulp.task( 'default', ( callback ) => {

	return runSequence( [ 'browser-sync', 'watch' ], 'iconfont', [ 'sass', 'webpack' ], callback );

} );
