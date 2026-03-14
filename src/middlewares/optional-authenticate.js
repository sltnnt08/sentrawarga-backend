import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const optionalAuthenticate = async (req, res, next) => {
	try {
		const authorization = req.headers.authorization;
		if (!authorization?.startsWith('Bearer ')) {
			return next();
		}

		const token = authorization.slice(7);
		const payload = verifyAccessToken(token);
		const user = await prisma.user.findUnique({
			where: { id: payload.sub },
			select: { id: true, name: true, email: true, role: true },
		});

		if (!user) {
			return next();
		}

		req.user = user;
		next();
	} catch {
		next();
	}
};
