import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authenticate = async (req, res, next) => {
	try {
		const authorization = req.headers.authorization;
		if (!authorization?.startsWith('Bearer ')) {
			throw new HttpError(401, 'Missing or invalid authorization header');
		}

		const token = authorization.slice(7);
		const payload = verifyAccessToken(token);
		const user = await prisma.user.findUnique({
			where: { id: payload.sub },
			select: { id: true, name: true, email: true, role: true, points: true, emailVerified: true },
		});

		if (!user) {
			throw new HttpError(401, 'Invalid access token');
		}

		if (!user.emailVerified) {
			throw new HttpError(403, 'Email belum diverifikasi. Akses ditolak.', {
				code: 'EMAIL_NOT_VERIFIED',
				email: user.email,
			});
		}

		req.user = user;
		next();
	} catch (error) {
		if (error instanceof HttpError) {
			return next(error);
		}

		next(new HttpError(401, 'Unauthorized'));
	}
};
