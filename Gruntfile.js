module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			files: ['src/mix.js']
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
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> by <%= pkg.author %> */\n'
			},
			dist: {
				src: '<%= concat.js.dest %>',
				dest: 'build/<%= pkg.name %>.<%= pkg.version %>.min.js'
			}
		},
		watch: {
			//grunt watch:js|css
			js: {
				files: ['src/*.js'],
				tasks: ['jshint'],
			}
		}

	});

	// grunt.loadNpmTasks('grunt-regarde');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('build', ['concat:js', 'uglify']);
};