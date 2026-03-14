import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? env.databaseUrl });

export const prisma = new PrismaClient({ adapter });
