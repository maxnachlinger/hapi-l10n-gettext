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
		defaultLocale: 'en', // if the cookie is absent and no header is passed, this locale is used
		includedRoutes: [{
			path: '/localize-me',
			method: 'get'
		}],
		excludeRoutes: [{
			path: '/ignore-me',
			method: 'get'
		}]
	};
	index.register(plugIn, options, function() {
		t.equal(exposed['mode'], index.modes.include | index.modes.exclude);
		t.end();
	});
});

test('Include mode can be setup', function(t) {
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
		defaultLocale: 'en', // if the cookie is absent and no header is passed, this locale is used
		includedRoutes: [{
			path: '/localize-me',
			method: 'get'
		}]
	};
	index.register(plugIn, options, function() {
		t.equal(exposed['mode'], index.modes.include);
		t.end();
	});
});

test('Exclude mode can be setup', function(t) {
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
		defaultLocale: 'en', // if the cookie is absent and no header is passed, this locale is used
		excludeRoutes: [{
			path: '/ignore-me',
			method: 'get'
		}]
	};
	index.register(plugIn, options, function() {
		t.equal(exposed['mode'], index.modes.exclude);
		t.end();
	});
});

test('Default mode can be setup', function(t) {
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
		t.equal(exposed['mode'], index.modes.none);
		t.end();
	});
});
