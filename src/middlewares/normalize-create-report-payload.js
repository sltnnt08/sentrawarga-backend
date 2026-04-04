import { HttpError } from '../utils/http-error.js';

const normalizeOptionalString = (value) => {
	if (typeof value !== 'string') {
		return value;
	}

	const trimmed = value.trim();
	return trimmed === '' ? undefined : trimmed;
};

const normalizeOptionalNumber = (value, fieldName) => {
	const normalized = normalizeOptionalString(value);
	if (normalized == null) {
		return undefined;
	}

	if (typeof normalized === 'number') {
		return normalized;
	}

	const parsed = Number.parseFloat(normalized);
	if (Number.isNaN(parsed)) {
		throw new HttpError(400, `${fieldName} harus berupa angka yang valid`);
	}

	return parsed;
};

const normalizeCategory = (categoryValue) => {
	if (Array.isArray(categoryValue)) {
		return categoryValue
			.map((value) => (typeof value === 'string' ? value.trim() : String(value)))
			.filter(Boolean);
	}

	if (typeof categoryValue !== 'string') {
		return categoryValue;
	}

	const trimmed = categoryValue.trim();
	if (!trimmed) {
		return [];
	}

	if (trimmed.startsWith('[')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (!Array.isArray(parsed)) {
				throw new Error('Category must be array');
			}
			return parsed.map((value) => String(value).trim()).filter(Boolean);
		} catch {
			throw new HttpError(400, 'Format category tidak valid. Gunakan JSON array atau pisahkan dengan koma.');
		}
	}

	if (trimmed.includes(',')) {
		return trimmed
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
	}

	return [trimmed];
};

const isMultipartRequest = (req) => req.is('multipart/form-data');

export const normalizeCreateReportPayload = (req, res, next) => {
	if (!isMultipartRequest(req)) {
		next();
		return;
	}

	try {
		const normalizedBody = {
			...req.body,
			title: normalizeOptionalString(req.body?.title),
			description: normalizeOptionalString(req.body?.description),
			priority: normalizeOptionalString(req.body?.priority),
			address: normalizeOptionalString(req.body?.address),
			category: normalizeCategory(req.body?.category),
			latitude: normalizeOptionalNumber(req.body?.latitude, 'latitude'),
			longitude: normalizeOptionalNumber(req.body?.longitude, 'longitude'),
		};

		if (req.file?.buffer) {
			normalizedBody.imageBase64 = req.file.buffer.toString('base64');
			normalizedBody.imageMimeType = req.file.mimetype;
		}

		req.body = normalizedBody;
		next();
	} catch (error) {
		next(error);
	}
};
