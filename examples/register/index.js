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

var assetRoute = {
	path: '/public/{path*}',
	method: 'get',
	handler: {
		directory: {
			path: './public',
			listing: false,
			index: false
		}
	}
};
server.route(assetRoute);

var routes = [
	{
		method: 'GET',
		path: '/',
		handler: function (request, reply) {
			reply.view('index', {title: request.plugins.l10n.text.gettext("Register")});
		}
	}
];
server.route(routes);

var localeSetRoute = {
	method: 'GET',
	path: '/locale/{_locale}',
	config: {
		validate: {
			params: {
				_locale: Joi.string().required()
			}
		},
		handler: function (request, reply) {
			reply.redirect(request.info.referrer).state('_locale', request.params._locale);
		}
	}
};
server.route(localeSetRoute);

server.pack.register([
	{
		plugin: require('good')
	},
	{
		plugin: require('../../'),
		options: {
			cookieName: '_locale',
			l10nDirectory: path.resolve(__dirname, 'locales'),
			defaultLocale: 'en',
			excludeRoutes: [assetRoute, localeSetRoute],
			includedRoutes: routes
		}
	}
], function (err) {
	if (err) throw err;
	server.start(function () {
		server.log('info', 'Server running at: ' + server.info.uri);
	});
});
