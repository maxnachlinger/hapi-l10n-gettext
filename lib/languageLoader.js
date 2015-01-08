var GetTextSprintfStub = require('./getTextSprintfStub');
var GetTextSprintf = require('./getTextSprintf');
var readL10nFiles = require('./readL10nFiles');
var localeNames = require('./localeNames');
var normalizeLocaleCode = require('./normalizeLocaleCode');
var acceptHeaderParser = require('accept-language-parser');

var languageCache = {};
var localeCodes = [];
var localeObjects = [];
var devMode = false;

module.exports.setup = function (l10nDirectory, cb) {
	readL10nFiles(l10nDirectory, function (err, l10nFiles) {
		// l10nFiles: [{localelocale: 'en_US', contents: Buffer} ...]

		// if you've no PO/MO files yet, here's a test locale
		if(err || l10nFiles.length === 0) {
			if(err) console.error(err);

			var localeCode = 'test';
			languageCache[localeCode] = new GetTextSprintfStub(localeCode);
			localeObjects.push({locale: localeCode, name: 'Test Locale', selected: true});
			localeCodes = [localeCode];
			devMode = true;

			return cb(null, {
				dev: true,
				locales: localeObjects,
				localeCodes: localeCodes
			});
		}

		l10nFiles.forEach(function (l10nFileInfo) {
			// TODO - consider using a specific locale for a more general one, if that general one is not present, e.g. zh-tw for zh
			l10nFileInfo.localeCode = normalizeLocaleCode(l10nFileInfo.localeCode);

			languageCache[l10nFileInfo.localeCode] = new GetTextSprintf(l10nFileInfo.localeCode, l10nFileInfo.contents);

			localeObjects.push({
				locale: l10nFileInfo.localeCode,
				name: localeNames[l10nFileInfo.localeCode],
				selected: false
			});
		});

		localeCodes = localeObjects.map(function (loc) { return loc.locale; });

		return cb(null, {
			dev: false,
			locales: localeObjects,
			localeCodes: localeCodes
		});
	});
};

module.exports.getMethodsForLocale = function (locale) {
	var gettextMethods = languageCache[locale];
	if (!gettextMethods) return;

	var ret = gettextMethods;
	ret.locales = localeObjects.concat();

	ret.locales.forEach(function(o, idx) {
		if(o.locale == locale)
			ret.selectedLocale = o;
	});

	return ret;
};

// currently used by tests only
module.exports.getLocaleCodes = function () {
	return localeCodes.concat();
};

// Parse the Accept-Language header value, which often looks like:
// "en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4,zh-CN;q=0.2";
module.exports.getHeaderLocale = function (headerValue) {
	if (!headerValue) return;
	
	var bestMatch = {
	  code: null,
	  region: null
	};
	
	acceptLanguages = acceptHeaderParser.parse( headerValue );
	acceptLanguages.forEach(function(acceptLanguage) {
	  if ( bestMatch.code && bestMatch.region ) {
	    return;
	  }
	  code = acceptLanguage.code.toLowerCase();
	  if ( bestMatch.code && bestMatch.code !== code ) {
	    return;
	  }
	  if ( acceptLanguage.region ) {
	    region = acceptLanguage.region.toLowerCase();
	    if ( localeCodes.indexOf( code + "-" + region ) !== -1 ) {
	      bestMatch.code = code;
	      bestMatch.region = region;
	      return;
	    }
	  }
	  if ( !bestMatch.code && localeCodes.indexOf( code ) !== -1 ) {
	    bestMatch.code = code;
	  }
  });
	
	if ( !bestMatch.code ) {
	  return null;
	}
	
	return bestMatch.region ? bestMatch.code + "-" + bestMatch.region : bestMatch.code;
};

// used by tests currently
module.exports.clear = function () {
	languageCache = {};
	locales = [];
	localeObjects = [];
};
