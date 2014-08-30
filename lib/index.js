var Hoek = require('hoek');
var LanguageLoader = require('./languageLoader');
var languageLoader = new LanguageLoader();

var hapiJsPlugin = {};
hapiJsPlugin.defaults = {
	cookieName: '_locale',
	poDirectory: './locales',
	defaultLocale: 'en_US'
};
hapiJsPlugin.register = function (plugin, options, next) {
	var settings = Hoek.applyToDefaults(hapiJsPlugin.defaults, options);

	languageLoader.setup({poDirectory: settings.poDirectory}, function(err, foundLocales) {
		if(err) return next(err);

		plugin.log(['l8n-gettext', 'info'], 'l8n-gettext created, found locales: ' + foundLocales.join(', '));

		plugin.ext('onPreHandler', function (request, extNext) {
			var requestedLocale = request.state[settings.cookieName]
				|| getLanguageFromHeader(request.headers["accept-language"], foundLocales)
				|| settings.defaultLocale;

			plugin.log(['l8n-gettext', 'info'], 'using locale: ' + requestedLocale);

			request.plugins.l8n = languageLoader.load(requestedLocale);
			extNext();
		});

		plugin.ext('onPreResponse', function (request, reply) {
			if(!request.plugins.l8n) return reply();
			var response = request.response;

			// set locale cookie
			reply.state(settings.cookieName, request.plugins.l8n.locale);

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
	pkg: require('../package.json')
};

module.exports.hapiJsPlugin = hapiJsPlugin;

function getLanguageFromHeader(headerValue, foundLocales) {
	var matches = (headerValue || '').match(/[a-z]+/gi);
	if(!matches) return;

	var language = matches[0].toLowerCase();
	var languageAndLocale = null;

	var country = matches[1];
	if(country)
		languageAndLocale = language + '_' + country.toUpperCase();

	if(languageAndLocale && ~foundLocales.indexOf(languageAndLocale))
		return languageAndLocale;

	if(~foundLocales.indexOf(language))
		return language;
}
