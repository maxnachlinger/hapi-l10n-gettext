var GetTextSprintf = require('./getTextSprintf');
var readL10nFiles = require('./readL10nFiles');
var localeNames = require('./localeNames');

var languageCache = {};
var localeCodes = [];
var locales = [];

module.exports.setup = function (l10nDirectory, cb) {
	readL10nFiles(l10nDirectory, function (err, l10nFiles) {
		if (err) return cb(err);

		Object.keys(l10nFiles).forEach(function (key) {
			var l10nFileInfo = l10nFiles[key];
			var code = l10nFileInfo.languageCode.replace(/\_/g, '-').toLowerCase(); // en_US -> en-us

			languageCache[code] = new GetTextSprintf(code, l10nFileInfo.contents);
			locales.push({code: code, name: localeNames[l10nFileInfo.languageCode], selected: false});
		});

		localeCodes = locales.map(function (loc) { return loc.code; });
		cb(null, locales);
	});
};

module.exports.getMethodsForLocale = function (locale) {
	var gettextMethods = languageCache[locale];
	if (!gettextMethods) return;

	var ret = {
		locales: locales.concat(),
		text: gettextMethods,
		selectedLocale: gettextMethods.locale
	};

	ret.locales.forEach(function(o, idx) {
		ret.locales[idx].selected = o.code == ret.selectedLocale;
	});

	return ret;
};

module.exports.getLocaleCodes = function () {
	return localeCodes.concat();
};

// Parse the Accept-Language header value, which often looks like:
// "en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4,zh-CN;q=0.2";
module.exports.getHeaderLocale = function (headerValue) {
	if (!headerValue) return;

	var requestedLanguage = headerValue.split(',').map(function (lang) {
		var a = lang.split(';');
		a[1] = (a[1] || 'q=1.0').split('=').pop() * 1;

		return { code: a[0].toLowerCase(), q: a[1] };
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

// used by tests currently
module.exports.clear = function () {
	languageCache = {};
	localeCodes = [];
	locales = [];
	exports.selectedLocale = {};
};
