import { z } from 'zod';

const reportIdParams = z.object({
	reportId: z.string().uuid(),
});

export const createCommentSchema = z.object({
	body: z.object({
		content: z.string().min(1).max(2000),
	}),
	query: z.object({}).optional(),
	params: reportIdParams,
});

export const listCommentsSchema = z.object({
	body: z.object({}).optional(),
	query: z.object({
		page: z.coerce.number().int().positive().optional(),
		limit: z.coerce.number().int().positive().max(50).optional(),
	}),
	params: reportIdParams,
});
