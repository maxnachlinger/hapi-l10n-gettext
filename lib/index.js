var util = require('util');
var Hoek = require('hoek');
var Joi = require('joi');
var pluginInfo = require('../package.json');
var languageLoader = require('./languageLoader');

/*
 Views will receive a l10n object with:
 -------------------------------
 0. A "text" object exposing gettext methods (the snippet below is in handlebars):

 <p>Login: {{l10n.text.gettext "Log in"}}</p>

 1. A "locales" array of objects built from locales found in the PO files. This array looks like:
 [{name: "English (Unites States)", code: "en-us", selected: true}] - the selected property in each object let's you
 know whether a given locale is the selected one.

 <select>
 {{#each l10n.locales}}
 <option value="{{code}}"{{#if selected}} selected{{/if}}>{{name}}</option>
 {{/each}}
 </select>

 2. A "locale" string which contains the code for the currently selected locale.


 Misc:
 This lib will set a cookie named "_locale"

 HTTP bits:
 If the locale cookie is present, that is always used, since it is thought that the UI selected the
 language in that cookie intentionally.

 If the cookie is absent, this plug-in parses the Accept-Language HTTP header and, using the client's
 locale preference-weights, selects the best locale for them. Since the cookie isn't present, the cookie
 will be set with this locale.

 If there's no Accept-Language header, the default locale will be used.

 This plug-in also sends back a Content-Language header, letting the browser know the current language
 shown on the page.
 */

var _plugin = {};

_plugin.defaults = {
	cookieName: '_locale',
	l10nDirectory: './locales', // optional: where your PO/MO files live, if not passed, a debugging "test" locale will be used.
	defaultLocale: 'en', // optional, defaults to 'en'. - If {cookieName} isn't present and no header is passed, this locale will be used
	includedRoutes: [], // optional: routes that require l10n
	excludeRoutes: [] // optional: routes that don't require l10n
};

_plugin.routeModes = {
	all: 1,
	include: 1 << 1,
	exclude: 1 << 2
};

_plugin.register = function (plugin, options, next) {
	var settings = Hoek.applyToDefaults(_plugin.defaults, options);
	
	var routeModes = _plugin.routeModes;
	settings.routeMode = routeModes.all;

	if (settings.excludeRoutes.length > 0)
		settings.routeMode = routeModes.exclude;
	if (settings.includedRoutes.length > 0) {
		if (settings.routeMode == routeModes.all)
			settings.routeMode = routeModes.include;
		else
			settings.routeMode = settings.routeMode | routeModes.include;
	}

	settings.excluded = {};
	if (settings.routeMode & routeModes.exclude) {
		(settings.excludeRoutes || []).forEach(function (route) {
			settings.exclude = true;
			if (!settings.excluded[route.path])
				settings.excluded[route.path] = {};

			settings.excluded[route.path][route.method.toLowerCase()] = true;
		});
		plugin.log([pluginInfo.name, 'debug'], 'excluding a few paths');
	}

	settings.included = {};
	if (settings.routeMode & routeModes.include) {
		(settings.includedRoutes || []).forEach(function (route) {
			settings.include = true;
			if (!settings.included[route.path])
				settings.included[route.path] = {};

			settings.included[route.path][route.method.toLowerCase()] = true;
		});
		plugin.log([pluginInfo.name, 'debug'], 'including a few paths');
	}

	if (settings.routeMode & routeModes.all)
		plugin.log([pluginInfo.name, 'debug'], 'no path inclusions or exclusions');

	var ignoreRequest = function (request) {
		if (!request.route) return true;
		if (settings.routeMode & routeModes.all) return false;

		var included = (settings.included[request.route.path] || {})[request.route.method];
		var excluded = (settings.excluded[request.route.path] || {})[request.route.method];

		if (settings.routeMode & routeModes.include & routeModes.exclude)
			return !included || excluded;

		if (settings.routeMode & routeModes.exclude)
			return excluded;

		if (settings.routeMode & routeModes.include)
			return !included;
	};

	plugin.log([pluginInfo.name, 'debug'], 'loading PO files');

	plugin.state(settings.cookieName, {
		ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
		path: '/'
	});

	languageLoader.setup(settings.l10nDirectory, function (err, results) {
		if (err) return next(err);

		if (results.dev) {
			plugin.log([pluginInfo.name, 'warn'], 'No PO/MO files found, using the pass-through "test" locale');
			settings.defaultLocale = results.foundLocales[0].code;
		} else {
			plugin.log([pluginInfo.name, 'debug'], 'done loading PO files, found locales: ' + util.inspect(results.localeCodes));
		}

		// expose supported locale-codes
		plugin.expose('localeCodes', results.localeCodes);
		plugin.expose('routeMode', settings.routeMode);
		plugin.expose('dev', results.dev);

		plugin.ext('onPreHandler', function (request, extNext) {
			if (ignoreRequest(request)) {
				plugin.log([pluginInfo.name, 'debug'], request.path + ' ignored.');
				return extNext();
			}

			// try the cookie, header, and then use the default locale.
			var requestedLocale = (request.state || {})[settings.cookieName]
				|| languageLoader.getHeaderLocale(request.headers['accept-language'])
				|| settings.defaultLocale;

			plugin.log([pluginInfo.name, 'debug'], 'onPreHandler, requestedLocale: ' + requestedLocale);

			// add the l10n bits to the request, this really needs to be per request since we'll get N requests for content in N languages
			var loadedLocale = languageLoader.getMethodsForLocale(requestedLocale);
			// an out of date cookie perhaps?
			if (!loadedLocale)
				loadedLocale = languageLoader.getMethodsForLocale(settings.defaultLocale);

			request.plugins.l10n = {
				text: loadedLocale.text,
				locales: loadedLocale.locales,
				locale: loadedLocale.selectedLocale,
				devMode: results.devMode
			};
			plugin.log([pluginInfo.name, 'debug'], request.path + ' localized.');
			extNext();
		});

		plugin.ext('onPostHandler', function (request, extNext) {
			if (!request.plugins.l10n || !request.response) return extNext();

			var l10n = request.plugins.l10n;

			var response = request.response;
			if (response.headers)
				response.headers['content-language'] = l10n.locale;

			// store selected locale in a cooke
			response.state(settings.cookieName, l10n.locale, {path: '/'});

			// export l10n.* methods for selectedLocale to views
			if (response.variety === 'view') {
				response.source.context = Hoek.merge(response.source.context || {}, l10n.text);
				response.source.context.locales = l10n.locales;
				response.source.context.locale = l10n.locale;
			}
			extNext();
		});

		next();
	});
};

_plugin.register.attributes = {
	pkg: pluginInfo
};

module.exports = _plugin;
