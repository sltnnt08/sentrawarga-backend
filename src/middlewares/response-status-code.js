const toResponsePayload = (body, statusCode) => {
	if (body === undefined) {
		return { statusCode };
	}

	if (body === null) {
		return {
			statusCode,
			data: null,
		};
	}

	if (Array.isArray(body)) {
		return {
			statusCode,
			data: body,
		};
	}

	if (typeof body === 'object') {
		return {
			...body,
			statusCode,
		};
	}

	return {
		statusCode,
		data: body,
	};
};

export const responseStatusCode = (req, res, next) => {
	const originalJson = res.json.bind(res);

	res.json = (body) => originalJson(toResponsePayload(body, res.statusCode));

	next();
};
