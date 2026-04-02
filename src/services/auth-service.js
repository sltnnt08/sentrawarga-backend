import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { signAccessToken } from '../utils/jwt.js';
import { generateToken } from '../utils/token.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email-service.js';

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const transientDbCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'P1001', 'P1002']);

const isTransientDbError = (error) => {
	const code = String(error?.code ?? '').toUpperCase();
	const message = String(error?.message ?? '').toUpperCase();

	if (transientDbCodes.has(code)) {
		return true;
	}

	return (
		message.includes('ETIMEDOUT') ||
		message.includes("CAN'T REACH DATABASE SERVER") ||
		(message.includes('CONNECTION') && message.includes('TIMEOUT'))
	);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withDbRetry = async (operation, maxAttempts = 3) => {
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			if (!isTransientDbError(error) || attempt === maxAttempts) {
				throw error;
			}

			await wait(attempt * 200);
		}
	}

	throw new HttpError(503, 'Database is temporarily unavailable');
};

const sanitizeUser = (user) => ({
	id: user.id,
	name: user.name,
	email: user.email,
	address: user.address,
	role: user.role,
	emailVerified: user.emailVerified,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
});

export const register = async ({ name, email, password, address }) => {
	const existingUser = await prisma.user.findUnique({ where: { email } });
	if (existingUser) {
		throw new HttpError(409, 'Email already registered');
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const verificationToken = generateToken();

	const user = await prisma.user.create({
		data: {
			name,
			email,
			password: passwordHash,
			address,
			emailVerificationToken: verificationToken,
			emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
		},
	});

	// Send verification email
	try {
		await sendVerificationEmail(email, verificationToken);
	} catch (error) {
		console.error('Failed to send verification email:', error);
		// Jangan gagalkan register jika email gagal, tapi log error
	}

	const accessToken = signAccessToken({ sub: user.id, role: user.role });
	return {
		accessToken,
		user: sanitizeUser(user),
		message: 'Silakan verifikasi email Anda',
	};
};

export const login = async ({ email, password }) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new HttpError(401, 'Invalid email or password');
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);
	if (!isPasswordValid) {
		throw new HttpError(401, 'Invalid email or password');
	}

	const accessToken = signAccessToken({ sub: user.id, role: user.role });
	return {
		accessToken,
		user: sanitizeUser(user),
	};
};

export const loginOrRegisterWithGoogle = async ({ idToken }) => {
	if (!googleClient || !env.googleClientId || !env.googleClientId.includes('.apps.googleusercontent.com')) {
		throw new HttpError(400, 'Google auth belum dikonfigurasi dengan benar di server');
	}

	let payload;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken,
			audience: env.googleClientId,
		});
		payload = ticket.getPayload();
	} catch {
		throw new HttpError(401, 'Invalid Google token');
	}

	const email = payload?.email?.trim().toLowerCase();
	if (!email || payload?.email_verified !== true) {
		throw new HttpError(401, 'Google account email is not verified');
	}

	const name = payload.name?.trim() || email.split('@')[0] || 'Pengguna Google';
	const randomPasswordHash = await bcrypt.hash(generateToken(24), 10);

	const user = await withDbRetry(() =>
		prisma.user.upsert({
			where: { email },
			create: {
				name,
				email,
				password: randomPasswordHash,
				emailVerified: true,
			},
			update: {
				emailVerified: true,
				emailVerificationToken: null,
				emailVerificationExpires: null,
			},
		}),
	);

	const accessToken = signAccessToken({ sub: user.id, role: user.role });
	return {
		accessToken,
		user: sanitizeUser(user),
	};
};

export const verifyEmail = async ({ email, token }) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new HttpError(404, 'User not found');
	}

	if (user.emailVerified) {
		throw new HttpError(400, 'Email already verified');
	}

	if (user.emailVerificationToken !== token) {
		throw new HttpError(400, 'Invalid verification token');
	}

	if (!user.emailVerificationExpires || new Date() > user.emailVerificationExpires) {
		throw new HttpError(400, 'Verification token expired');
	}

	const updatedUser = await prisma.user.update({
		where: { email },
		data: {
			emailVerified: true,
			emailVerificationToken: null,
			emailVerificationExpires: null,
		},
	});

	const accessToken = signAccessToken({ sub: updatedUser.id, role: updatedUser.role });
	return {
		accessToken,
		user: sanitizeUser(updatedUser),
		message: 'Email verified successfully',
	};
};

export const resendVerificationEmail = async ({ email }) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new HttpError(404, 'User not found');
	}

	if (user.emailVerified) {
		throw new HttpError(400, 'Email already verified');
	}

	// Generate new token
	const verificationToken = generateToken();
	await prisma.user.update({
		where: { email },
		data: {
			emailVerificationToken: verificationToken,
			emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
		},
	});

	// Send email
	await sendVerificationEmail(email, verificationToken);

	return {
		message: 'Verification email sent',
	};
};

export const forgotPassword = async ({ email }) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		// Jangan reveal apakah email terdaftar atau tidak (security best practice)
		return { message: 'If email exists, reset link will be sent' };
	}

	const resetToken = generateToken();
	await prisma.user.update({
		where: { email },
		data: {
			resetPasswordToken: resetToken,
			resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 jam
		},
	});

	// Send reset email
	try {
		await sendPasswordResetEmail(email, resetToken);
	} catch (error) {
		console.error('Failed to send reset password email:', error);
	}

	return {
		message: 'If email exists, reset link will be sent',
	};
};

export const resetPassword = async ({ email, token, newPassword }) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new HttpError(404, 'User not found');
	}

	if (user.resetPasswordToken !== token) {
		throw new HttpError(400, 'Invalid reset token');
	}

	if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
		throw new HttpError(400, 'Reset token expired');
	}

	const passwordHash = await bcrypt.hash(newPassword, 10);
	const updatedUser = await prisma.user.update({
		where: { email },
		data: {
			password: passwordHash,
			resetPasswordToken: null,
			resetPasswordExpires: null,
		},
	});

	const accessToken = signAccessToken({ sub: updatedUser.id, role: updatedUser.role });
	return {
		accessToken,
		user: sanitizeUser(updatedUser),
		message: 'Password reset successful',
	};
};
