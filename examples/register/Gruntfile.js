'use strict';
var path = require('path');
var fs = require('fs');
var gettextParser = require('gettext-parser');
var pseudoLoc = require('node-pseudo-l10n');

module.exports = function (grunt) {
	grunt.initConfig({
		jsxgettext: {
			generate: {
				files: [
					{
						src: [
							'./index.js',
							'./views/**/*.hbs'
						],
						dest: './locales/messages.pot'
					}
				],
				options: {
					keyword: 'gettext'
				}
			}
		}//,
//		generate_test_files: {
//			pot: './messages.pot',
//			languageDir: './locales',
//			generate: ['test']
//		}
	});

	['grunt-jsxgettext'].forEach(grunt.loadNpmTasks);

/*
	grunt.registerTask('generate_test_files', '', function () {
		var done = this.async();

		var localConf = grunt.config("generate_test_files");
		localConf.potFile = fs.readFileSync(path.resolve(localConf.pot));
		localConf.languageDir = path.resolve(localConf.languageDir);

		localConf.languageDirs = fs.readdirSync(localConf.languageDir)
			.filter(function(p) { return fs.statSync(path.resolve(localConf.languageDir, p)).isDirectory(); })
			.filter(function(p) { return ~localConf.generate.indexOf(p); });

		grunt.util.async.forEachSeries(localConf.languageDirs, function (languageName, cb) {
			var translator = {
				en: _.identity,
				test: pseudoLoc.transformString
			}[languageName] || function(str) { return '~' + languageName.toUpperCase() + ' ' + str; };

			var parsed = gettextParser.po.parse(localConf.potFile);
			parsed.headers['language'] = languageName;

			var translations = parsed.translations;

			Object.keys(translations).forEach(function (catalog) {
				Object.keys(translations[catalog]).forEach(function (key) {
					if (key.length === 0) return;

					var strObj = translations[catalog][key];

					strObj.msgstr[0] = translator(strObj.msgid);
					if (strObj.msgid_plural)
						strObj.msgstr[1] = translator(strObj.msgid_plural);
				});
			});

			fs.writeFileSync(
				path.resolve(localConf.languageDir, languageName, 'messages.po'),
				gettextParser.po.compile(parsed)
			);

			cb();
		}, function (err) {
			if(err)
				grunt.fail.fatal("generate_test_files error: " + util.inspect(err));
			done();
		});
	});

 grunt.registerTask('default', ['jsxgettext:generate', 'add_plurals', 'generate_test_files']);
*/
	grunt.registerTask('default', ['jsxgettext:generate']);
};
