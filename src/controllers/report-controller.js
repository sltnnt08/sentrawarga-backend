import {
	classifyReportPayload,
	createReport,
	getReportById,
	getReportStats,
	listReports,
	updateReport,
	updateReportStatus,
} from '../services/report-service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const classifyReportHandler = asyncHandler(async (req, res) => {
	const result = await classifyReportPayload(req.validated.body);
	res.json({
		success: true,
		data: result,
	});
});

export const createReportHandler = asyncHandler(async (req, res) => {
	const report = await createReport(req.user.id, req.validated.body);
	res.status(201).json({
		success: true,
		message: 'Report created',
		data: report,
	});
});

export const listReportsHandler = asyncHandler(async (req, res) => {
	const result = await listReports(req.validated.query);
	res.json({
		success: true,
		data: result,
	});
});

export const getReportStatsHandler = asyncHandler(async (req, res) => {
	void req;
	const result = await getReportStats();
	res.json({
		success: true,
		data: result,
	});
});

export const getReportDetailHandler = asyncHandler(async (req, res) => {
	const report = await getReportById(req.validated.params.id);
	res.json({
		success: true,
		data: report,
	});
});

export const updateReportStatusHandler = asyncHandler(async (req, res) => {
	const report = await updateReportStatus(
		req.validated.params.id,
		req.user,
		req.validated.body.status,
		req.validated.body.feedback,
	);
	res.json({
		success: true,
		message: 'Report status updated',
		data: report,
	});
});

export const updateReportHandler = asyncHandler(async (req, res) => {
	const report = await updateReport(req.validated.params.id, req.user, req.validated.body);
	res.json({
		success: true,
		message: 'Report updated',
		data: report,
	});
});
