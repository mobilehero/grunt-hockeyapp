
'use strict';

var fs = require('fs');

var _ = require('lodash');
var FormData = require('form-data');

var NOTES_TYPE = {
	'textile':  '0',
	'markdown': '1',
};
var NOTIFY = {
	'none':    '0',
	'testers': '1',
	'all':     '2',
};
var MANDATORY_TYPE = {
	'not mandatory': '0',
	'mandatory':     '1',
};
var RELEASE_TYPE = {
	beta:       '0',
	store:      '1',
	alpha:      '2',
	enterprise: '3',
};
var STATUS_TYPE = {
	false: '1',
	true:  '2',
};
var HOCKEY_APP_HOST = 'rink.hockeyapp.net';
var HOCKEY_APP_PATH = '/api/2/apps/';
var HOCKEY_APP_PROTOCOL = 'https:';

module.exports = function (grunt) {
	grunt.registerMultiTask('hockeyapp', 'Grunt plugin for uploading apps via the hockeyapp rest api.', function () {
		var done = this.async();
		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			buildServerUrl: null,
			commitSha:      null,
			downloadable:   false,
			mandatory:      'not mandatory',
			notes_file:     null,
			notes:          null,
			notesType:      0,
			notify:         'none',
			onDone:         function (response) {},
			private:        false,
			releaseType:    'beta',
			repositoryUrl:  null,
			tags:           null,
			teams:          null,
			token:          null,
			resource:       null,
			users:          null,
		});

		grunt.log.write('options ' + JSON.stringify(options, null, 2));

		var hasError = false;
		if (!this.data.file) {
			grunt.log.error('Missing required parameter: file');
			hasError = true;
		}

		if (!options.token) {
			grunt.log.error('Missing required option: token');
			hasError = true;
		}

		if (!options.resource) {
			grunt.log.error('Missing required option: resource');
			hasError = true;
		}

		if (hasError) {
			return done(false);
		}

		var form = new FormData();

		if (options.buildServerUrl !== null) {
			form.append('build_server_url', options.buildServerUrl);
		}

		if (options.commitSha !== null) {
			form.append('commit_sha', options.commitSha);
		}

		if (options.downloadable !== null) {
			form.append('status', STATUS_TYPE[options.downloadable]);
		}

		form.append('mandatory', MANDATORY_TYPE[options.mandatory]);

		if (options.notes_file !== null) {
			form.append('notes', grunt.file.read(options.notes_file));
			form.append('notes_type', NOTES_TYPE[options.notesType]);
		} else if (options.notes !== null) {
			form.append('notes', options.notes);
			form.append('notes_type', NOTES_TYPE[options.notesType]);
		}

		if (options.notify) {
			form.append('notify', NOTIFY[options.notify]);
		}
		form.append('private', String(options.private));
		form.append('release_type', RELEASE_TYPE[options.releaseType]);

		if (options.repositoryUrl !== null) {
			form.append('repository_url', options.repositoryUrl);
		}

		if (options.tags !== null) {
			formAppendArray(form, 'tags', options.tags);
		}
		if (options.teams !== null) {
			formAppendArray(form, 'teams', options.teams);
		}
		if (options.users !== null) {
			formAppendArray(form, 'users', options.users);
		}


		// Append required fiels
		form.append('ipa', fs.createReadStream(this.data.file));
		if (this.data.mapping) {
			form.append('dsym', fs.createReadStream(this.data.mapping));
		}

		grunt.log.write('form = ' + form);

		var path = HOCKEY_APP_PATH + options.resource;
		grunt.log.write('Uploading to ' + path + '...');
		form.submit({
			host:     HOCKEY_APP_HOST,
			path:     path,
			protocol: HOCKEY_APP_PROTOCOL,
			headers:  {
				'Accept':           'application/json',
				'X-HockeyAppToken': options.token,
			},
		}, function (err, res) {
			if (err) {
				grunt.log.error(err);
				return done(false);
			}
			if (res.statusCode !== 200 && res.statusCode !== 201) {
				grunt.log.error('Uploading failed with status ' + res.statusCode);
				res.on('data', function (chunk) {
					grunt.log.write(chunk);
				});
				res.on('end', function () {
					grunt.log.writeln();
				});
				return done(false);
			} else {
				res.on('data', function (chunk) {
					grunt.log.write(chunk);
				});
				res.on('end', function () {
					grunt.log.writeln();
				});
			}

			grunt.log.ok();

			var jsonString = '';
			res.on('data', function (buffer) {
				jsonString += String.fromCharCode.apply(null, new Uint16Array(buffer));
			});
			res.on('end', function () {
				grunt.log.debug(jsonString);
				var jsonObject = jsonString;
				console.error('jsonObject: ' + JSON.stringify(jsonObject, null, 2));
				try {
					jsonObject = JSON.parse(jsonString);
				} finally {
					options.onDone(jsonObject);
				}
				done();
			});
		});
	});
};

function formAppendArray(form, field, array) {
	if (_.isArray(array)) {
		array = array.join(',');
	}
	if (array !== null) {
		form.append(field, array);
	}
}