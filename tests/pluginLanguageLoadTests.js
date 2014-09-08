var util = require('util');
var path = require('path');
var test = require('tape');

test('Returns the test locale when no PO files found', function(t) {
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
		l10nDirectory: path.resolve(__dirname, 'fixtures/empty'),
		defaultLocale: 'en'
	};
	require('../').register(plugIn, options, function() {
		[ 'test' ].forEach(function(locale) {
			t.ok(~exposed['localeCodes'].indexOf(locale), "Found " + locale);
		});
		t.ok(exposed['dev']);
		t.end();
	});
});

test('Returns locale codes for all POs', function(t) {
	// remove previous index from require cache
	var toRemove = require.resolve('../');
	Object.keys(require.cache).forEach(function(key) {
		if(key === toRemove)
			delete require.cache[key];
	});

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
		defaultLocale: 'en'
	};
	require('../').register(plugIn, options, function() {
		[ 'de', 'en', 'es', 'fr', 'it', 'ja', 'pt-br', 'zh-cn', 'zh-tw' ].forEach(function(locale) {
			t.ok(~exposed['localeCodes'].indexOf(locale), "Found " + locale);
		});
		t.end();
	});
});
