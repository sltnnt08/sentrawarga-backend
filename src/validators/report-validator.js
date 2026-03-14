import { Category, Priority, ReportStatus } from '@prisma/client';
import { z } from 'zod';

const categoryEnum = z.nativeEnum(Category);
const priorityEnum = z.nativeEnum(Priority);
const reportStatusEnum = z.nativeEnum(ReportStatus);

export const createReportSchema = z.object({
	body: z.object({
		title: z.string().min(3).max(200),
		description: z.string().min(10).max(3000),
		category: z.array(categoryEnum).min(1),
		priority: priorityEnum,
		latitude: z.number().optional(),
		longitude: z.number().optional(),
		address: z.string().max(255).optional(),
	}),
	query: z.object({}).optional(),
	params: z.object({}).optional(),
});

export const listReportsSchema = z.object({
	body: z.object({}).optional(),
	query: z.object({
		status: reportStatusEnum.optional(),
		priority: priorityEnum.optional(),
		category: categoryEnum.optional(),
		page: z.coerce.number().int().positive().optional(),
		limit: z.coerce.number().int().positive().max(50).optional(),
	}),
	params: z.object({}).optional(),
});

export const reportIdParamSchema = z.object({
	body: z.object({}).optional(),
	query: z.object({}).optional(),
	params: z.object({
		id: z.string().uuid(),
	}),
});

export const updateReportStatusSchema = z.object({
	body: z.object({
		status: reportStatusEnum,
	}),
	query: z.object({}).optional(),
	params: z.object({
		id: z.string().uuid(),
	}),
});
