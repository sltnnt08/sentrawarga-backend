import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { signAccessToken } from '../utils/jwt.js';
import { generateOtp, generateToken } from '../utils/token.js';
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

const isLegacyGoogleSchemaError = (error) => {
	if (String(error?.code ?? '').toUpperCase() !== 'P2022') {
		return false;
	}

	const message = String(error?.message ?? '');
	return (
		message.includes('`emailVerified`') ||
		message.includes('`emailVerificationToken`') ||
		message.includes('`emailVerificationExpires`')
	);
};

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
	points: typeof user.points === 'number' ? user.points : 0,
	emailVerified: user.emailVerified,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
});

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();
const verificationTokenTtlMs = 24 * 60 * 60 * 1000;

const generateUniqueVerificationCode = async (maxAttempts = 8) => {
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		const code = generateOtp();
		const existing = await prisma.user.findUnique({
			where: { emailVerificationToken: code },
			select: { id: true },
		});

		if (!existing) {
			return code;
		}
	}

	throw new HttpError(503, 'Gagal membuat kode verifikasi. Silakan coba lagi.');
};

export const register = async ({ name, email, password, address }) => {
	const normalizedEmail = normalizeEmail(email);
	const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (existingUser) {
		throw new HttpError(409, 'Email already registered');
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const verificationToken = await generateUniqueVerificationCode();

	const user = await prisma.user.create({
		data: {
			name,
			email: normalizedEmail,
			password: passwordHash,
			address,
			emailVerificationToken: verificationToken,
			emailVerificationExpires: new Date(Date.now() + verificationTokenTtlMs),
		},
	});

	// Send verification email
	let verificationEmailSent = true;
	try {
		await sendVerificationEmail(normalizedEmail, verificationToken);
	} catch (error) {
		verificationEmailSent = false;
		console.error('Failed to send verification email:', error);
		// Jangan gagalkan register jika email gagal, tapi log error
	}

	return {
		user: sanitizeUser(user),
		email: user.email,
		emailVerificationRequired: true,
		verificationEmailSent,
		message: verificationEmailSent
			? 'Silakan verifikasi email Anda'
			: 'Akun berhasil dibuat, tetapi email verifikasi gagal dikirim. Silakan kirim ulang email verifikasi.',
	};
};

export const login = async ({ email, password }) => {
	const normalizedEmail = normalizeEmail(email);
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		throw new HttpError(401, 'Invalid email or password');
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);
	if (!isPasswordValid) {
		throw new HttpError(401, 'Invalid email or password');
	}

	if (!user.emailVerified) {
		throw new HttpError(403, 'Email belum diverifikasi. Silakan verifikasi email terlebih dahulu.', {
			code: 'EMAIL_NOT_VERIFIED',
			email: user.email,
		});
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

	let user;

	try {
		user = await withDbRetry(() =>
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
	} catch (error) {
		if (!isLegacyGoogleSchemaError(error)) {
			throw error;
		}

		// Backward compatibility for deployments with older user table schema.
		user = await withDbRetry(async () => {
			const existingUser = await prisma.user.findUnique({ where: { email } });
			if (existingUser) {
				return existingUser;
			}

			return prisma.user.create({
				data: {
					name,
					email,
					password: randomPasswordHash,
				},
			});
		});
	}

	const accessToken = signAccessToken({ sub: user.id, role: user.role });
	return {
		accessToken,
		user: sanitizeUser(user),
	};
};

export const verifyEmail = async ({ email, token }) => {
	const normalizedEmail = normalizeEmail(email);
	const normalizedToken = String(token ?? '').trim();
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		throw new HttpError(404, 'User not found');
	}

	if (user.emailVerified) {
		throw new HttpError(400, 'Email already verified');
	}

	if (user.emailVerificationToken !== normalizedToken) {
		throw new HttpError(400, 'Invalid verification token');
	}

	if (!user.emailVerificationExpires || new Date() > user.emailVerificationExpires) {
		throw new HttpError(400, 'Verification token expired');
	}

	const updatedUser = await prisma.user.update({
		where: { email: normalizedEmail },
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
	const normalizedEmail = normalizeEmail(email);
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		throw new HttpError(404, 'User not found');
	}

	if (user.emailVerified) {
		throw new HttpError(400, 'Email already verified');
	}

	// Generate new token
	const verificationToken = await generateUniqueVerificationCode();
	await prisma.user.update({
		where: { email: normalizedEmail },
		data: {
			emailVerificationToken: verificationToken,
			emailVerificationExpires: new Date(Date.now() + verificationTokenTtlMs),
		},
	});

	// Send email
	try {
		await sendVerificationEmail(normalizedEmail, verificationToken);
	} catch (error) {
		console.error('Failed to resend verification email:', error);
		throw new HttpError(503, 'Gagal mengirim email verifikasi. Silakan coba lagi beberapa saat lagi.');
	}

	return {
		message: 'Verification email sent',
	};
};

export const forgotPassword = async ({ email }) => {
	const normalizedEmail = normalizeEmail(email);
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		// Jangan reveal apakah email terdaftar atau tidak (security best practice)
		return { message: 'If email exists, reset link will be sent' };
	}

	const resetToken = generateToken();
	await prisma.user.update({
		where: { email: normalizedEmail },
		data: {
			resetPasswordToken: resetToken,
			resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 jam
		},
	});

	// Send reset email
	try {
		await sendPasswordResetEmail(normalizedEmail, resetToken);
	} catch (error) {
		console.error('Failed to send reset password email:', error);
	}

	return {
		message: 'If email exists, reset link will be sent',
	};
};

export const resetPassword = async ({ email, token, newPassword }) => {
	const normalizedEmail = normalizeEmail(email);
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
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
	await prisma.user.update({
		where: { email: normalizedEmail },
		data: {
			password: passwordHash,
			resetPasswordToken: null,
			resetPasswordExpires: null,
		},
	});
	return {
		message: 'Password reset successful',
	};
};
