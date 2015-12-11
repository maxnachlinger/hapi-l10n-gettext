hapi-l10n-gettext
=================
A localization plug-in for HapiJS
https://www.npmjs.com/package/hapi-l10n-gettext

[![Build Status](https://travis-ci.org/maxnachlinger/hapi-l10n-gettext.svg?branch=master)](https://travis-ci.org/maxnachlinger/hapi-l10n-gettext)
[![Dependency Status](https://david-dm.org/maxnachlinger/hapi-l10n-gettext.svg)](https://david-dm.org/maxnachlinger/hapi-l10n-gettext)

### Installation:
```
npm i hapi-l10n-gettext
```
### Plug-in options and setup:
```javascript
// register as you would any other hapi plug-in
server.pack.register([
    // additional plug-ins here
    {
        plugin: require('hapi-l10n-gettext'),
        options: {
            // the name of the cookie this plug-in will set to store locale
            cookieName: '_locale',
            // optional: where your PO/MO files live, if no filesa are found, a debugging 
            // "test" locale will be used.
            l10nDirectory: path.resolve(__dirname, 'locales'),
            // optional (default 'en') - language used when neither the cookie nor the 
            // accept-language header are present
            defaultLocale: 'en',
            // optional: routes to exclude from localization
            excludedRoutes: [assetRoute],
            // optional: routes to include in localization
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
### Localization methods provided to JS code
```javascript
request.l10n = {
    gettext, // get a bit of text
    pgettex, // get text within a context
    ngettext, // get singular or plural text
    npgettext // get singular or plural text within a context
    // An array of locales found in the parsed PO/MO files
    locales: [{locale: 'en', name: 'English', selected: true}],
    selectedLocale: {locale: 'en', name: 'English', selected: true}, // the currently selected locale
    // whether or not PO/MO files were found
    devMode: false
}
```
### Localization methods provided to view templates
(Added to response.source.context)
```javascript
// An array of locales found in the parsed PO/MO files
locales: [{locale: 'en', name: 'English', selected: true}]
selectedLocale: {locale: 'en', name: 'English', selected: true}, // the currently selected locale
gettext, // get a bit of text
pgettex, // get text within a context
ngettext, // get singular or plural text
npgettext // get singular or plural text within a context
```
There's also an [example app](examples/register) to get more of an idea how to use this plug-in.

## Contributors
[Here's a list, thanks for your help!](https://github.com/maxnachlinger/hapi-l10n-gettext/graphs/contributors)
