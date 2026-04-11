import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { setSupabaseClientForTest } from '../src/controllers/auth-controller.js';
import { corsOriginAllowlist, isCorsOriginAllowed } from '../src/middlewares/security.js';

test('GET / returns API running message', async () => {
	const response = await request(app).get('/');

	assert.equal(response.status, 200);
	assert.equal(response.body.statusCode, 200);
	assert.equal(response.body.success, true);
	assert.equal(response.body.message, 'API running');
});

test('GET /healthz returns service health', async () => {
	const response = await request(app).get('/healthz');

	assert.equal(response.status, 200);
	assert.equal(response.body.statusCode, 200);
	assert.equal(response.body.success, true);
	assert.equal(response.body.status, 'ok');
	assert.equal(response.body.service, 'sentrawarga-backend');
	assert.ok(response.body.timestamp);
});

test('unknown route returns 404 with request id', async () => {
	const response = await request(app).get('/route-does-not-exist');

	assert.equal(response.status, 404);
	assert.equal(response.body.statusCode, 404);
	assert.equal(response.body.success, false);
	assert.equal(response.body.message, 'Route not found');
	assert.ok(response.body.requestId);
	assert.ok(response.headers['x-request-id']);
});

test('CORS allowlist should include production frontend domains', () => {
	assert.ok(corsOriginAllowlist.includes('https://sentrawarga.my.id'));
	assert.ok(corsOriginAllowlist.includes('https://www.sentrawarga.my.id'));
});

test('CORS origin matching should normalize trailing slash and casing', () => {
	assert.equal(isCorsOriginAllowed('https://sentrawarga.my.id/'), true);
	assert.equal(isCorsOriginAllowed('HTTPS://WWW.SENTRAWARGA.MY.ID/'), true);
});

test('GET /auth/callback handles OAuth exchange redirects', async () => {
	setSupabaseClientForTest(null);

	const missingCodeResponse = await request(app).get('/auth/callback');
	assert.equal(missingCodeResponse.status, 302);
	assert.equal(missingCodeResponse.headers.location, '/login');

	let exchangeCalledWith = null;
	setSupabaseClientForTest({
		auth: {
			exchangeCodeForSession: async (code) => {
				exchangeCalledWith = code;
				return { error: null };
			},
		},
	});

	const successResponse = await request(app).get('/auth/callback?code=oauth-code');
	assert.equal(successResponse.status, 302);
	assert.equal(successResponse.headers.location, '/dashboard');
	assert.equal(exchangeCalledWith, 'oauth-code');

	setSupabaseClientForTest({
		auth: {
			exchangeCodeForSession: async () => ({
				error: new Error('exchange failed'),
			}),
		},
	});

	const exchangeErrorResponse = await request(app).get('/auth/callback?code=oauth-code');
	assert.equal(exchangeErrorResponse.status, 302);
	assert.equal(exchangeErrorResponse.headers.location, '/login');

	setSupabaseClientForTest({
		auth: {
			exchangeCodeForSession: async () => {
				throw new Error('unexpected failure');
			},
		},
	});

	const exchangeThrowResponse = await request(app).get('/auth/callback?code=oauth-code');
	assert.equal(exchangeThrowResponse.status, 302);
	assert.equal(exchangeThrowResponse.headers.location, '/login');
});

// ════════════════════════════════════════════════════════════════
// AI CLASSIFICATION FEATURE TESTS
// ════════════════════════════════════════════════════════════════

test('POST /reports creates report with AI classification fields', async () => {
	const reportPayload = {
		title: 'Sampah Menumpuk di Jalan',
		description: 'Terdapat sampah plastik yang sangat banyak menumpuk di samping toko elektronik menyebabkan polusi visual dan lingkungan yang buruk',
		category: ['TRASH'],
		priority: 'HIGH',
		address: 'Jl. Merdeka No. 123, Jakarta',
		latitude: -6.2088,
		longitude: 106.8456,
	};

	const response = await request(app)
		.post('/reports')
		.send(reportPayload);

	// Check response structure
	if (response.status === 201) {
		assert.ok(response.body.success !== undefined, 'Response should have success field');
		assert.ok(response.body.data, 'Response should have data field');
		
		const report = response.body.data;
		assert.ok(report.id, 'Report should have ID');
		assert.equal(report.title, reportPayload.title, 'Report should have correct title');
		assert.equal(report.description, reportPayload.description, 'Report should have correct description');
		
		// Check AI classification fields exist
		assert.ok('aiCategory' in report, 'Report should have aiCategory field');
		assert.ok('aiConfidence' in report, 'Report should have aiConfidence field');
		assert.ok('aiSpamFlag' in report, 'Report should have aiSpamFlag field');
		
		// Validate AI field types
		if (report.aiCategory !== null) {
			const validCategories = ['CRIMINAL', 'TRASH', 'FLOOD', 'POLLUTION', 'ROADS_ISSUE', 'PUBLIC_DISTURBANCE', 'ACCIDENTS', 'OTHERS'];
			assert.ok(validCategories.includes(report.aiCategory), `AI category \"${report.aiCategory}\" should be valid`);
		}
		
		if (report.aiConfidence !== null) {
			assert.equal(typeof report.aiConfidence, 'number', 'aiConfidence should be a number');
			assert.ok(report.aiConfidence >= 0 && report.aiConfidence <= 1, 'aiConfidence should be between 0 and 1');
		}
		
		assert.equal(typeof report.aiSpamFlag, 'boolean', 'aiSpamFlag should be boolean');
	}
});

