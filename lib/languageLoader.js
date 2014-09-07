var GetTextSprintfStub = require('./getTextSprintfStub');
var GetTextSprintf = require('./getTextSprintf');
var readL10nFiles = require('./readL10nFiles');
var localeNames = require('./localeNames');
var normalizeLocaleCode = require('./normalizeLocaleCode');

var languageCache = {};
var localeCodes = [];
var locales = [];
var devMode = false;

module.exports.setup = function (l10nDirectory, cb) {
	readL10nFiles(l10nDirectory, function (err, l10nFiles) {
		if (err) return cb(err);
		// l10nFiles: [{localeCode: 'en_US', contents: Buffer} ...]

		// if you've no PO/MO files yet, here's a test locale
		if(l10nFiles.length === 0) {
			var localeCode = 'test';
			languageCache[localeCode] = new GetTextSprintfStub(localeCode);
			locales.push({code: localeCode, name: 'Test Locale', selected: true});
			localeCodes = [localeCode];
			devMode = true;

			return cb(null, {
				dev: true,
				foundLocales: locales,
				localeCodes: localeCodes
			});
		}

		l10nFiles.forEach(function (l10nFileInfo) {
			// TODO - consider using a specific locale for a more general one, if that general one is not present, e.g. zh-tw for zh
			l10nFileInfo.localeCode = normalizeLocaleCode(l10nFileInfo.localeCode);

			languageCache[l10nFileInfo.localeCode] = new GetTextSprintf(l10nFileInfo.localeCode, l10nFileInfo.contents);

			locales.push({
				code: l10nFileInfo.localeCode,
				name: localeNames[l10nFileInfo.localeCode],
				selected: false
			});
		});

		localeCodes = locales.map(function (loc) { return loc.code; });

		return cb(null, {
			dev: false,
			foundLocales: locales,
			localeCodes: localeCodes
		});
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

	var preferredLanguage = headerValue.split(',').map(function (localePref) {
		var a = localePref.split(';');
		return {
			locale: a[0].toLowerCase(),
			q: parseFloat((a[1] || 'q=1.0').split('=').pop())
		};
	}).sort(function (pref1, pref2) { // sort by q rank desc
		if (pref1.q < pref2.q) return 1;
		if (pref1.q > pref2.q) return -1;
		return 0;
	}).filter(function (pref) { // limit to supported languages
		return ~localeCodes.indexOf(pref.locale);
	}).shift(); // chose the best available

	return preferredLanguage ? preferredLanguage.locale : null;
};

// used by tests currently
module.exports.clear = function () {
	languageCache = {};
	localeCodes = [];
	locales = [];
};
