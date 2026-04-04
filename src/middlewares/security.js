import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.js';

const developmentCorsOrigins = [
	'http://localhost:5173',
	'http://localhost:8080',
	'http://127.0.0.1:5173',
	'http://127.0.0.1:8080',
	'http://localhost:3000',
	'http://127.0.0.1:3000',
];

const productionCorsOrigins = [
	'https://sentrawarga.my.id',
	'https://www.sentrawarga.my.id',
];

const defaultCorsOrigins = env.nodeEnv === 'production' ? productionCorsOrigins : developmentCorsOrigins;

const toCorsOrigins = (value) =>
	value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);

export const corsOriginAllowlist = [...new Set([...defaultCorsOrigins, ...toCorsOrigins(env.corsOrigin)])];

export const isCorsOriginAllowed = (origin) => {
	if (!origin) {
		return true;
	}

	return corsOriginAllowlist.includes('*') || corsOriginAllowlist.includes(origin);
};

export const securityHeaders = helmet({
	crossOriginResourcePolicy: false,
	crossOriginOpenerPolicy: false,
});

export const apiRateLimiter = rateLimit({
	windowMs: env.rateLimitWindowMs,
	max: env.rateLimitMax,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: 'Too many requests, please try again later',
	},
});

export const authRateLimiter = rateLimit({
	windowMs: env.rateLimitWindowMs,
	max: env.authRateLimitMax,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: 'Too many authentication attempts, please try again later',
	},
});
