module.exports = function (params) {
	params = params || {};
	params.excludedRoutes = params.excludedRoutes || [];
	params.includedRoutes = params.includedRoutes || [];

	var routeModes = {
		all: 1,
		include: 1 << 1,
		exclude: 1 << 2
	};
	var excluded = {};
	var included = {};

	// determine route mode
	var routeMode = routeModes.all;
	var routeModeDescription = 'allowing all routes';

	if (params.excludedRoutes.length > 0) {
		routeMode = routeModes.exclude;
		routeModeDescription = 'excluding some routes';
	}

	if (params.includedRoutes.length > 0) {
		if (routeMode == routeModes.all) {
			routeMode = routeModes.include;
			routeModeDescription = 'including some routes';
		} else {
			routeMode = routeMode | routeModes.include;
			routeModeDescription = 'including and excluding some routes';
		}
	}

	if (routeMode & routeModes.exclude) {
		(params.excludedRoutes || []).forEach(function (route) {
			if (!excluded[route.path])
				excluded[route.path] = {};

			excluded[route.path][route.method.toLowerCase()] = true;
		});
	}

	if (routeMode & routeModes.include) {
		(params.includedRoutes || []).forEach(function (route) {
			if (!included[route.path])
				included[route.path] = {};

			included[route.path][route.method.toLowerCase()] = true;
		});
	}

	function ignoreRequest(request) {
		if (!request.route) return true;
		if (routeMode & routeModes.all) return false;

		var include = (included[request.route.path] || {})[request.route.method];
		var exclude = (excluded[request.route.path] || {})[request.route.method];

		if (routeMode & routeModes.include & routeModes.exclude)
			return !include || exclude;

		if (routeMode & routeModes.exclude)
			return exclude;

		if (routeMode & routeModes.include)
			return !include;
	}

	return {
		ignoreRequest: ignoreRequest,
		routeMode: routeMode,
		routeModes: routeModes, // for tests currently
		routeModeDescription: routeModeDescription
	};
};
