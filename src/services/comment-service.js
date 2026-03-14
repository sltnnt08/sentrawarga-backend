import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { createNotification } from './notification-service.js';

export const createComment = async (reportId, user, { content }) => {
	const report = await prisma.report.findUnique({
		where: { id: reportId },
		select: { id: true, title: true, reporterId: true },
	});

	if (!report) {
		throw new HttpError(404, 'Report not found');
	}

	const comment = await prisma.comment.create({
		data: {
			reportId,
			userId: user.id,
			content,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (report.reporterId !== user.id) {
		await createNotification({
			userId: report.reporterId,
			title: 'Komentar baru pada laporan',
			message: `${user.name} mengomentari laporan "${report.title}".`,
			type: NotificationType.NEW_COMMENT,
			relatedId: report.id,
		});
	}

	return comment;
};

export const listComments = async (reportId, { page = 1, limit = 10 }) => {
	const report = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true } });
	if (!report) {
		throw new HttpError(404, 'Report not found');
	}

	const skip = (page - 1) * limit;
	const where = { reportId };

	const [items, total] = await Promise.all([
		prisma.comment.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: 'asc' },
			include: {
				user: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		}),
		prisma.comment.count({ where }),
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