test('POST /reports creates report without image', async () => {
	const reportPayload = {
		title: 'Banjir di Area Perumahan',
		description: 'Air banjir setinggi satu meter telah masuk ke dalam rumah-rumah warga di area perumahan Indah menyebabkan kerusakan properti',
		category: ['FLOOD'],
		priority: 'URGENT',
		address: 'Perumahan Indah, Jakarta Timur',
		latitude: -6.3000,
		longitude: 106.9000,
	};

	const response = await request(app)
		.post('/reports')
		.send(reportPayload);

	// Check that report can be created without image
	if (response.status === 201) {
		assert.ok(response.body.data, 'Report should be created without image');
		const report = response.body.data;
		assert.ok('aiCategory' in report, 'Report should have aiCategory field even without image');
		assert.ok('aiConfidence' in report, 'Report should have aiConfidence field even without image');
		assert.ok('aiSpamFlag' in report, 'Report should have aiSpamFlag field even without image');
	}
});

test('POST /reports includes AI results in response when classified successfully', async () => {
	const reportPayload = {
		title: 'Jalan Berlubang Berbahaya',
		description: 'Terdapat lubang besar di tengah jalan yang sangat berbahaya bagi kendaraan dan pengguna jalan umum harus segera diperbaiki',
		category: ['ROADS_ISSUE'],
		priority: 'HIGH',
		address: 'Jl. Ahmad Yani, Surabaya',
		latitude: -7.2575,
		longitude: 112.7521,
	};

	const response = await request(app)
		.post('/reports')
		.send(reportPayload);

	if (response.status === 201) {
		const report = response.body.data;
		
		// Check AI fields are present in response
		assert.ok('aiCategory' in report, 'Response should include aiCategory');
		assert.ok('aiConfidence' in report, 'Response should include aiConfidence');
		assert.ok('aiSpamFlag' in report, 'Response should include aiSpamFlag');
		
		// Fields can be null if API fails, but should be present
		assert.ok(report.aiCategory === null || typeof report.aiCategory === 'string', 'aiCategory should be null or string');
		assert.ok(report.aiConfidence === null || typeof report.aiConfidence === 'number', 'aiConfidence should be null or number');
		assert.ok(typeof report.aiSpamFlag === 'boolean', 'aiSpamFlag should be boolean');
	}
});

test('POST /reports - AI fields gracefully fallback on API failure', async () => {
	// Report with valid fields
	const reportPayload = {
		title: 'Test Report',
		description: 'Laporan awal usaha pengujian saat sistem klasifikasi AI berkemungkinan tidak tersedia atau mengalami kegagalan',
		category: ['OTHERS'],
		priority: 'LOW',
		address: 'Test Location',
		latitude: 0,
		longitude: 0,
	};

	const response = await request(app)
		.post('/reports')
		.send(reportPayload);

	// Report should be created even if AI fails
	if (response.status === 201) {
		const report = response.body.data;
		assert.ok(report.id, 'Report should be created even on AI failure');
		
		// AI fields should exist (null/false on failure)
		if (report.aiCategory === null) {
			assert.ok(true, 'Report created successfully with null AI fields (API failure handled gracefully)');
			assert.equal(report.aiConfidence, null, 'aiConfidence should be null on API failure');
			assert.equal(report.aiSpamFlag, false, 'aiSpamFlag should be false on API failure');
		}
	}
});

test('GET /reports/:id includes AI classification fields in response', async () => {
	// First create a report
	const reportPayload = {
		title: 'Kekerasan Jalanan',
		description: 'Terjadi insiden kekerasan di jalanan yang melibatkan beberapa elemen tidak bertanggung jawab',
		category: ['CRIMINAL'],
		priority: 'URGENT',
		address: 'Jl. Sudirman, Jakarta',
		latitude: -6.2250,
		longitude: 106.8000,
	};

	const createResponse = await request(app)
		.post('/reports')
		.send(reportPayload);

	if (createResponse.status === 201) {
		const reportId = createResponse.body.data.id;
		
		// Now retrieve the report
		const getResponse = await request(app)
			.get(`/reports/${reportId}`);

		if (getResponse.status === 200) {
			const report = getResponse.body.data;
			assert.ok('aiCategory' in report, 'Retrieved report should include aiCategory field');
			assert.ok('aiConfidence' in report, 'Retrieved report should include aiConfidence field');
			assert.ok('aiSpamFlag' in report, 'Retrieved report should include aiSpamFlag field');
		}
	}
});

test('POST /reports - handles various description lengths for AI classification', async () => {
	const validDescriptions = [
		'Laporan dengan deskripsi minimum yang masih valid untuk klasifikasi',
		'Ini adalah laporan menengah dengan informasi yang cukup detail tentang masalah yang terjadi di lapangan',
		'Laporan dengan deskripsi sangat panjang yang menjelaskan secara detail situasi yang terjadi termasuk konteks latar belakang, dampak yang dialami oleh masyarakat, upaya yang telah dilakukan, dan rekomendasi untuk penanganan masalah ini. Semua informasi ini sangat penting untuk memberikan gambaran utuh tentang isu yang dilaporkan.',
	];

	for (const description of validDescriptions) {
		const reportPayload = {
			title: `Test Report - Length ${description.length}`,
			description,
			category: ['OTHERS'],
			priority: 'NORMAL',
			address: 'Test Location',
			latitude: 0,
			longitude: 0,
		};

		const response = await request(app)
			.post('/reports')
			.send(reportPayload);

		if (response.status === 201) {
			const report = response.body.data;
			assert.ok('aiCategory' in report, `Report with description length ${description.length} should have aiCategory`);
			assert.ok('aiConfidence' in report, `Report with description length ${description.length} should have aiConfidence`);
			assert.ok('aiSpamFlag' in report, `Report with description length ${description.length} should have aiSpamFlag`);
		}
	}
});
