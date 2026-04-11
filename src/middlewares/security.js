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

const stripWrappingQuotes = (value) => {
	const trimmed = value.trim();

	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1).trim();
	}

	return trimmed;
};

const normalizeOrigin = (value) => {
	const normalizedValue = stripWrappingQuotes(String(value ?? '')).replace(/\/+$/, '');

	if (!normalizedValue || normalizedValue === '*') {
		return normalizedValue;
	}

	try {
		const url = new URL(normalizedValue);
		const protocol = url.protocol.toLowerCase();
		const hostname = url.hostname.toLowerCase();
		const port = url.port ? `:${url.port}` : '';

		return `${protocol}//${hostname}${port}`;
	} catch {
		return normalizedValue;
	}
};

const toCorsOrigins = (value) =>
	value
		.split(',')
		.map((item) => normalizeOrigin(item))
		.filter(Boolean);

const normalizedDefaultCorsOrigins = defaultCorsOrigins.map((origin) => normalizeOrigin(origin));

export const corsOriginAllowlist = [...new Set([...normalizedDefaultCorsOrigins, ...toCorsOrigins(env.corsOrigin)])];

export const isCorsOriginAllowed = (origin) => {
	if (!origin) {
		return true;
	}

	const normalizedOrigin = normalizeOrigin(origin);

	return corsOriginAllowlist.includes('*') || corsOriginAllowlist.includes(normalizedOrigin);
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
