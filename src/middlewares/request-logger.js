export const requestLogger = (req, res, next) => {
	const startTime = Date.now();

	res.on('finish', () => {
		const durationMs = Date.now() - startTime;
		const logPayload = {
			level: 'info',
			time: new Date().toISOString(),
			requestId: req.requestId,
			method: req.method,
			path: req.originalUrl,
			statusCode: res.statusCode,
			durationMs,
			ip: req.ip,
		};

		console.log(JSON.stringify(logPayload));
	});

	next();
};
