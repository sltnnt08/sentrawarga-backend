import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { setSupabaseClientForTest } from '../src/controllers/auth-controller.js';

test('GET / returns API running message', async () => {
	const response = await request(app).get('/');

	assert.equal(response.status, 200);
	assert.equal(response.body.success, true);
	assert.equal(response.body.message, 'API running');
});

test('GET /healthz returns service health', async () => {
	const response = await request(app).get('/healthz');

	assert.equal(response.status, 200);
	assert.equal(response.body.success, true);
	assert.equal(response.body.status, 'ok');
	assert.equal(response.body.service, 'sentrawarga-backend');
	assert.ok(response.body.timestamp);
});

test('unknown route returns 404 with request id', async () => {
	const response = await request(app).get('/route-does-not-exist');

	assert.equal(response.status, 404);
	assert.equal(response.body.success, false);
	assert.equal(response.body.message, 'Route not found');
	assert.ok(response.body.requestId);
	assert.ok(response.headers['x-request-id']);
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
