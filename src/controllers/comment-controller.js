import { createComment, listComments } from '../services/comment-service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const createCommentHandler = asyncHandler(async (req, res) => {
	const comment = await createComment(req.validated.params.reportId, req.user, req.validated.body);
	res.status(201).json({
		success: true,
		message: 'Comment created',
		data: comment,
	});
});

export const listCommentsHandler = asyncHandler(async (req, res) => {
	const result = await listComments(req.validated.params.reportId, req.validated.query);
	res.json({
		success: true,
		data: result,
	});
});
