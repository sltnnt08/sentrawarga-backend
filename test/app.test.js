import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

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
