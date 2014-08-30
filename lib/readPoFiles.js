var fs = require('fs');
var path = require('path');
var async = require('async');
var recursive = require('recursive-readdir');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

module.exports = function(dir, cb) {
	if (!dir) return setImmediate(cb.call(cb, new Error('dir parameter required')));

	recursive(dir, function (err, poPaths) {
		if(err) return cb(err);

		poPaths = poPaths.filter(function(poPath) {
			return path.extname(poPath).toLowerCase() === '.po';
		});

		async.map(poPaths, function(poPath, mCb) {
			fs.readFile(poPath, getLanguage(poPath, mCb));
		}, cb);
	});
};

function getLanguage(poPath, cb) {
	var regex = new RegExp(/"Language\:\s*(\w+)/);

	return function(err, fileContents) {
		if(err) return cb(err);

		var str = decoder.write(fileContents);
		var result = {languageCode: 'unknown', contents: fileContents};

		var matches = str.match(regex);
		if(!matches)
			return cb(new Error("Invalid PO file: " + poPath));

		result.languageCode = matches[1];
		return cb(null, result);
	};
}
