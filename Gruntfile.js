module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			options: {
				indent: 4,
				asi: true,
				expr: true,
				browser: true,
				strict: true,
				unused: true,
				undef: true,
				loopfunc: false,
				sub: true,
				boss: true,
				eqnull: true
			},

			files: ['src/mix.js']
		},
		jsvalidate: {
			files: ['src/*.js']
		},
		concat: {
			options: {
				separator: ';\n'
			},
			js: {
				// the files to concatenate
				src: ['src/*.js'],
				// the location of the resulting JS file
				dest: 'src/<%= pkg.name %>.<%= pkg.version %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> by <%= pkg.author %> */\n'
			},
			dist: {
				src: '<%= concat.js.dest %>',
				dest: 'lib/<%= pkg.name %>.<%= pkg.version %>.min.js'
			}
		},
		watch: {
			//grunt watch:js|css
			js: {
				files: ['src/*.js'],
				tasks: ['jshint', 'jsvalidate'],
			}
		}

	});

	// grunt.loadNpmTasks('grunt-regarde');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-jsvalidate');

	grunt.registerTask('build', ['concat:js', 'uglify']);
	grunt.registerTask('default', ['jsvalidate','jshint']);
};