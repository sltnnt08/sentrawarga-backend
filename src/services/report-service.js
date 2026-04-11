import { createNotification } from './notification-service.js';
import { removeReportImage, uploadReportImage } from './report-image-storage-service.js';
import { klasifikasiLaporan } from './ai-service.js';
import { NotificationType, ReportStatus } from '../constants/prisma-enums.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { randomUUID } from 'node:crypto';

const STATUS_LABEL_ID = {
	[ReportStatus.PENDING]: 'Menunggu Verifikasi',
	[ReportStatus.VERIFIED]: 'Terverifikasi',
	[ReportStatus.IN_PROGRESS]: 'Sedang Ditangani',
	[ReportStatus.RESOLVED]: 'Selesai',
	[ReportStatus.REJECTED]: 'Ditolak',
	[ReportStatus.CANCELLED]: 'Dibatalkan',
};

const FINAL_STATUSES = new Set([
	ReportStatus.RESOLVED,
	ReportStatus.REJECTED,
	ReportStatus.CANCELLED,
]);

const buildStatusChangeMessage = ({ status, actorRole, reportTitle, feedback }) => {
	if (status === ReportStatus.CANCELLED) {
		const cancelledBy = actorRole === 'ADMIN' ? 'admin' : 'pengguna';
		const baseMessage = `Laporan "${reportTitle}" dibatalkan oleh ${cancelledBy}.`;

		if (actorRole === 'ADMIN' && feedback) {
			return `${baseMessage} Catatan admin: ${feedback}`;
		}

		return baseMessage;
	}

	const baseMessage = `Laporan "${reportTitle}" sekarang berstatus ${STATUS_LABEL_ID[status] ?? status}.`;

	if (actorRole === 'ADMIN' && feedback) {
		return `${baseMessage} Catatan admin: ${feedback}`;
	}

	return baseMessage;
};

export const classifyReportPayload = async (payload) => {
	const aiResult = await klasifikasiLaporan({
		judul: payload.title,
		deskripsi: payload.description,
		fotoBase64: payload.imageBase64,
		mimeType: payload.imageMimeType || 'image/jpeg',
	});

	return {
		category: aiResult.category,
		confidenceScore: aiResult.confidenceScore,
		isSpam: aiResult.isSpam,
		aiError: aiResult.aiError,
	};
};

