import { createClient } from '@supabase/supabase-js';
import { login, register, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } from '../services/auth-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

let supabaseClient = supabase;

export const setSupabaseClientForTest = (client) => {
	supabaseClient = client;
};

export const registerHandler = asyncHandler(async (req, res) => {
	const result = await register(req.validated.body);
	res.status(201).json({
		success: true,
		message: result.message || 'Register success',
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

export const verifyEmailHandler = asyncHandler(async (req, res) => {
	const result = await verifyEmail(req.validated.body);
	res.json({
		success: true,
		message: result.message,
		data: result,
	});
});

export const resendVerificationEmailHandler = asyncHandler(async (req, res) => {
	const result = await resendVerificationEmail(req.validated.body);
	res.json({
		success: true,
		message: result.message,
	});
});

export const forgotPasswordHandler = asyncHandler(async (req, res) => {
	const result = await forgotPassword(req.validated.body);
	res.json({
		success: true,
		message: result.message,
	});
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
	const result = await resetPassword(req.validated.body);
	res.json({
		success: true,
		message: result.message,
		data: result,
	});
});

export const meHandler = asyncHandler(async (req, res) => {
	res.json({
		success: true,
		data: req.user,
	});
});

export const callbackHandler = asyncHandler(async (req, res) => {
	const { code } = req.query;

	if (!code || typeof code !== 'string' || !supabaseClient) {
		return res.redirect('/login');
	}

	try {
		const { error } = await supabaseClient.auth.exchangeCodeForSession(code);

		if (error) {
			return res.redirect('/login');
		}
	} catch {
		return res.redirect('/login');
	}

	return res.redirect('/dashboard');
});
