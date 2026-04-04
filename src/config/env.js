import 'dotenv/config';
import { z } from 'zod';

const defaultCorsOriginByNodeEnv =
	process.env.NODE_ENV === 'production'
		? 'https://sentrawarga.my.id,https://www.sentrawarga.my.id'
		: 'http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173,http://127.0.0.1:8080';

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
	corsOrigin: z
		.string()
		.min(1)
		.default(defaultCorsOriginByNodeEnv),
	databaseUrl: z.string().min(1),
	localDatabaseUrl: z.string().optional().default(''),
	databaseSslRejectUnauthorized: z.boolean().default(true),
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
	supabaseUrl: z.string().optional().default(''),
	supabaseServiceRoleKey: z.string().optional().default(''),
	reportImageBucket: z.string().optional().default('report-images'),
	reportImagePublicBaseUrl: z.string().optional().default(''),
});

const resolvedSendpulseSmtpPort = toInt(process.env.SENDPULSE_SMTP_PORT, 465);
const resolvedSendpulseSmtpSecure = toBoolean(
	process.env.SENDPULSE_SMTP_SECURE,
	resolvedSendpulseSmtpPort === 465,
);

const rawEnv = {
	nodeEnv: process.env.NODE_ENV,
	port: toInt(process.env.PORT, 3000),
	corsOrigin: process.env.CORS_ORIGIN,
	databaseUrl: process.env.DATABASE_URL,
	localDatabaseUrl: process.env.LOCAL_DATABASE_URL,
	databaseSslRejectUnauthorized: toBoolean(
		process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
		process.env.NODE_ENV === 'production',
	),
	jwtSecret: process.env.JWT_SECRET,
	jwtExpiresIn: process.env.JWT_EXPIRES_IN,
	bodyLimit: process.env.BODY_LIMIT,
	rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
	rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 200),
	authRateLimitMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
	trustProxy: toBoolean(process.env.TRUST_PROXY, false),
	geminiApiKey: process.env.GEMINI_API_KEY,
	sendpulseSmtpHost: process.env.SENDPULSE_SMTP_HOST,
	sendpulseSmtpPort: resolvedSendpulseSmtpPort,
	sendpulseSmtpSecure: resolvedSendpulseSmtpSecure,
	sendpulseSmtpUser: process.env.SENDPULSE_SMTP_USER,
	sendpulseSmtpPass: process.env.SENDPULSE_SMTP_PASS,
	sendpulseFromEmail: process.env.SENDPULSE_FROM_EMAIL,
	sendpulseReplyTo: process.env.SENDPULSE_REPLY_TO,
	sendpulseTestTo: process.env.SENDPULSE_TEST_TO,
	googleClientId: process.env.GOOGLE_CLIENT_ID,
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
	googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
	appBaseUrl: process.env.APP_BASE_URL,
	supabaseUrl: process.env.SUPABASE_URL,
	supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
	reportImageBucket: process.env.SUPABASE_REPORT_IMAGE_BUCKET,
	reportImagePublicBaseUrl: process.env.SUPABASE_REPORT_IMAGE_PUBLIC_BASE_URL,
};

const parsedEnv = schema.parse(rawEnv);

if (parsedEnv.nodeEnv === 'production' && parsedEnv.jwtSecret === 'change-this-jwt-secret') {
	throw new Error('JWT_SECRET must be changed for production');
}

export const env = parsedEnv;
