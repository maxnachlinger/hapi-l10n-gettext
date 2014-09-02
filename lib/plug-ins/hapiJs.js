var util = require('util');
var Hoek = require('hoek');
var languageLoader = require('../languageLoader');
var __slice = Array.prototype.slice;

/*
 How to set a new locale:
 -------------------------------
 server.methods.setLocale('en');
 This plug-in will take care of setting the cookie

 Views will receive a l10n object with:
 -------------------------------
 0. A "text" object exposing gettext methods (the snippet below is in handlebars):

 <p>Login: {{l10n.text.gettext "Log in"}}</p>

 1. A "locales" array of objects built from locales found in the PO files. This array looks like:
 [{name: "English", code: "en", selected: true}] - the selected property in each object let's you
 know whether a given locale is the selected one.

 <select>
 {{#each l10n.locales}}
 <option value="{{code}}"{{#if selected}} selected{{/if}}>{{name}}</option>
 {{/each}}
 </select>

 2. A "locale" string which contains the code for the currently selected locale.

 Some more useful server methods:
 -------------------------------
 server.methods.gettext
 server.methods.ngettext
 server.methods.npggettext
 server.methods.pggettext


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
	cookieName: '_locale', // the name of the cookie in which the selected locale is stored
	languageSetParamName: '_locale', // query-param, or payload param for changing language
	l10nDirectory: './locales', // where your PO files live
	defaultLocale: 'en' // if the cookie is absent and no header is passed, this locale is used
};

_plugin.register = function (plugin, options, next) {
	var settings = Hoek.applyToDefaults(_plugin.defaults, options);

	plugin.log(['l10n-gettext', 'debug'], 'loading PO files');

	languageLoader.setup(settings.l10nDirectory, function (err, foundLocales) {
		if (err) return next(err);
		if (!foundLocales || foundLocales.length === 0) return next(new Error('No loccales found in PO files'));

		plugin.log(['l10n-gettext', 'debug'], 'done loading PO files, found locales: ' + util.inspect(foundLocales));

		// allows users to set the locale
		plugin.method('setLocale', setLocale);

		// use the first locale to setup the rest of the server.methods
		languageLoader.setLocale(foundLocales[0].code);
		Object.keys(languageLoader.selectedLocale).forEach(function (key) {
			if (plugin.method[key] || typeof(languageLoader.selectedLocale[key]) !== 'function') return;

			// wrapping this in a function so we defer evaluating languageLoader.selectedLocale
			plugin.method(key, function () {
				return languageLoader.selectedLocale[key].apply(null, __slice.call(arguments));
			});
		});

		plugin.ext('onPreResponse', function (request, reply) {
			// try the cookie, the header, then use the default locale
			var requestedLocale = (request.payload || {})[settings.languageSetParamName]
				|| (request.params || {})[settings.languageSetParamName]
				|| (request.query || {})[settings.languageSetParamName]
				|| request.state[settings.cookieName]
				|| languageLoader.getHeaderLocale(request.headers['accept-language'])
				|| settings.defaultLocale;

			plugin.log(['l10n-gettext', 'debug'], 'onPreHandler, requestedLocale: ' + requestedLocale);

			var response = request.response;
			if(response.isBoom) return reply();

			// new locale? Set the cookie.
			if (!request.state[settings.cookieName] || request.state[settings.cookieName] != requestedLocale)
				response.state(settings.cookieName, requestedLocale, {path: '/'});

			setLocale(requestedLocale);

			if (response.headers)
				response.headers['content-language'] = requestedLocale;

			// export l10n.* methods for selectedLocale to views
			if (response.variety === 'view') {
				response.source.context = response.source.context || {};
				response.source.context.l10n = plugin.plugins["l10n-gettext"];
			}

			reply();
		});

		next();
	});

	function setLocale(locale) {
		// locale hasn't changed
		if (plugin.plugins["l10n-gettext"] && plugin.plugins["l10n-gettext"].locale == locale) return;

		plugin.log(['l10n-gettext', 'debug'], 'using locale: ' + locale);

		languageLoader.setLocale(locale);
		plugin.expose("text", languageLoader.selectedLocale);
		plugin.expose("locales", languageLoader.locales);
		plugin.expose("locale", languageLoader.selectedLocale.locale);
	}
};

_plugin.register.attributes = {
	pkg: require('../../package.json')
};

module.exports = _plugin;
