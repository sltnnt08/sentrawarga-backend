import { HttpError } from '../utils/http-error.js';

export const validate = (schema) => (req, res, next) => {
	const parsed = schema.safeParse({
		body: req.body,
		query: req.query,
		params: req.params,
	});

	if (!parsed.success) {
		return next(
			new HttpError(400, 'Validation error', {
				errors: parsed.error.issues.map((issue) => ({
					path: issue.path.join('.'),
					message: issue.message,
				})),
			}),
		);
	}

	req.validated = parsed.data;
	next();
};
