var util = require('util');
var path = require('path');
var test = require('tape');
var languageLoader = require('../lib/languageLoader');

test("setup returns locales found in PO files (and language names from language-COUNTRY locales)", function (t) {
	t.test('Setup', setup);

	t.test("Tests", function(t) {
		var localeCodes = languageLoader.getLocaleCodes();
		[ 'de', 'de-de', 'en', 'es', 'fr', 'it', 'ja', 'pt-br', 'zh-cn', 'zh-tw' ].forEach(function(locale) {
			t.ok(~localeCodes.indexOf(locale), "Found " + locale);
		});
		t.end();
	});

	t.test("Tear down", tearDown);
});

test("getHeaderLocale can parse a complex accept-language header value", function (t) {
	t.test('Setup', setup);

	t.test("Tests", function(t) {
		var headerValue = "zh-TW,zh-CN;q=0.2,zh;q=0.8,en-US;q=0.6,en;q=0.4";
		var expected = 'zh-tw';
		var selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expected, "If the user's first choice is supported, it will be returned.");

    headerValue = "no,nl;q=0.8";
    selectedLanguage = languageLoader.getHeaderLocale(headerValue);
    t.equal(selectedLanguage, null, "If users choice is not supported, return null (to set default locale).");

		headerValue = "test0,test1;q=0.8,zh-CN;q=0.6,en-US;q=0.4,en;q=0.2";
		expected = 'zh-cn';
		selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expected, "If the user's third first choice is supported, it will be returned.");

		headerValue = "test0,test1;q=0.8,test2;q=0.6,test3;q=0.4,zh-TW;q=0.2";
		expected = 'zh-tw';
		selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expected, "If only the user's last choice is supported, it will be returned.");

    headerValue = "de-AT,en;q=0.8";
    expected = 'de';
    selectedLanguage = languageLoader.getHeaderLocale(headerValue);
    t.equal(selectedLanguage, expected, "If only the users first choice dialect is not supported, return users first choice base language.");

    headerValue = "de-DE,de;q=0.8,en;q=0.6";
    expected = 'de-de';
    selectedLanguage = languageLoader.getHeaderLocale(headerValue);
    t.equal(selectedLanguage, expected, "If users first choice dialect is supprted, return dialect.");

    headerValue = "de-AT,de-DE;q=0.8,en;q=0.6";
    expected = 'de-de';
    selectedLanguage = languageLoader.getHeaderLocale(headerValue);
    t.equal(selectedLanguage, expected, "If users first choice dialect is not supported, but second choice dialect matches with same language, return second choice dialect instead of base language.");

		t.end();
	});

	t.test("Tear down", tearDown);
});

function setup(t) {
	languageLoader.setup(path.resolve(__dirname, 'fixtures/locales'), function (err, result) {
		t.notOk(err, "Setup should not return an error, received: " + (err || {}).stack);
		t.ok(result, "Setup returned locales: " + util.format(result.locales));
		t.end();
	});
}

function tearDown(t) {
	languageLoader.clear();
	t.end();
}
