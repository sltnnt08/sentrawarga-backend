import { getVoteSummary, removeVote, setVote } from '../services/vote-service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const setVoteHandler = asyncHandler(async (req, res) => {
	const vote = await setVote(req.validated.params.reportId, req.user.id, req.validated.body.type);
	res.json({
		success: true,
		message: 'Vote saved',
		data: vote,
	});
});

export const removeVoteHandler = asyncHandler(async (req, res) => {
	const result = await removeVote(req.validated.params.reportId, req.user.id);
	res.json({
		success: true,
		message: result.deleted ? 'Vote removed' : 'No vote to remove',
		data: result,
	});
});

export const getVoteSummaryHandler = asyncHandler(async (req, res) => {
	const data = await getVoteSummary(req.validated.params.reportId, req.user?.id ?? null);
	res.json({
		success: true,
		data,
	});
});
