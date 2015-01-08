var localeRegex = /\_/g;

module.exports = function (locale) {
	// PO/MO locales are often for locales formatted as en_US, but the web likes en-us. The web wins.
	locale = locale.replace(localeRegex, '-').toLowerCase();

	// handle special locales - add more here and kick me a pull request
	return {
			'zh-hant': 'zh-tw',
			'zh-hant-tw': 'zh-tw',
			'zh-hant-hk': 'zh-tw',
			'zh-hans': 'zh-cn',
			'zh-hans-cn': 'zh-cn',
			'zh-hans-sg': 'zh-cn'
		}[locale] || locale;
};
