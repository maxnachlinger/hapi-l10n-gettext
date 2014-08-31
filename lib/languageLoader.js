var GetTextSprintf = require('./getTextSprintf');
var readPoFiles = require('./readPoFiles');
var localeNames = require('./localeNames');

var languageCache = {};
var localeCodes = [];

module.exports.locales = [];

module.exports.setup = function (params, cb) {
	var poDirectory = params.poDirectory;

	readPoFiles(poDirectory, function (err, poFiles) {
		if (err) return cb(err);

		Object.keys(poFiles).forEach(function (key) {
			var poFile = poFiles[key];
			languageCache[poFile.languageCode] = new GetTextSprintf(poFile.languageCode, poFile.contents);
			exports.locales.push({code: poFile.languageCode, name: localeNames[poFile.languageCode]});

			// if language code is in the form en_US, grab the "en" and point it to en_US as well
			// (unless we've already processed "en" of course)

			if (~poFile.languageCode.indexOf('_')) {
				var newCode = poFile.languageCode.split('_').shift();

				if (!languageCache[newCode]) {
					exports.locales.push({code: newCode, name: localeNames[newCode]});
					languageCache[newCode] = languageCache[poFile.languageCode];
				}
			}
		});
		localeCodes = exports.locales.map(function (loc) { return loc.code; });

		cb(null, exports.locales);
	});
};

module.exports.setLocale = function (locale) {
	if (languageCache[locale])
		return languageCache[locale];
};

// Parse the Accept-Language header value, which often looks like:
// "en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4,zh-CN;q=0.2";
module.exports.getHeaderLocale = function (headerValue) {
	if (!headerValue) return;

	var requestedLanguage = headerValue.split(',').map(function (lang) {
		var a = lang.split(';');
		a[1] = (a[1] || 'q=1.0').split('=').pop() * 1;

		return {
			code: a[0].replace('-', '_'), // en-US -> en_US
			q: a[1]
		};
		// sort by q
	}).sort(function (lang1, lang2) {
		if (lang1.q < lang2.q)
			return 1;
		if (lang1.q > lang2.q)
			return -1;
		return 0;
		// limit to languages we suport
	}).filter(function (lang) {
		return !!~localeCodes.indexOf(lang.code);
	}).shift(); // chose the best available

	return requestedLanguage ? requestedLanguage.code : null;
};
