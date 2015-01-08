var fs = require('fs');
var path = require('path');
var test = require('tape');
var GetTextSprintf = require('../lib/getTextSprintf');
var fns;

test('Setup', function (t) {
	fns = new GetTextSprintf("test", fs.readFileSync(path.resolve(__dirname, 'fixtures/testMessages.po')));
	t.end();
});

test('Simple strings work', function (t) {
	t.equal(fns.gettext("test - Simple string"), "test - Simple string translated");
	t.end();
});

test('sprintf place-holder strings work', function (t) {
	t.equal(
		fns.gettext("test - 1 string place-holder: %s", "test-string"),
		"test - 1 string place-holder: test-string translated"
	);
	t.equal(
		fns.gettext("test - 1 string, 1 int place-holder: %s, %d", "test-string", 30),
		"test - 1 string, 1 int place-holder: test-string, 30 translated"
	);
	t.end();
});

test('plural place-holder strings work', function (t) {
	t.equal(
		fns.ngettext("test - Simple string singular", 2),
		"test - Simple string translated plural"
	);
	t.end();
});

test('sprintf plural place-holder strings work', function (t) {
	t.equal(
		fns.ngettext("test - Simple string singular int place-holder: %d", 2, 20),
		"test - Simple string translated plural int place-holder: 20"
	);
	t.end();
});

test('Simple strings work with context', function (t) {
	t.equal(
		fns.pgettext("test - Test Context", "test - Simple string in context"),
		"test - Simple string in context translated"
	);
	t.end();
});

test('sprintf plural place-holder strings work with context', function (t) {
	t.equal(
		fns.npgettext("test - Test Context", "test - Simple string singular in context int place-holder: %d", 2, 20),
		"test - Simple string in context translated plural int place-holder: 20"
	);
	t.end();
});
