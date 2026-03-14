import { VoteType } from '@prisma/client';
import { z } from 'zod';

const reportIdParams = z.object({
	reportId: z.string().uuid(),
});

export const voteUpsertSchema = z.object({
	body: z.object({
		type: z.nativeEnum(VoteType),
	}),
	query: z.object({}).optional(),
	params: reportIdParams,
});

export const voteParamsSchema = z.object({
	body: z.object({}).optional(),
	query: z.object({}).optional(),
	params: reportIdParams,
});

export const voteSummarySchema = z.object({
	body: z.object({}).optional(),
	query: z.object({}).optional(),
	params: reportIdParams,
});
