var fs = require('fs');
var path = require('path');
var async = require('async');
var recursive = require('recursive-readdir');
var gettextParser = require('gettext-parser');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

module.exports = function (dir, cb) {
	if (!dir) return setImmediate(cb.call(cb, new Error('dir parameter required')));

	recursive(dir, function (err, foundFiles) {
		if (err) return cb(err);

		foundFiles = foundFiles.filter(function (poPath) {
			return ~['.po', '.mo'].indexOf(path.extname(poPath).toLowerCase());
		});

		async.map(foundFiles, function (poPath, mCb) {
			fs.readFile(poPath, parseFile(poPath, mCb));
		}, cb);
	});
};

function parseFile(poPath, cb) {
	var ext = path.extname(poPath).toLowerCase();
	var parse = gettextParser.po.parse;
	if (ext === '.mo')
		parse = gettextParser.mo.parse;

	return function (err, fileContents) {
		if (err) return cb(err);

		var parsed = parse(fileContents);
		if (!parsed || !parsed.headers.language)
			return cb(new Error("Invalid " + ext + " file: " + poPath));

		return cb(null, {languageCode: parsed.headers.language, contents: fileContents});
	};
}
