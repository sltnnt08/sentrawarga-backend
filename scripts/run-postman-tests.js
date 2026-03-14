import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import newman from 'newman';

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, 'reports', 'newman');
const collectionPath = path.join(rootDir, 'postman', 'SentraWarga Backend.postman_collection.json');
const environmentPath = path.join(rootDir, 'postman', 'SentraWarga Local.postman_environment.json');
const baseUrl = process.env.POSTMAN_BASE_URL ?? 'https://sentrawarga-backend.onrender.com';

const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
const environment = JSON.parse(fs.readFileSync(environmentPath, 'utf8'));

const HEALTH_CHECK_TIMEOUT_MS = 30_000;
const HEALTH_CHECK_INTERVAL_MS = 500;
const SERVER_SHUTDOWN_TIMEOUT_MS = 5_000;

const toHealthzUrl = (url) => {
	const parsed = new URL(url);
	parsed.pathname = '/healthz';
	parsed.search = '';
	parsed.hash = '';
	return parsed.toString();
};

const isServerHealthy = async (url) => {
	try {
		const response = await fetch(toHealthzUrl(url), {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		});

		return response.ok;
	} catch {
		return false;
	}
};

const waitForServerHealthy = async (url, timeoutMs) => {
	const startedAt = Date.now();

	while (Date.now() - startedAt < timeoutMs) {
		if (await isServerHealthy(url)) {
			return;
		}

		await delay(HEALTH_CHECK_INTERVAL_MS);
	}

	throw new Error(
		`Timed out waiting for backend to become healthy at ${toHealthzUrl(url)} after ${timeoutMs}ms`,
	);
};

const startBackendServer = () => {
	const child = spawn(process.execPath, ['./src/server.js'], {
		cwd: rootDir,
		env: process.env,
		stdio: 'inherit',
	});

	child.on('error', (error) => {
		console.error('Failed to start backend server for Postman tests:', error);
	});

	return child;
};

const stopBackendServer = async (child) => {
	if (!child || child.killed || child.exitCode !== null) {
		return;
	}

	child.kill('SIGTERM');

	await Promise.race([
		new Promise((resolve) => {
			child.once('exit', resolve);
		}),
		delay(SERVER_SHUTDOWN_TIMEOUT_MS).then(() => {
			if (child.exitCode === null && !child.killed) {
				child.kill('SIGKILL');
			}
		}),
	]);
};

const runNewmanCollection = () =>
	new Promise((resolve, reject) => {
		newman.run(
			{
				collection,
				environment,
				reporters: ['cli', 'junit'],
				reporter: {
					junit: {
						export: path.join(reportsDir, 'newman.xml'),
					},
				},
				insecure: false,
			},
			(error, summary) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(summary);
			},
		);
	});

for (const item of environment.values) {
	if (item.key === 'baseUrl') {
		item.value = baseUrl;
	}
	if (item.key === 'accessToken') {
		item.value = '';
	}
}

fs.mkdirSync(reportsDir, { recursive: true });

const main = async () => {
	let serverProcess = null;
	let startedByScript = false;

	try {
		if (!(await isServerHealthy(baseUrl))) {
			serverProcess = startBackendServer();
			startedByScript = true;
			await waitForServerHealthy(baseUrl, HEALTH_CHECK_TIMEOUT_MS);
		}

		const summary = await runNewmanCollection();
		const hasFailures = Boolean(summary?.error) || (summary?.run?.failures?.length ?? 0) > 0;

		process.exitCode = hasFailures ? 1 : 0;
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
	} finally {
		if (startedByScript) {
			await stopBackendServer(serverProcess);
		}
	}
};

void main();
