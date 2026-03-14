import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const host = env.nodeEnv === 'production' ? '0.0.0.0' : 'localhost';

const server = app.listen(env.port, () => {
	console.log(`Server running on http://${host}:${env.port}`);
});

const shutdown = async (signal) => {
	console.log(`${signal} received, shutting down...`);
	server.close(async () => {
		await prisma.$disconnect();
		process.exit(0);
	});
};

process.on('SIGTERM', () => {
	void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
	void shutdown('SIGINT');
});

process.on('unhandledRejection', async (error) => {
	console.error('Unhandled rejection:', error);
	await prisma.$disconnect();
	process.exit(1);
});

process.on('uncaughtException', async (error) => {
	console.error('Uncaught exception:', error);
	await prisma.$disconnect();
	process.exit(1);
});
