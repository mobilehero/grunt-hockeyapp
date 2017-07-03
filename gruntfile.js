'use strict';


module.exports = function (grunt) {
	var file = grunt.option('file');
	var token = grunt.option('token');
  // Project configuration.
	grunt.initConfig({

    // Before generating any new files, remove any previously-created files.
		clean: { tests: [ 'tmp' ]  },

    // Configuration to be run (and then tested).
		hockeyapp: {
			options: { token: token  },
			ios:     { file: file  },
		},


	});

  // Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-clean');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
	grunt.registerTask('test', [ 'clean', 'hockeyapp' ]);

  // By default, lint and run all tests.
  // grunt.registerTask('default', ['jshint', 'test']);

};
