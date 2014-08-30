var LanguageLoader = require('./languageLoader');
var languageLoader = new LanguageLoader();

module.exports.register = function (plugin, options, next) {
	options = options || {};
	options.cookie = options.cookie || '_lang';
	options.poDirectory = options.poDirectory || './locales';

	languageLoader.setup({poDirectory: options.poDirectory}, function(err, foundLocales) {
		if(err) return next(err);

		plugin.log([ 'l8n-gettext', 'info' ], 'l8n-gettext created, found locales: ' + foundLocales.join(', '));

		plugin.ext('onPreHandler', function (request, extNext) {
			var requestedLocale = request.state[options.cookie];
			if(!requestedLocale)
				requestedLocale = getLanguageFromHeader(request, foundLocales) || 'en_US';

			plugin.log([ 'l8n-gettext', 'info' ], 'requested locale: ' + requestedLocale);

			request.plugins.l8n = languageLoader.load(requestedLocale);
			extNext();
		});

		plugin.ext('onPreResponse', function (request, extNext) {
			if(!request.plugins.l8n) return extNext();
			var response = request.response;

			// set lang cookie
			//response.state(options.cookie, request.plugins.l8n.locale);

			if (response.variety && response.variety === 'view') {
				response.source.context = response.source.context || {};
				response.source.context.l8n = request.plugins.l8n;
			}

			extNext();
		});

		next();
	});
};

module.exports.register.attributes = {
	pkg: require('../package.json')
};

function getLanguageFromHeader(request, foundLocales) {
	var matches = (request.headers["accept-language"] || '').match(/[a-z]+/gi);
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
