import test from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
import { sendVerificationEmail } from '../src/services/email-service.js';

test('sendVerificationEmail includes verification code and link for user', async () => {
	const originalSmtpUser = env.sendpulseSmtpUser;
	const originalSmtpPass = env.sendpulseSmtpPass;
	const originalFromEmail = env.sendpulseFromEmail;

	const logs = [];
	const originalConsoleLog = console.log;

	env.sendpulseSmtpUser = '';
	env.sendpulseSmtpPass = '';
	env.sendpulseFromEmail = '';

	console.log = (...args) => {
		logs.push(args.map((item) => String(item)).join(' '));
	};

	const email = 'user@example.com';
	const token = 'verify-token-123';

	try {
		const result = await sendVerificationEmail(email, token);
		assert.equal(result.success, true);

		const combinedLogs = logs.join('\n');
		const expectedUrl = `${env.appBaseUrl}/verifikasi-email?email=${encodeURIComponent(email)}`;

		assert.match(combinedLogs, /To: user@example.com/);
		assert.match(combinedLogs, /Verifikasi Email - SentraWarga/);
		assert.match(combinedLogs, /Kode verifikasi SentraWarga: verify-token-123/);
		assert.match(combinedLogs, new RegExp(expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	} finally {
		env.sendpulseSmtpUser = originalSmtpUser;
		env.sendpulseSmtpPass = originalSmtpPass;
		env.sendpulseFromEmail = originalFromEmail;
		console.log = originalConsoleLog;
	}
});
