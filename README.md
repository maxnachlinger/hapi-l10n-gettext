hapi-l10n-gettext
=================
A localization plug-in for HapiJS

[![NPM](https://nodei.co/npm/hapi-l10n-gettext.png)](https://nodei.co/npm/hapi-l10n-gettext/)

[![Build Status](https://travis-ci.org/maxnachlinger/hapi-l10n-gettext.png?branch=master)](https://travis-ci.org/maxnachlinger/hapi-l10n-gettext)

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
request.plugins.l10n = {
    text: {
        gettext, // get a bit of text
        pgettex, // get text within a context
        ngettext, // get singular or plural text
        npgettext // get singular or plural text within a context
    },
    // An array of locales found in the parsed PO/MO files
    locales: [{locale: 'en', name: 'English', selected: true}],
    locale: 'en', // the currently selected locale as a string
    // whether or not PO/MO files were found
    devMode: false
}
```
### Localization methods provided to view templates
```javascript
// An array of locales found in the parsed PO/MO files
locales: [{locale: 'en', name: 'English', selected: true}]
locale: 'en'  // the currently selected locale as a string
gettext, // get a bit of text
pgettex, // get text within a context
ngettext, // get singular or plural text
npgettext // get singular or plural text within a context
```

There's also an [example app](examples/register) to get more of an idea how to use this plug-in.
