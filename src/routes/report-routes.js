import { Router } from 'express';
import {
	classifyReportHandler,
	createReportHandler,
	getReportStatsHandler,
	getReportDetailHandler,
	listReportsHandler,
	updateReportHandler,
	updateReportStatusHandler,
} from '../controllers/report-controller.js';
import { createCommentHandler, listCommentsHandler } from '../controllers/comment-controller.js';
import { getVoteSummaryHandler, removeVoteHandler, setVoteHandler } from '../controllers/vote-controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { normalizeCreateReportPayload } from '../middlewares/normalize-create-report-payload.js';
import { optionalAuthenticate } from '../middlewares/optional-authenticate.js';
import { reportImageUpload } from '../middlewares/report-upload.js';
import { validate } from '../middlewares/validate.js';
import { createCommentSchema, listCommentsSchema } from '../validators/comment-validator.js';
import {
	classifyReportSchema,
	createReportSchema,
	listReportsSchema,
	reportIdParamSchema,
	updateReportSchema,
	updateReportStatusSchema,
} from '../validators/report-validator.js';
import { voteParamsSchema, voteSummarySchema, voteUpsertSchema } from '../validators/vote-validator.js';

const reportRoutes = Router();

reportRoutes.get('/', validate(listReportsSchema), listReportsHandler);
reportRoutes.get('/stats', getReportStatsHandler);
reportRoutes.post('/classify', authenticate, validate(classifyReportSchema), classifyReportHandler);
reportRoutes.post('/', authenticate, reportImageUpload, normalizeCreateReportPayload, validate(createReportSchema), createReportHandler);
reportRoutes.get('/:id', validate(reportIdParamSchema), getReportDetailHandler);
reportRoutes.patch('/:id', authenticate, validate(updateReportSchema), updateReportHandler);
reportRoutes.patch(
	'/:id/status',
	authenticate,
	validate(updateReportStatusSchema),
	updateReportStatusHandler,
);
reportRoutes.get('/:reportId/comments', validate(listCommentsSchema), listCommentsHandler);
reportRoutes.post('/:reportId/comments', authenticate, validate(createCommentSchema), createCommentHandler);
reportRoutes.get('/:reportId/votes', optionalAuthenticate, validate(voteSummarySchema), getVoteSummaryHandler);
reportRoutes.post('/:reportId/votes', authenticate, validate(voteUpsertSchema), setVoteHandler);
reportRoutes.delete('/:reportId/votes', authenticate, validate(voteParamsSchema), removeVoteHandler);

export { reportRoutes };
