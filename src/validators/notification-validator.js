import { z } from 'zod';

const booleanFromQuery = z.preprocess((value) => {
	if (value === 'true' || value === true) return true;
	if (value === 'false' || value === false) return false;
	return value;
}, z.boolean().optional());

export const listNotificationsSchema = z.object({
	body: z.object({}).optional(),
	query: z.object({
		page: z.coerce.number().int().positive().optional(),
		limit: z.coerce.number().int().positive().max(50).optional(),
		unreadOnly: booleanFromQuery,
	}),
	params: z.object({}).optional(),
});

export const notificationIdParamsSchema = z.object({
	body: z.object({}).optional(),
	query: z.object({}).optional(),
	params: z.object({
		id: z.string().uuid(),
	}),
});

export const markAllNotificationsReadSchema = z.object({
	body: z.object({}).optional(),
	query: z.object({}).optional(),
	params: z.object({}).optional(),
});
