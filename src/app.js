import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { requestContext } from './middlewares/request-context.js';
import { requestLogger } from './middlewares/request-logger.js';
import { apiRateLimiter, corsOriginAllowlist, securityHeaders } from './middlewares/security.js';
import { authRoutes } from './routes/auth-routes.js';
import { apiRoutes } from './routes/index.js';

const app = express();

if (env.trustProxy) {
	app.set('trust proxy', 1);
}

app.disable('x-powered-by');
app.use(requestContext);
app.use(requestLogger);
app.use(securityHeaders);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || corsOriginAllowlist.includes(origin)) {
				return callback(null, true);
			}

			return callback(new Error('CORS origin not allowed'));
		},
	}),
);
app.use(express.json({ limit: env.bodyLimit }));
app.use(express.urlencoded({ extended: false, limit: env.bodyLimit }));
app.use(apiRateLimiter);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
	res.json({
		success: true,
		message: 'API running',
	});
});

app.get('/healthz', (req, res) => {
	res.json({
		success: true,
		status: 'ok',
		service: 'sentrawarga-backend',
		timestamp: new Date().toISOString(),
	});
});

app.get('/readyz', async (req, res, next) => {
	try {
		const { prisma } = await import('./lib/prisma.js');
		await prisma.$queryRawUnsafe('SELECT 1');
		res.json({
			success: true,
			status: 'ready',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		next(error);
	}
});

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
