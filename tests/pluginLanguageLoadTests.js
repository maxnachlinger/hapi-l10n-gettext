var util = require('util');
var path = require('path');
var test = require('tape');
var index = require('../');

test('Include-exclude mode can be setup', function(t) {
	var exposed = {};
	var plugIn = {
		log: function() {},
		state: function() {},
		expose: function(key, value) {
			exposed[key] = value;
		},
		ext: function() {}
	};
	var options = {
		cookieName: '_locale',
		l10nDirectory: path.resolve(__dirname, 'fixtures/locales'),
		defaultLocale: 'en' // if the cookie is absent and no header is passed, this locale is used
	};
	index.register(plugIn, options, function() {
		[ 'de', 'en', 'es', 'fr', 'it', 'ja', 'pt-br', 'zh-cn', 'zh-tw' ].forEach(function(locale) {
			t.ok(~exposed['localeCodes'].indexOf(locale), "Found " + locale);
		});
		t.end();
	});
});
