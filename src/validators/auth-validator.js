import { z } from 'zod';

export const registerSchema = z.object({
	body: z.object({
		name: z.string().min(2).max(100),
		email: z.string().email().max(120),
		password: z.string().min(8).max(100),
		address: z.string().max(255).optional(),
	}),
	query: z.object({}).optional(),
	params: z.object({}).optional(),
});

export const loginSchema = z.object({
	body: z.object({
		email: z.string().email().max(120),
		password: z.string().min(8).max(100),
	}),
	query: z.object({}).optional(),
	params: z.object({}).optional(),
});
