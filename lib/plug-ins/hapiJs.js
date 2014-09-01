var util = require('util');
var Hoek = require('hoek');
var languageLoader = require('../languageLoader');

/*
How to set a new locale:
server.methods['setLocale']('en', function() { ... });
This plug-in will take care of setting the cookie

Views will receive a l10n object with,
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
	poDirectory: './locales', // where your PO files live
	defaultLocale: 'en' // if the cookie is absent and no header is passed, this locale is used
};

_plugin.register = function (plugin, options, next) {
	var settings = Hoek.applyToDefaults(_plugin.defaults, options);

	plugin.log(['l10n-gettext', 'debug'], 'loading PO files');

	languageLoader.setup({poDirectory: settings.poDirectory}, function (err, foundLocales) {
		if (err) return next(err);
		plugin.log(['l10n-gettext', 'debug'], 'done loading PO files, found locales: ' + util.inspect(foundLocales));

		plugin.ext('onPreHandler', function (request, cb) {
			// try the cookie, the header, then use the default locale
			var requestedLocale = request.state[settings.cookieName]
				|| languageLoader.getHeaderLocale(request.headers['accept-language'])
				|| settings.defaultLocale;

			setLocale(requestedLocale);
			cb()
		});

		// allows users to set the locale
		plugin.method('setLocale', setLocale);

		plugin.ext('onPreResponse', function (request, reply) {
			var response = request.response;
			// I can't think of any reason to worry about l10n when sending a file
			//if(response.variety && response.variety === 'file') return reply();

			var l10n = plugin.plugins["l10n-gettext"];

			if(response.headers)
				response.headers['content-language'] = l10n.locale.replace('_', '-'); //

			// new locale? Set the cookie.
			if (!request.state[settings.cookieName] || request.state[settings.cookieName] != l10n.locale)
				response.state(settings.cookieName, l10n.locale);

			// export l10n.* methods for selectedLocale to views
			if (response.variety === 'view') {
				response.source.context = response.source.context || {};
				response.source.context.l10n = l10n;
			}

			reply();
		});

		next();
	});

	function setLocale(locale, next) {
		// locale hasn't changed
		if(plugin.plugins["l10n-gettext"] && plugin.plugins["l10n-gettext"].locale == locale) return;

		plugin.log(['l10n-gettext', 'debug'], 'using locale: ' + locale);

		languageLoader.setLocale(locale);
		plugin.expose("text", languageLoader.selectedLocale);
		plugin.expose("locales", languageLoader.locales);
		plugin.expose("locale", languageLoader.selectedLocale.locale);

		if(next) setImmediate(next.call(null));
	}
};

_plugin.register.attributes = {
	pkg: require('../../package.json')
};

module.exports = _plugin;
