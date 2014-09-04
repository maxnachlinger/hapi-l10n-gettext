var util = require('util');
var Hoek = require('hoek');
var Joi = require('joi');
var languageLoader = require('./languageLoader');

/*
 How to set a new locale (in this case English (Unites States)):
 -------------------------------
 POST - /_l10n with {_locale: 'en-us'} in the body
 GET - /_l10n/en-us
 This plug-in will take care of setting the cookie

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

 Some more useful server methods:
 -------------------------------
 server.methods.gettext
 server.methods.ngettext
 server.methods.npggettext
 server.methods.pggettext

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

// TODO - supply known locales - then load PO/MO files, if a locale is missing, alert caller
// TODO - figure out subdomains
var _plugin = {};
_plugin.defaults = {
	l10nDirectory: './locales', // where your PO files live
	defaultLocale: 'en', // if the cookie is absent and no header is passed, this locale is used
	ignoreL10nFunction: defaultIgnoreL10nFunction // function(path) returning true if path doesn't need l10n
	//useLocaleSubdomains: true // whether or not to use sub-domains for locales, e.g. en.host.com
};

var defaultIgnoreL10nFunction = function(path) {
	return ~path.indexOf('/public/') || ~path.indexOf('favicon');
};

_plugin.register = function (plugin, options, next) {
	var settings = Hoek.applyToDefaults(_plugin.defaults, options);

	plugin.log(['hapi-l10n-gettext', 'debug'], 'loading PO files');

	languageLoader.setup(settings.l10nDirectory, function (err, results) {
		if (err) return next(err);

		var localeCodes = results.foundLocales.map(function(foundLocale) { return foundLocale.code; });

		if(results.dev) {
			plugin.log(['hapi-l10n-gettext', 'warn'], 'No PO/MO files found, using the pass-through "test" locale');
			settings.defaultLocale = results.foundLocales[0].code;
		} else {
			plugin.log(['hapi-l10n-gettext', 'debug'], 'done loading PO files, found locales: ' + util.inspect(localeCodes));
		}

		plugin.route({
			method: 'GET',
			path: '/_l10n/{_locale}',
			config: {
				validate: {
					params: {
						_locale: Joi.string().allow(localeCodes).required()
					}
				}
			},
			handler: function (request, reply) {
				reply.redirect(request.info.referrer);
			}
		});

		plugin.route({
			method: 'POST',
			path: '/_l10n',
			config: {
				validate: {
					payload: {
						_locale: Joi.string().allow(localeCodes).required()
					}
				}
			},
			handler: function (request, reply) {
				reply.redirect(request.info.referrer);
			}
		});

		plugin.ext('onPreHandler', function (request, extNext) {
			if(settings.ignoreL10nFunction(request.path)) return extNext();

			// try the cookie, the header, and then use the default locale for our locale.
			var requestedLocale = (request.params || {})._locale
				|| (request.payload || {})._locale
				|| (request.state || {})['_locale']
				|| languageLoader.getHeaderLocale(request.headers['accept-language'])
				|| settings.defaultLocale;

			plugin.log(['hapi-l10n-gettext', 'debug'], 'onPreHandler, requestedLocale: ' + requestedLocale);

			// add the l10n bits to the request, this really needs to be per request since we'll get N requests for content in N languages
			var loadedLocale = languageLoader.getMethodsForLocale(requestedLocale);
			request.plugins.l10n = {
				text: loadedLocale.text,
				locales: loadedLocale.locales,
				locale: loadedLocale.selectedLocale
			};
			extNext();
		});

		plugin.ext('onPostHandler', function (request, extNext) {
			if(settings.ignoreL10nFunction(request.path)) return extNext();

			var l10n = request.plugins.l10n;

			var response = request.response;
			if(!response || response.isBoom) return extNext();

			if (response.headers)
				response.headers['content-language'] = l10n.locale;

			// store selected locale in a cooke
			response.state('_locale', l10n.locale, {path: '/'});

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
	pkg: require('../package.json')
};

module.exports = _plugin;
