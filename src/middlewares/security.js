import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.js';

const defaultCorsOrigins = ['http://localhost:5173', 'https://sentrawarga.my.id', 'https://www.sentrawarga.my.id'];

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
