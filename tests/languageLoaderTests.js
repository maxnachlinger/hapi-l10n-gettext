var util = require('util');
var path = require('path');
var test = require('tape');
var languageLoader = require('../lib/languageLoader');

test("setup returns locales found in PO files (and language names from language_COUNTRY locales)", function (t) {
	t.test('Setup', setup);

	t.test("Tests", function(t) {
		var localeCodes = languageLoader.locales.map(function(locale) {
			return locale.code;
		});

		['en', 'zh_CN', 'zh_TW', 'zh'].forEach(function(locale) {
			t.ok(~localeCodes.indexOf(locale), "Found " + locale);
		});

		t.end();
	});

	t.test("Tear down", tearDown);
});

test("getHeaderLocale can parse a complex accept-language header value", function (t) {
	t.test('Setup', setup);

	t.test("Tests", function(t) {
		var headerValue = "en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4,zh-CN;q=0.2";
		var expectedLanguage = 'en';
		var selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expectedLanguage, "If the user's first choice is supported, it will be returned.");

		headerValue = "zh-TW,zh-CN;q=0.2,zh;q=0.8,en-US;q=0.6,en;q=0.4";
		expectedLanguage = 'zh_TW';
		selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expectedLanguage, "If the user's first choice is supported, it will be returned.");

		headerValue = "test0,test1;q=0.8,test2;q=0.6,test3;q=0.4,zh;q=0.2";
		expectedLanguage = 'zh';
		selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expectedLanguage, "If only the user's last choice is supported, it will be returned.");

		t.end();
	});

	t.test("Tear down", tearDown);
});

function setup(t) {
	languageLoader.setup({
		poDirectory: path.resolve(__dirname, 'fixtures/locales')
	}, function (err, locales) {
		t.notOk(err, "Setup should not return an error, received: " + util.format(err));
		t.ok(locales, "Setup returned locales: " + util.format(locales));
		t.end();
	});
}

function tearDown(t) {
	languageLoader = require('../lib/languageLoader');
	t.end();
}