export const createReport = async (reporterId, payload) => {
	// Call AI service to classify the report
	const aiResult = await classifyReportPayload(payload);
	const reportId = randomUUID();
	let uploadedReportImage = null;

	try {
		uploadedReportImage = await uploadReportImage({
			reportId,
			imageBase64: payload.imageBase64,
			imageMimeType: payload.imageMimeType,
			imageOriginalName: payload.imageOriginalName,
		});

		const report = await prisma.report.create({
			data: {
				id: reportId,
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
				reportImages: uploadedReportImage
					? {
						create: [
							{
								url: uploadedReportImage.publicUrl,
							},
						],
					}
					: undefined,
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
	} catch (error) {
		if (uploadedReportImage?.objectPath) {
			await removeReportImage(uploadedReportImage.objectPath);
		}

		throw error;
	}
};

export const listReports = async ({ status, priority, category, hasImage = false, page = 1, limit = 10 }) => {
	const skip = (page - 1) * limit;
	const where = {
		...(status ? { status } : {}),
		...(priority ? { priority } : {}),
		...(category ? { category: { has: category } } : {}),
		...(hasImage ? { reportImages: { some: {} } } : {}),
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
				reportImages: {
					select: {
						id: true,
						url: true,
					},
					take: 1,
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

export const getReportStats = async () => {
	const grouped = await prisma.report.groupBy({
		by: ['status'],
		_count: {
			_all: true,
		},
	});

	const statusCounts = grouped.reduce(
		(acc, row) => ({
			...acc,
			[row.status]: row._count._all,
		}),
		{},
	);

	const pending = statusCounts[ReportStatus.PENDING] ?? 0;
	const verified = statusCounts[ReportStatus.VERIFIED] ?? 0;
	const inProgress = statusCounts[ReportStatus.IN_PROGRESS] ?? 0;
	const resolved = statusCounts[ReportStatus.RESOLVED] ?? 0;
	const cancelled = statusCounts[ReportStatus.CANCELLED] ?? 0;

	return {
		totalCreated:
			pending +
			verified +
			inProgress +
			resolved +
			(statusCounts[ReportStatus.REJECTED] ?? 0) +
			cancelled,
		inProgress: pending + verified + inProgress,
		totalResolved: resolved,
		statusBreakdown: {
			PENDING: pending,
			VERIFIED: verified,
			IN_PROGRESS: inProgress,
			RESOLVED: resolved,
			REJECTED: statusCounts[ReportStatus.REJECTED] ?? 0,
			CANCELLED: cancelled,
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

export const updateReportStatus = async (reportId, actor, status, feedback) => {
	if (!actor?.id || !actor?.role) {
		throw new HttpError(401, 'Unauthorized');
	}

	const sanitizedFeedback = typeof feedback === 'string' ? feedback.trim() : undefined;

	const existing = await prisma.report.findUnique({
		where: { id: reportId },
		select: { id: true, title: true, reporterId: true, status: true },
	});

	if (!existing) {
		throw new HttpError(404, 'Report not found');
	}

	const isAdmin = actor.role === 'ADMIN';
	const isReporter = actor.role === 'USER' && actor.id === existing.reporterId;

	if (!isAdmin && !isReporter) {
		throw new HttpError(403, 'Forbidden');
	}

	if (status === ReportStatus.CANCELLED && !isReporter) {
		throw new HttpError(403, 'Hanya pelapor yang dapat membatalkan laporannya sendiri');
	}

	if (!isAdmin && status !== ReportStatus.CANCELLED) {
		throw new HttpError(403, 'Pengguna hanya dapat membatalkan laporannya sendiri');
	}

	if (!isAdmin && sanitizedFeedback) {
		throw new HttpError(403, 'Hanya admin yang dapat mengirim feedback laporan');
	}

	if (FINAL_STATUSES.has(existing.status) && existing.status !== status) {
		throw new HttpError(400, 'Status laporan final dan tidak dapat diubah');
	}

	const shouldRewardVerificationPoints =
		isAdmin &&
		existing.status !== ReportStatus.VERIFIED &&
		status === ReportStatus.VERIFIED;

	const report = await prisma.$transaction(async (tx) => {
		const updatedReport = await tx.report.update({
			where: { id: reportId },
			data: {
				status,
				feedback: isAdmin && sanitizedFeedback ? sanitizedFeedback : undefined,
				resolvedAt: status === ReportStatus.RESOLVED ? new Date() : null,
				cancelledByRole: status === ReportStatus.CANCELLED ? actor.role : null,
				cancelledAt: status === ReportStatus.CANCELLED ? new Date() : null,
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

		if (shouldRewardVerificationPoints) {
			await tx.user.update({
				where: { id: existing.reporterId },
				data: {
					points: {
						increment: 10,
					},
				},
			});
		}

		return updatedReport;
	});

	if (existing.status !== status) {
		await createNotification({
			userId: existing.reporterId,
			title: 'Status laporan diperbarui',
			message: buildStatusChangeMessage({
				status,
				actorRole: actor.role,
				reportTitle: existing.title,
				feedback: sanitizedFeedback,
			}),
			type: status === ReportStatus.RESOLVED ? NotificationType.REPORT_RESOLVED : NotificationType.REPORT_STATUS_CHANGED,
			relatedId: report.id,
		});
	} else if (isAdmin && sanitizedFeedback) {
		await createNotification({
			userId: existing.reporterId,
			title: 'Feedback admin untuk laporan',
			message: `Catatan admin untuk laporan "${existing.title}": ${sanitizedFeedback}`,
			type: NotificationType.ADMIN_REPLY,
			relatedId: report.id,
		});
	}

	return report;
};

export const updateReport = async (reportId, actor, payload) => {
	if (!actor?.id || !actor?.role) {
		throw new HttpError(401, 'Unauthorized');
	}

	const existing = await prisma.report.findUnique({
		where: { id: reportId },
		select: { id: true, reporterId: true, status: true },
	});

	if (!existing) {
		throw new HttpError(404, 'Report not found');
	}

	const isAdmin = actor.role === 'ADMIN';
	const isReporter = actor.role === 'USER' && actor.id === existing.reporterId;

	if (!isAdmin && !isReporter) {
		throw new HttpError(403, 'Forbidden');
	}

	if (FINAL_STATUSES.has(existing.status)) {
		throw new HttpError(400, 'Laporan tidak dapat diedit karena status sudah final');
	}

	const data = {};

	if (payload.title !== undefined) data.title = payload.title;
	if (payload.description !== undefined) data.description = payload.description;
	if (payload.category !== undefined) data.category = payload.category;
	if (payload.priority !== undefined) data.priority = payload.priority;
	if (payload.address !== undefined) data.address = payload.address;
	if (payload.latitude !== undefined) data.latitude = payload.latitude;
	if (payload.longitude !== undefined) data.longitude = payload.longitude;

	if (Object.keys(data).length === 0) {
		throw new HttpError(400, 'Tidak ada data yang diperbarui');
	}

	if (isReporter && !isAdmin) {
		data.editedByReporter = true;
		data.lastEditedByReporterAt = new Date();
	}

	const report = await prisma.report.update({
		where: { id: reportId },
		data,
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
