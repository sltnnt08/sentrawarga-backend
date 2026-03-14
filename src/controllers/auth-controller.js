import { login, register } from '../services/auth-service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const registerHandler = asyncHandler(async (req, res) => {
	const result = await register(req.validated.body);
	res.status(201).json({
		success: true,
		message: 'Register success',
		data: result,
	});
});

export const loginHandler = asyncHandler(async (req, res) => {
	const result = await login(req.validated.body);
	res.json({
		success: true,
		message: 'Login success',
		data: result,
	});
});

export const meHandler = asyncHandler(async (req, res) => {
	res.json({
		success: true,
		data: req.user,
	});
});
