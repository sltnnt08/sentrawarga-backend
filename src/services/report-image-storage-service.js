import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

const DEFAULT_REPORT_IMAGE_MIME_TYPE = 'image/jpeg';
const MIME_TYPE_TO_EXTENSION = new Map([
	['image/jpeg', 'jpg'],
	['image/jpg', 'jpg'],
	['image/png', 'png'],
	['image/webp', 'webp'],
	['image/heic', 'heic'],
	['image/heif', 'heif'],
	['image/heic-sequence', 'heic'],
	['image/heif-sequence', 'heif'],
]);

const normalizedReportImagePublicBaseUrl = String(env.reportImagePublicBaseUrl ?? '')
	.trim()
	.replace(/\/+$/, '');

const isStorageConfigured =
	typeof env.supabaseUrl === 'string' &&
	env.supabaseUrl.trim() !== '' &&
	typeof env.supabaseServiceRoleKey === 'string' &&
	env.supabaseServiceRoleKey.trim() !== '' &&
	typeof env.reportImageBucket === 'string' &&
	env.reportImageBucket.trim() !== '';

const supabaseStorageClient = isStorageConfigured
	? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		})
	: null;

const normalizeBase64Data = (rawData) => {
	if (typeof rawData !== 'string') {
		throw new HttpError(400, 'Data gambar tidak valid.');
	}

	const trimmed = rawData.trim();
	if (trimmed === '') {
		throw new HttpError(400, 'Data gambar kosong.');
	}

	const dataPart = trimmed.includes(',') ? trimmed.split(',').at(-1) : trimmed;
	if (!dataPart) {
		throw new HttpError(400, 'Data gambar tidak valid.');
	}

	return dataPart;
};

const decodeBase64ImageToBuffer = (rawData) => {
	const normalizedBase64 = normalizeBase64Data(rawData);
	const sanitized = normalizedBase64.replace(/\s+/g, '');

	if (!/^[A-Za-z0-9+/=]+$/.test(sanitized)) {
		throw new HttpError(400, 'Format base64 gambar tidak valid.');
	}

	const imageBuffer = Buffer.from(sanitized, 'base64');
	if (imageBuffer.length === 0) {
		throw new HttpError(400, 'Data gambar tidak dapat diproses.');
	}

	return imageBuffer;
};

const normalizeMimeType = (mimeType) => {
	if (typeof mimeType !== 'string' || mimeType.trim() === '') {
		return DEFAULT_REPORT_IMAGE_MIME_TYPE;
	}

	return mimeType.trim().toLowerCase();
};

const resolveFileExtension = ({ mimeType, originalName }) => {
	const normalizedMimeType = normalizeMimeType(mimeType);
	const extensionFromMimeType = MIME_TYPE_TO_EXTENSION.get(normalizedMimeType);
	if (extensionFromMimeType) {
		return extensionFromMimeType;
	}

	const extensionFromName = extname(String(originalName ?? '')).toLowerCase().replace('.', '');
	if (extensionFromName) {
		return extensionFromName;
	}

	return 'jpg';
};

const buildPublicUrl = ({ bucket, objectPath }) => {
	if (normalizedReportImagePublicBaseUrl) {
		return `${normalizedReportImagePublicBaseUrl}/${objectPath}`;
	}

	if (!supabaseStorageClient) {
		return '';
	}

	const {
		data: { publicUrl },
	} = supabaseStorageClient.storage.from(bucket).getPublicUrl(objectPath);
	return publicUrl;
};

export const uploadReportImage = async ({ reportId, imageBase64, imageMimeType, imageOriginalName }) => {
	if (!imageBase64) {
		return null;
	}

	if (!isStorageConfigured || !supabaseStorageClient) {
		throw new HttpError(
			500,
			'Upload gambar belum dikonfigurasi. Lengkapi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan SUPABASE_REPORT_IMAGE_BUCKET.',
		);
	}

	const imageBuffer = decodeBase64ImageToBuffer(imageBase64);
	const bucketName = env.reportImageBucket.trim();
	const extension = resolveFileExtension({
		mimeType: imageMimeType,
		originalName: imageOriginalName,
	});
	const objectPath = `${reportId}/${Date.now()}-${randomUUID()}.${extension}`;
	const contentType = normalizeMimeType(imageMimeType);

	const { error } = await supabaseStorageClient.storage.from(bucketName).upload(objectPath, imageBuffer, {
		contentType,
		cacheControl: '3600',
		upsert: false,
	});

	if (error) {
		throw new HttpError(502, `Gagal upload gambar laporan: ${error.message}`);
	}

	return {
		objectPath,
		publicUrl: buildPublicUrl({ bucket: bucketName, objectPath }),
	};
};

export const removeReportImage = async (objectPath) => {
	if (!objectPath || !isStorageConfigured || !supabaseStorageClient) {
		return;
	}

	const bucketName = env.reportImageBucket.trim();
	await supabaseStorageClient.storage.from(bucketName).remove([objectPath]);
};
