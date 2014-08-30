var GetTextSprintf = require('./getTextSprintf');
var readPoFiles = require('./readPoFiles');

module.exports = LanguageLoader;

function LanguageLoader() {
	if (!(this instanceof LanguageLoader)) return new LanguageLoader();

	var languageCache = {};
	var locales = [];

	function setup(params, cb) {
		var poDirectory = params.poDirectory;

		readPoFiles(poDirectory, function(err, poFiles) {
			if(err) return cb(err);

			Object.keys(poFiles).forEach(function(key) {
				var poFile = poFiles[key];
				languageCache[poFile.languageCode] = new GetTextSprintf(poFile.languageCode, poFile.contents);
				locales.push(poFile.languageCode);

				// if language code is in the form en_us, grab the "en" and point it to en_us as well
				if(~poFile.languageCode.indexOf('_')) {
					var newCode = poFile.languageCode.split('_').shift();

					if(!languageCache[newCode]) {
						locales.push(newCode);
						languageCache[newCode] = languageCache[poFile.languageCode];
					}
				}
			});

			cb(null, locales);
		});
	}

	function load(languageCode) {
		if(languageCache[languageCode])
			return languageCache[languageCode];
	}

	var headerRegex = /[a-z]+/gi;

	function getHeaderLocale(headerValue) {
		var matches = (headerValue || '').match(headerRegex);
		if(!matches) return;

		var language = matches[0].toLowerCase();
		var languageAndLocale = null;

		var country = matches[1];
		if(country)
			languageAndLocale = language + '_' + country.toUpperCase();

		if(languageAndLocale && ~locales.indexOf(languageAndLocale))
			return languageAndLocale;

		if(~locales.indexOf(language))
			return language;
	}

	return {
		setup: setup,
		load: load,
		headerLocale: getHeaderLocale
	};
}
