var path = require('path');
var test = require('tape');
var languageLoader = require('../lib/languageLoader');

test("getHeaderLocale can parse a complex accept-language header value", function (t) {
	t.test('Setup', setup);

	t.test(function(t) {
		// if we suport the user's first choice, use it
		var headerValue = "en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4,zh-CN;q=0.2";
		var expectedLanguage = 'en';
		var selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expectedLanguage);

		headerValue = "zh-TW,zh-CN;q=0.8,zh;q=0.6,en-US;q=0.4,en;q=0.2";
		expectedLanguage = 'zh_TW';
		selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expectedLanguage);

		// if we only support the user's last choice, use it
		headerValue = "test0,test1;q=0.8,test2;q=0.6,test3;q=0.4,zh;q=0.2";
		expectedLanguage = 'zh';
		selectedLanguage = languageLoader.getHeaderLocale(headerValue);
		t.equal(selectedLanguage, expectedLanguage);

		t.end();
	});
});

function setup(t) {
	languageLoader.setup({
		poDirectory: path.join(__dirname, '/locales')
	}, function (err, locales) {
		t.notOk(err);
		t.ok(locales);
		t.end();
	});
}
