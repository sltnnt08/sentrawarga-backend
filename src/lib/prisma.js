import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '../config/env.js';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

const resolveConnectionString = () => {
	const primaryConnectionString = isNonEmptyString(process.env.DATABASE_URL)
		? process.env.DATABASE_URL.trim()
		: isNonEmptyString(env.databaseUrl)
			? env.databaseUrl.trim()
			: '';
	const localConnectionString = isNonEmptyString(env.localDatabaseUrl)
		? env.localDatabaseUrl.trim()
		: '';
	const useLocalConnection = process.env.PRISMA_USE_LOCAL_DATABASE === 'true';

	if (env.nodeEnv !== 'production' && localConnectionString && useLocalConnection) {
		return localConnectionString;
	}

	if (primaryConnectionString) {
		return primaryConnectionString;
	}

	if (localConnectionString) {
		return localConnectionString;
	}

	return env.databaseUrl;
};

const isTlsConnection = (connectionString) => {
	try {
		const parsedUrl = new URL(connectionString);
		const sslMode = parsedUrl.searchParams.get('sslmode')?.toLowerCase();
		const sslEnabled = parsedUrl.searchParams.get('ssl')?.toLowerCase();

		return Boolean(
			sslMode && ['require', 'verify-ca', 'verify-full', 'no-verify'].includes(sslMode),
		) || sslEnabled === 'true';
	} catch {
		return false;
	}
};

const normalizeTlsModeForDevelopment = (connectionString) => {
	if (env.nodeEnv === 'production' || env.databaseSslRejectUnauthorized) {
		return connectionString;
	}

	try {
		const parsedUrl = new URL(connectionString);
		const sslMode = parsedUrl.searchParams.get('sslmode')?.toLowerCase();

		if (!sslMode || sslMode === 'disable') {
			return connectionString;
		}

		parsedUrl.searchParams.set('sslmode', 'no-verify');
		return parsedUrl.toString();
	} catch {
		return connectionString;
	}
};

const connectionString = normalizeTlsModeForDevelopment(resolveConnectionString());
const poolConfig = {
	connectionString,
};

if (isTlsConnection(connectionString)) {
	poolConfig.ssl = {
		rejectUnauthorized: env.databaseSslRejectUnauthorized,
	};
}

const adapter = new PrismaPg(new Pool(poolConfig));

const prismaClientModule = await import('@prisma/client').catch(() => null);
const PrismaClient =
	prismaClientModule?.default?.PrismaClient ?? prismaClientModule?.PrismaClient ?? null;

const unavailablePrismaError = new Error(
	'Prisma client is not generated. Run `npx prisma generate` in the project environment.',
);

const unavailablePrisma = new Proxy(
	{},
	{
		get() {
			throw unavailablePrismaError;
		},
	},
);

export const prisma = PrismaClient ? new PrismaClient({ adapter }) : unavailablePrisma;
