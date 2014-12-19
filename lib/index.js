var util = require('util');
var Hoek = require('hoek');
var pluginInfo = require('../package.json');
var languageLoader = require('./languageLoader');
var filterRoute = require('./filterRoutes');

var _plugin = {};

_plugin.defaults = {
	cookieName: '_locale',
	l10nDirectory: './locales', // optional: where your PO/MO files live, if not passed, a debugging "test" locale will be used.
	defaultLocale: 'en', // optional, defaults to 'en'. - If {cookieName} isn't present and no header is passed, this locale will be used
	includedRoutes: [], // optional: routes that require l10n
	excludedRoutes: [] // optional: routes that don't require l10n
};

_plugin.register = function (plugin, options, next) {
	var settings = Hoek.applyToDefaults(_plugin.defaults, options);
	filterRoute = filterRoute({
		excludedRoutes: settings.excludedRoutes || [],
		includedRoutes: settings.includedRoutes || []
	});

	plugin.log([pluginInfo.name, 'debug'], filterRoute.routeModeDescription);
	plugin.log([pluginInfo.name, 'debug'], 'loading PO files');

	// cookie settings
	plugin.state(settings.cookieName, {
		ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
		path: '/'
	});

	languageLoader.setup(settings.l10nDirectory, function (err, results) {
		if (err) return next(err);

		if (results.dev) {
			plugin.log([pluginInfo.name, 'warn'], 'No PO/MO files found, using the pass-through "test" locale');
			settings.defaultLocale = results.locales[0].locale;
		} else {
			plugin.log([pluginInfo.name, 'debug'], 'done loading PO files, found locales: ' + util.inspect(results.locales));
		}

		// expose supported locale-codes etc
		plugin.expose('localeCodes', results.localeCodes);
		plugin.expose('routeMode', settings.routeMode);
		plugin.expose('dev', results.dev);

		plugin.ext('onPreHandler', function (request, extNext) {
			if (filterRoute.ignoreRequest(request)) {
				plugin.log([pluginInfo.name, 'debug'], request.path + ' ignored.');
				return extNext.continue();
			}

			// try the cookie, header, and then use the default locale.
			var requestedLocale = (request.state || {})[settings.cookieName]
				|| languageLoader.getHeaderLocale(request.headers['accept-language'])
				|| settings.defaultLocale;

			plugin.log([pluginInfo.name, 'debug'], 'onPreHandler, requestedLocale: ' + requestedLocale);

			// add the l10n bits to the request, this really needs to be per request since we'll get N requests for content in N languages
			var loadedLocale = languageLoader.getMethodsForLocale(requestedLocale)
				|| languageLoader.getMethodsForLocale(settings.defaultLocale); // a bad cookie value perhaps?

			request.l10n = loadedLocale;
			request.l10n.devMode = results.devMode;

			plugin.log([pluginInfo.name, 'debug'], request.path + ' localized.');
			extNext.continue();
		});

		plugin.ext('onPostHandler', function (request, extNext) {
			if (!request.l10n || !request.response) return extNext.continue();

			var response = request.response;
			if (response.headers)
				response.headers['content-language'] = request.l10n.locale;

			// store selected locale in a cooke
			if(response.state)
				response.state(settings.cookieName, request.l10n.locale, {path: '/'});

			// export l10n.* methods for selectedLocale to views
			if (response.variety === 'view')
				response.source.context = Hoek.merge(response.source.context || {}, request.l10n);

			extNext.continue();
		});

		next();
	});
};

_plugin.register.attributes = {
	pkg: pluginInfo
};

module.exports = _plugin;
