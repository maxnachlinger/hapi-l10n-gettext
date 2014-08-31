var extsprintf = require('extsprintf');
var Gettext = require("node-gettext");
var __slice = Array.prototype.slice;

module.exports = GetTextSprintf;

function GetTextSprintf(locale, fileContents) {
	if (!(this instanceof GetTextSprintf)) return new GetTextSprintf(locale, fileContents);

	var gt = new Gettext();
	gt.addTextdomain(locale, fileContents);

	// get text
	function gettext() {
		var args = __slice.call(arguments);
		var msgId = args[0];

		var text = gt.dgettext(locale, msgId);
		if (args.length === 1) return text;

		var sprintfArgs = [ text ].concat(__slice.call(args, 1));
		return extsprintf.sprintf.apply(this, sprintfArgs);
	}

	// get text from context
	function pgettext() {
		var args = __slice.call(arguments);
		var msgContext = args[0];
		var msgId = args[1];

		var text = gt.dpgettext(locale, msgContext, msgId);
		if (args.length === 2) return text;

		var sprintfArgs = [ text ].concat(__slice.call(args, 2));
		return extsprintf.sprintf.apply(this, sprintfArgs);
	}

	// get plural text
	function ngettext() {
		var args = __slice.call(arguments);
		var msgId = args[0];
		var amt = args[1];

		var text = gt.dngettext(locale, msgId, null, amt);
		if (args.length === 2) return text;

		var sprintfArgs = [ text ].concat(__slice.call(args, 2));
		return extsprintf.sprintf.apply(this, sprintfArgs);
	}

	// get plural text from context
	function npgettext() {
		var args = __slice.call(arguments);
		var msgContext = args[0];
		var msgId = args[1];
		var amt = args[2];

		var text = gt.dnpgettext(locale, msgContext, msgId, null, amt);
		if (args.length === 3) return text;

		var sprintfArgs = [ text ].concat(__slice.call(args, 3));
		return extsprintf.sprintf.apply(this, sprintfArgs);
	}

	return {
		locale: locale,
		gettext: gettext,
		pgettext: pgettext,
		ngettext: ngettext,
		npgettext: npgettext
	};
}
