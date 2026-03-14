import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import newman from 'newman';
import { app } from '../src/app.js';

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, 'reports', 'newman');
const collectionPath = path.join(rootDir, 'postman', 'SentraWarga Backend.postman_collection.json');
const environmentPath = path.join(rootDir, 'postman', 'SentraWarga Local.postman_environment.json');

const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
const environment = JSON.parse(fs.readFileSync(environmentPath, 'utf8'));

const server = app.listen(0, '127.0.0.1', () => {
	const address = server.address();
	const port = typeof address === 'object' && address ? address.port : 3000;
	const baseUrl = `http://127.0.0.1:${port}`;

	for (const item of environment.values) {
		if (item.key === 'baseUrl') {
			item.value = baseUrl;
		}
		if (item.key === 'accessToken') {
			item.value = '';
		}
	}

	fs.mkdirSync(reportsDir, { recursive: true });

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
			server.close(() => {
				if (error || summary?.error || (summary?.run?.failures?.length ?? 0) > 0) {
					process.exit(1);
				}

				process.exit(0);
			});
		},
	);
});
