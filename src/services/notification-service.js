import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';

export const createNotification = async ({ userId, title, message, type, relatedId }) => {
	return prisma.notification.create({
		data: {
			userId,
			title,
			message,
			type,
			relatedId,
		},
	});
};

export const listNotifications = async (userId, { page = 1, limit = 10, unreadOnly = false }) => {
	const skip = (page - 1) * limit;
	const where = {
		userId,
		...(unreadOnly ? { isRead: false } : {}),
	};

	const [items, total] = await Promise.all([
		prisma.notification.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: 'desc' },
		}),
		prisma.notification.count({ where }),
	]);

	return {
		items,
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const markNotificationRead = async (userId, notificationId) => {
	const notification = await prisma.notification.findFirst({
		where: { id: notificationId, userId },
		select: { id: true },
	});

	if (!notification) {
		throw new HttpError(404, 'Notification not found');
	}

	return prisma.notification.update({
		where: { id: notificationId },
		data: { isRead: true },
	});
};

export const markAllNotificationsRead = async (userId) => {
	const result = await prisma.notification.updateMany({
		where: { userId, isRead: false },
		data: { isRead: true },
	});

	return {
		updatedCount: result.count,
	};
};
