var util = require('util');
var Hoek = require('hoek');
var languageLoader = require('../languageLoader');

var _plugin = {};
_plugin.defaults = {
	cookieName: '_locale',
	localeChangeParam: '_locale',
	poDirectory: './locales',
	defaultLocale: 'en'
};

_plugin.register = function (plugin, options, next) {
	var settings = Hoek.applyToDefaults(_plugin.defaults, options);

	plugin.log(['l8n-gettext', 'debug'], 'loading PO files');

	languageLoader.setup({poDirectory: settings.poDirectory}, function (err, foundLocales) {
		if (err) return next(err);

		plugin.log(['l8n-gettext', 'debug'], 'done loading PO files, found locales: ' + util.inspect(foundLocales));

		plugin.ext('onPreHandler', function (request, extNext) {
			var requestedLocale = request.state[settings.cookieName]
				|| languageLoader.getHeaderLocale(request.headers['accept-language'])
				|| settings.defaultLocale;

			plugin.log(['l8n-gettext', 'debug'], 'using locale: ' + requestedLocale);

			setLocale(request.plugins.l8n, requestedLocale);

			extNext();
		});

		plugin.ext('onPreResponse', function (request, reply) {
			if (!request.plugins || !request.plugins.l8n) return reply();
			var response = request.response;

			if(response.headers)
				response.headers['content-language'] = request.plugins.l8n.locale;

			// set locale cookie
			if (!request.state[settings.cookieName] || request.state[settings.cookieName] != request.plugins.l8n.locale)
				response.state(settings.cookieName, request.plugins.l8n.locale);

			if (response.variety && response.variety === 'view') {
				response.source.context = response.source.context || {};
				response.source.context.l8n = request.plugins.l8n;
			}

			reply();
		});

		plugin.route({
			method: 'GET',
			path: '/test',
			handler: function (request, reply) {
				reply('test passed');
			}
		});

		next();
	});
};

function setLocale(context, locale) {
	context = languageLoader.load(locale);
	context.locales = languageLoader.locales;
	context.setLocale = function (locale) {
		setLocale(context, locale);
	};
}

_plugin.register.attributes = {
	pkg: require('../../package.json')
};

module.exports = _plugin;
