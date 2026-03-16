import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? env.databaseUrl });

let PrismaClient = null;

try {
	const prismaClient = await import('@prisma/client');
	PrismaClient = prismaClient?.default?.PrismaClient ?? prismaClient?.PrismaClient ?? null;
} catch {
	PrismaClient = null;
}

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
