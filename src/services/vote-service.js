import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';

const normalizeSingleVote = async (userId, reportId, keepVoteId) => {
	await prisma.vote.deleteMany({
		where: {
			userId,
			reportId,
			...(keepVoteId ? { id: { not: keepVoteId } } : {}),
		},
	});
};

export const setVote = async (reportId, userId, type) => {
	const report = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true } });
	if (!report) {
		throw new HttpError(404, 'Report not found');
	}

	const existing = await prisma.vote.findFirst({
		where: { userId, reportId },
		orderBy: { id: 'asc' },
	});

	if (!existing) {
		const created = await prisma.vote.create({
			data: {
				userId,
				reportId,
				type,
			},
		});
		await normalizeSingleVote(userId, reportId, created.id);
		return created;
	}

	const updated = await prisma.vote.update({
		where: { id: existing.id },
		data: { type },
	});
	await normalizeSingleVote(userId, reportId, updated.id);
	return updated;
};

export const removeVote = async (reportId, userId) => {
	const result = await prisma.vote.deleteMany({
		where: { reportId, userId },
	});

	return {
		deleted: result.count > 0,
	};
};

export const getVoteSummary = async (reportId, userId = null) => {
	const report = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true } });
	if (!report) {
		throw new HttpError(404, 'Report not found');
	}

	const grouped = await prisma.vote.groupBy({
		by: ['type'],
		where: { reportId },
		_count: { _all: true },
	});

	const summary = grouped.reduce(
		(acc, item) => {
			acc[item.type] = item._count._all;
			return acc;
		},
		{ UP: 0, DOWN: 0 },
	);

	let currentUserVote = null;
	if (userId) {
		const vote = await prisma.vote.findFirst({
			where: { reportId, userId },
			orderBy: { id: 'asc' },
			select: { type: true },
		});
		currentUserVote = vote?.type ?? null;
	}

	return {
		upVotes: summary.UP,
		downVotes: summary.DOWN,
		currentUserVote,
	};
};
