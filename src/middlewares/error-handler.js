import { env } from '../config/env.js';

export const notFoundHandler = (req, res) => {
	res.status(404).json({
		success: false,
		message: 'Route not found',
		requestId: req.requestId,
	});
};

export const errorHandler = (error, req, res, next) => {
	if (res.headersSent) {
		return next(error);
	}

	const statusCode = error.statusCode ?? 500;
	const isServerError = statusCode >= 500;
	const message = isServerError && env.nodeEnv === 'production' ? 'Internal server error' : error.message;

	res.status(statusCode).json({
		success: false,
		message: message ?? 'Internal server error',
		requestId: req.requestId,
		...(isServerError ? {} : { details: error.details }),
	});
};
