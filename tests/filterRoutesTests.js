var util = require('util');
var path = require('path');
var test = require('tape');
var filterRoutes = require('../lib/filterRoutes');

test('Include-exclude routeMode can be setup', function (t) {
	var filterer = filterRoutes({
		includedRoutes: [
			{
				path: '/localize-me',
				method: 'get'
			}
		],
		excludedRoutes: [
			{
				path: '/ignore-me',
				method: 'get'
			}
		]
	});

	t.equal(filterer.routeMode, filterer.routeModes.include | filterer.routeModes.exclude);
	t.end();
});

test('Include routeMode can be setup', function (t) {
	var filterer = filterRoutes({
		includedRoutes: [
			{
				path: '/localize-me',
				method: 'get'
			}
		]
	});

	t.equal(filterer.routeMode, filterer.routeModes.include);
	t.end();
});

test('Exclude routeMode can be setup', function (t) {
	var filterer = filterRoutes({
		excludedRoutes: [
			{
				path: '/ignore-me',
				method: 'get'
			}
		]
	});

	t.equal(filterer.routeMode, filterer.routeModes.exclude);
	t.end();
});

test('Default routeMode can be setup', function (t) {
	var filterer = filterRoutes();

	t.equal(filterer.routeMode, filterer.routeModes.all);
	t.end();
});
