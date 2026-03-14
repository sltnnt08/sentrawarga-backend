import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { signAccessToken } from '../utils/jwt.js';

const sanitizeUser = (user) => ({
	id: user.id,
	name: user.name,
	email: user.email,
	address: user.address,
	role: user.role,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
});

export const register = async ({ name, email, password, address }) => {
	const existingUser = await prisma.user.findUnique({ where: { email } });
	if (existingUser) {
		throw new HttpError(409, 'Email already registered');
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({
		data: { name, email, password: passwordHash, address },
	});

	const accessToken = signAccessToken({ sub: user.id, role: user.role });
	return {
		accessToken,
		user: sanitizeUser(user),
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
