var GetTextSprintf = require('./getTextSprintf');
var readL8nFiles = require('./readL8nFiles');
var localeNames = require('./localeNames');

var languageCache = {};
var localeCodes = [];

module.exports.locales = [];
module.exports.selectedLocale = {};

module.exports.setup = function (params, cb) {
	var poDirectory = params.poDirectory;

	readL8nFiles(poDirectory, function (err, l8nFile) {
		if (err) return cb(err);

		Object.keys(l8nFile).forEach(function (key) {
			var l8nFileInfo = l8nFile[key];
			languageCache[l8nFileInfo.languageCode] = new GetTextSprintf(l8nFileInfo.languageCode, l8nFileInfo.contents);
			exports.locales.push({code: l8nFileInfo.languageCode, name: localeNames[l8nFileInfo.languageCode], selected: false});

			// if language code is in the form en_US, grab the "en" and point it to en_US as well
			// (unless we've already processed "en" of course). If we have an "en" po/mo file, it will
			// overwrite this

			if (~l8nFileInfo.languageCode.indexOf('_')) {
				var newCode = l8nFileInfo.languageCode.split('_').shift();

				if (!languageCache[newCode]) {
					exports.locales.push({code: newCode, name: localeNames[newCode], selected: false});
					languageCache[newCode] = languageCache[l8nFileInfo.languageCode];
				}
			}
		});
		localeCodes = exports.locales.map(function (loc) { return loc.code; });

		cb(null, exports.locales);
	});
};

module.exports.setLocale = function (locale) {
	if (!languageCache[locale]) return;

	exports.locales.forEach(function(localeObj, idx) {
		exports.locales[idx].selected = localeObj.code == locale;
	});
	exports.selectedLocale = languageCache[locale];
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
		// sort by q rank
	}).sort(function (lang1, lang2) {
		if (lang1.q < lang2.q)
			return 1;
		if (lang1.q > lang2.q)
			return -1;
		return 0;
		// limit to supported languages
	}).filter(function (lang) {
		return !!~localeCodes.indexOf(lang.code);
	}).shift(); // chose the best available

	return requestedLanguage ? requestedLanguage.code : null;
};
