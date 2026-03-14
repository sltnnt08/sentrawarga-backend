import { randomBytes } from 'node:crypto';

const requestedLength = Number.parseInt(process.argv[2] ?? '64', 10);
const byteLength = Number.isNaN(requestedLength) || requestedLength < 32 ? 64 : requestedLength;

const secret = randomBytes(byteLength).toString('hex');

console.log(secret);
