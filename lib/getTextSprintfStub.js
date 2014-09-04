var vsprintf = require("sprintf-js").vsprintf;
var __slice = Array.prototype.slice;

module.exports = GetTextSprintfStub;

function GetTextSprintfStub(locale) {
	if (!(this instanceof GetTextSprintfStub)) return new GetTextSprintfStub(locale);

	// get text
	function gettext() {
		var args = __slice.call(arguments);
		var msgId = args[0];

		var text = msgId;
		if (args.length === 1) return text;

		return vsprintf(text, __slice.call(args, 1));
	}

	// get text from context
	function pgettext() {
		var args = __slice.call(arguments);
		var msgContext = args[0];
		var msgId = args[1];

		var text = msgId;
		if (args.length === 2) return text;

		return vsprintf(text, __slice.call(args, 2));
	}

	// get plural text
	function ngettext() {
		var args = __slice.call(arguments);
		var msgId = args[0];
		var amt = args[1];

		var text = msgId;
		if (args.length === 2) return text;

		return vsprintf(text, __slice.call(args, 2));
	}

	// get plural text from context
	function npgettext() {
		var args = __slice.call(arguments);
		var msgContext = args[0];
		var msgId = args[1];
		var amt = args[2];

		var text = msgId;
		if (args.length === 3) return text;

		return vsprintf(text, __slice.call(args, 3));
	}

	return {
		locale: locale,
		gettext: gettext,
		pgettext: pgettext,
		ngettext: ngettext,
		npgettext: npgettext
	};
}
