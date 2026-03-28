import { createNotification } from './notification-service.js';
import { klasifikasiLaporan } from './ai-service.js';
import { NotificationType, ReportStatus } from '../constants/prisma-enums.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';

export const createReport = async (reporterId, payload) => {
	// Call AI service to classify the report
	const aiResult = await klasifikasiLaporan({
		deskripsi: payload.description,
		fotoBase64: payload.imageBase64,
		mimeType: payload.imageMimeType || 'image/jpeg',
	});

	const report = await prisma.report.create({
		data: {
			title: payload.title,
			description: payload.description,
			category: payload.category,
			priority: payload.priority,
			latitude: payload.latitude,
			longitude: payload.longitude,
			address: payload.address,
			reporterId,
			status: ReportStatus.PENDING,
			aiCategory: aiResult.category,
			aiConfidence: aiResult.confidenceScore,
			aiSpamFlag: aiResult.isSpam,
		},
		include: {
			reporter: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	return report;
};

export const listReports = async ({ status, priority, category, page = 1, limit = 10 }) => {
	const skip = (page - 1) * limit;
	const where = {
		...(status ? { status } : {}),
		...(priority ? { priority } : {}),
		...(category ? { category: { has: category } } : {}),
	};

	const [items, total] = await Promise.all([
		prisma.report.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: 'desc' },
			include: {
				reporter: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		}),
		prisma.report.count({ where }),
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

export const getReportById = async (reportId) => {
	const report = await prisma.report.findUnique({
		where: { id: reportId },
		include: {
			reporter: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			reportImages: true,
			_count: {
				select: {
					votes: true,
					comments: true,
				},
			},
		},
	});

	if (!report) {
		throw new HttpError(404, 'Report not found');
	}

	return report;
};

export const updateReportStatus = async (reportId, actor, status) => {
	if (actor.role !== 'ADMIN') {
		throw new HttpError(403, 'Forbidden');
	}

	const existing = await prisma.report.findUnique({
		where: { id: reportId },
		select: { id: true, title: true, reporterId: true, status: true },
	});

	if (!existing) {
		throw new HttpError(404, 'Report not found');
	}

	const report = await prisma.report.update({
		where: { id: reportId },
		data: {
			status,
			resolvedAt: status === ReportStatus.RESOLVED ? new Date() : null,
		},
		include: {
			reporter: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (existing.status !== status) {
		await createNotification({
			userId: existing.reporterId,
			title: 'Status laporan diperbarui',
			message: `Laporan "${existing.title}" sekarang berstatus ${status}.`,
			type: status === ReportStatus.RESOLVED ? NotificationType.REPORT_RESOLVED : NotificationType.REPORT_STATUS_CHANGED,
			relatedId: report.id,
		});
	}

	return report;
};
