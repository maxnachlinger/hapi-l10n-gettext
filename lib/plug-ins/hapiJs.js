var util = require('util');
var Hoek = require('hoek');
var languageLoader = require('../languageLoader');

var hapiJsPlugin = {};
hapiJsPlugin.defaults = {
	cookieName: '_locale',
	poDirectory: './locales',
	defaultLocale: 'en'
};
hapiJsPlugin.register = function (plugin, options, next) {
	var settings = Hoek.applyToDefaults(hapiJsPlugin.defaults, options);

	plugin.log(['l8n-gettext', 'info'], 'loading PO files');

	languageLoader.setup({poDirectory: settings.poDirectory}, function(err, foundLocales) {
		if(err) return next(err);

		plugin.log(['l8n-gettext', 'info'], 'done loading PO files, found locales: ' + util.inspect(foundLocales));

		plugin.ext('onPreHandler', function (request, extNext) {
			var requestedLocale = request.state[settings.cookieName]
				|| languageLoader.getHeaderLocale(request.headers['Accept-Language'])
				|| settings.defaultLocale;

			plugin.log(['l8n-gettext', 'info'], 'using locale: ' + requestedLocale);

			request.plugins.l8n = languageLoader.load(requestedLocale);
			request.plugins.l8n.locales = languageLoader.locales;
			extNext();
		});

		plugin.ext('onPreResponse', function (request, reply) {
			if(!request.plugins || !request.plugins.l8n) return reply();
			var response = request.response;

			response.headers['Content-Language'] = request.plugins.l8n.locale;

			// set locale cookie
			if(!request.state[settings.cookieName])
				response.state(settings.cookieName, request.plugins.l8n.locale);

			if (response.variety && response.variety === 'view') {
				response.source.context = response.source.context || {};
				response.source.context.l8n = request.plugins.l8n;
			}

			reply();
		});

		next();
	});
};
hapiJsPlugin.register.attributes = {
	pkg: require('../../package.json')
};

module.exports = hapiJsPlugin;
