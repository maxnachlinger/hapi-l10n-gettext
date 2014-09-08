hapi-l10n-gettext
=================
A localization plug-in for HapiJS

[![NPM](https://nodei.co/npm/hapi-l10n-gettext.png)](https://nodei.co/npm/hapi-l10n-gettext/)

[![Build Status](https://travis-ci.org/maxnachlinger/hapi-l10n-gettext.png?branch=master)](https://travis-ci.org/maxnachlinger/hapi-l10n-gettext)

### Installation:
```
npm i hapi-l10n-gettext
```
### Usage:
```javascript
// register as you would any other hapi plug-in
server.pack.register([
	// additional plug-ins here
	{
		plugin: require('hapi-l10n-gettext'),
		options: {
			cookieName: '_locale',
			l10nDirectory: path.resolve(__dirname, 'locales'),
			defaultLocale: 'en',
			excludedRoutes: [assetRoute],
			includedRoutes: appRoutes
		}
	}
], function (err) {
	if (err) throw err;
	server.start(function () {
		server.log('info', 'Server running at: ' + server.info.uri);
	});
});
```
