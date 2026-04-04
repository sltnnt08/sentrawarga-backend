import { HttpError } from '../utils/http-error.js';

const WILAYAH_API_BASE_URL = 'https://wilayah.id/api';
const REQUEST_TIMEOUT_MS = 12000;

const wilayahPathMap = {
	provinces: '/provinces.json',
	regencies: '/regencies/:code.json',
	districts: '/districts/:code.json',
	villages: '/villages/:code.json',
};

const isValidCode = (code) => /^[0-9]{2,10}$/.test(code);

const resolveWilayahPath = (resource, code) => {
	const template = wilayahPathMap[resource];

	if (!template) {
		throw new HttpError(400, 'Invalid wilayah resource');
	}

	if (!template.includes(':code')) {
		return template;
	}

	if (!code || !isValidCode(code)) {
		throw new HttpError(400, 'Invalid wilayah code');
	}

	return template.replace(':code', code);
};

const fetchWilayahJson = async (path) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(`${WILAYAH_API_BASE_URL}${path}`, {
			headers: {
				Accept: 'application/json',
			},
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new HttpError(502, 'Wilayah service unavailable');
		}

		const payload = await response.json();

		if (!payload || !Array.isArray(payload.data)) {
			throw new HttpError(502, 'Wilayah response format is invalid');
		}

		return payload;
	} catch (error) {
		if (error instanceof HttpError) {
			throw error;
		}

		if (error?.name === 'AbortError') {
			throw new HttpError(504, 'Wilayah service timed out');
		}

		throw new HttpError(502, 'Failed to reach wilayah service');
	} finally {
		clearTimeout(timeout);
	}
};

export const getWilayahData = async ({ resource, code }) => {
	const path = resolveWilayahPath(resource, code);
	return fetchWilayahJson(path);
};
