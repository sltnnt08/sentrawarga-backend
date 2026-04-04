import { extname } from 'node:path';
import multer from 'multer';
import { HttpError } from '../utils/http-error.js';

const MAX_REPORT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedImageMimeTypes = new Set([
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/webp',
	'image/heic',
	'image/heif',
	'image/heic-sequence',
	'image/heif-sequence',
]);
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

const isAllowedImage = (file) => {
	const mimeType = String(file?.mimetype ?? '').toLowerCase();
	if (allowedImageMimeTypes.has(mimeType)) {
		return true;
	}

	if (mimeType !== '' && mimeType !== 'application/octet-stream') {
		return false;
	}

	const fileExtension = extname(String(file?.originalname ?? '')).toLowerCase();
	return allowedImageExtensions.has(fileExtension);
};

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: MAX_REPORT_IMAGE_SIZE_BYTES,
		files: 1,
	},
	fileFilter: (req, file, callback) => {
		if (!isAllowedImage(file)) {
			callback(new HttpError(400, 'Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, HEIC, atau HEIF.'));
			return;
		}

		callback(null, true);
	},
});

export const reportImageUpload = (req, res, next) => {
	upload.single('image')(req, res, (error) => {
		if (!error) {
			next();
			return;
		}

		if (error instanceof HttpError) {
			next(error);
			return;
		}

		if (error instanceof multer.MulterError) {
			if (error.code === 'LIMIT_FILE_SIZE') {
				next(new HttpError(413, 'Ukuran gambar maksimal 5MB.'));
				return;
			}

			next(new HttpError(400, error.message));
			return;
		}

		next(error);
	});
};
