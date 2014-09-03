var path = require('path');
var Hapi = require('hapi');
var Joi = require('joi');

var server = new Hapi.Server('0.0.0.0', process.env.PORT || 8080, {
	views: {
		engines: {
			hbs: require('handlebars')
		},
		path: path.join(__dirname, 'views/templates'),
		partialsPath: path.join(__dirname, 'views/partials')
	}
});

server.route({
	path: '/public/{path*}',
	method: 'GET',
	handler: {
		directory: {
			path: './public',
			listing: false,
			index: false
		}
	}
});

server.route({
	method: 'GET',
	path: '/',
	handler: function (request, reply) {
		reply.view('index', {title: request.plugins.l10n.text.gettext("Register")});
	}
});

server.pack.register([{
	plugin: require('good')
}, {
	plugin: require('../../'),
	options: {
		cookieName: '_locale',
		l10nDirectory: path.resolve(__dirname, 'locales'),
		defaultLocale: 'en',
		ignoreL10nFunction: function(reqPath) {
			return ~reqPath.indexOf('/public/') || ~reqPath.indexOf('favicon');
		}
	}
}], function (err) {
	if (err) throw err;
	server.start(function () {
		server.log('info', 'Server running at: ' + server.info.uri);
	});
});
