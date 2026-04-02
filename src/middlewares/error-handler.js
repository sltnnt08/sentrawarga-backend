import { env } from '../config/env.js';

const transientDbCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'P1001', 'P1002']);

const isTransientDbError = (error) => {
	const code = String(error?.code ?? '').toUpperCase();
	const message = String(error?.message ?? '').toUpperCase();

	if (transientDbCodes.has(code)) {
		return true;
	}

	return (
		message.includes('ETIMEDOUT') ||
		message.includes("CAN'T REACH DATABASE SERVER") ||
		(message.includes('CONNECTION') && message.includes('TIMEOUT'))
	);
};

const buildErrorLogPayload = (error, req, statusCode) => ({
	level: statusCode >= 500 ? 'error' : 'warn',
	time: new Date().toISOString(),
	requestId: req.requestId,
	method: req.method,
	path: req.originalUrl,
	statusCode,
	errorName: error?.name,
	errorMessage: error?.message,
	errorCode: error?.code,
	errorStack: error?.stack,
	errorDetails: error?.details,
});

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

	const statusCode = error.statusCode ?? (isTransientDbError(error) ? 503 : 500);
	const isServerError = statusCode >= 500;
	const message =
		statusCode === 503
			? 'Database is temporarily unavailable, please try again'
			: isServerError && env.nodeEnv === 'production'
				? 'Internal server error'
				: error.message;

	console.error(JSON.stringify(buildErrorLogPayload(error, req, statusCode)));

	res.status(statusCode).json({
		success: false,
		message: message ?? 'Internal server error',
		requestId: req.requestId,
		...(isServerError ? {} : { details: error.details }),
	});
};
