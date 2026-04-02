import 'dotenv/config';
import { z } from 'zod';

const toInt = (value, fallback) => {
	const parsed = Number.parseInt(value ?? '', 10);
	return Number.isNaN(parsed) ? fallback : parsed;
};

const toBoolean = (value, fallback = false) => {
	if (value == null || value === '') {
		return fallback;
	}
	if (typeof value === 'boolean') {
		return value;
	}
	return String(value).toLowerCase() === 'true';
};

const schema = z.object({
	nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
	port: z.number().int().positive().default(3000),
	corsOrigin: z.string().min(1).default('http://localhost:5173'),
	databaseUrl: z.string().min(1),
	jwtSecret: z.string().min(16),
	jwtExpiresIn: z.string().min(1).default('1d'),
	bodyLimit: z.string().min(2).default('1mb'),
	rateLimitWindowMs: z.number().int().positive().default(15 * 60 * 1000),
	rateLimitMax: z.number().int().positive().default(200),
	authRateLimitMax: z.number().int().positive().default(20),
	trustProxy: z.boolean().default(false),
	geminiApiKey: z.string().optional().default(''),
	sendpulseSmtpHost: z.string().min(1).default('smtp-pulse.com'),
	sendpulseSmtpPort: z.number().int().positive().default(465),
	sendpulseSmtpSecure: z.boolean().default(true),
	sendpulseSmtpUser: z.string().optional().default(''),
	sendpulseSmtpPass: z.string().optional().default(''),
	sendpulseFromEmail: z.string().optional().default(''),
	sendpulseReplyTo: z.string().optional().default(''),
	sendpulseTestTo: z.string().optional().default(''),
	googleClientId: z.string().optional().default(''),
	googleClientSecret: z.string().optional().default(''),
	googleCallbackUrl: z.string().optional().default(''),
	appBaseUrl: z.string().min(1).default('http://localhost:5173'),
});

const rawEnv = {
	nodeEnv: process.env.NODE_ENV,
	port: toInt(process.env.PORT, 3000),
	corsOrigin: process.env.CORS_ORIGIN,
	databaseUrl: process.env.DATABASE_URL,
	jwtSecret: process.env.JWT_SECRET,
	jwtExpiresIn: process.env.JWT_EXPIRES_IN,
	bodyLimit: process.env.BODY_LIMIT,
	rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
	rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 200),
	authRateLimitMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
	trustProxy: toBoolean(process.env.TRUST_PROXY, false),
	geminiApiKey: process.env.GEMINI_API_KEY,
	sendpulseSmtpHost: process.env.SENDPULSE_SMTP_HOST,
	sendpulseSmtpPort: toInt(process.env.SENDPULSE_SMTP_PORT, 465),
	sendpulseSmtpSecure: toBoolean(process.env.SENDPULSE_SMTP_SECURE, true),
	sendpulseSmtpUser: process.env.SENDPULSE_SMTP_USER,
	sendpulseSmtpPass: process.env.SENDPULSE_SMTP_PASS,
	sendpulseFromEmail: process.env.SENDPULSE_FROM_EMAIL,
	sendpulseReplyTo: process.env.SENDPULSE_REPLY_TO,
	sendpulseTestTo: process.env.SENDPULSE_TEST_TO,
	googleClientId: process.env.GOOGLE_CLIENT_ID,
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
	googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
	appBaseUrl: process.env.APP_BASE_URL,
};

const parsedEnv = schema.parse(rawEnv);

if (parsedEnv.nodeEnv === 'production' && parsedEnv.jwtSecret === 'change-this-jwt-secret') {
	throw new Error('JWT_SECRET must be changed for production');
}

export const env = parsedEnv;
