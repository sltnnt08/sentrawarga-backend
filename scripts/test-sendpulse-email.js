import 'dotenv/config';
import nodemailer from 'nodemailer';

const host = process.env.SENDPULSE_SMTP_HOST || 'smtp-pulse.com';
const port = Number.parseInt(process.env.SENDPULSE_SMTP_PORT || '465', 10);
const hasSecureOverride = process.env.SENDPULSE_SMTP_SECURE != null && process.env.SENDPULSE_SMTP_SECURE !== '';
const secure = hasSecureOverride
	? String(process.env.SENDPULSE_SMTP_SECURE).toLowerCase() === 'true'
	: port === 465;
const user = process.env.SENDPULSE_SMTP_USER;
const pass = process.env.SENDPULSE_SMTP_PASS;
const from = process.env.SENDPULSE_FROM_EMAIL;
const to = process.env.SENDPULSE_TEST_TO;

if (!user || !pass || !from || !to) {
	console.error('Missing required env keys in backend/.env');
	console.error('Required: SENDPULSE_SMTP_USER, SENDPULSE_SMTP_PASS, SENDPULSE_FROM_EMAIL, SENDPULSE_TEST_TO');
	process.exit(1);
}

const transporter = nodemailer.createTransport({
	host,
	port,
	secure,
	auth: {
		user,
		pass,
	},
});

const run = async () => {
	if (port !== 465 && secure) {
		console.warn(
			'[Warn] SMTP config looks unusual: secure=true with port not 465. For port 2525/587 set SENDPULSE_SMTP_SECURE=false.',
		);
	}

	console.log('Testing SendPulse SMTP connection with config:', {
		host,
		port,
		secure,
		from,
		to,
	});

	await transporter.verify();
	console.log('SMTP connection verified. Sending test email...');

	const info = await transporter.sendMail({
		from,
		to,
		subject: 'Hello World',
		html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
	});

	console.log('SendPulse send success:', { messageId: info.messageId });
};

run().catch((err) => {
	console.error('SendPulse send failed:', err);
	process.exit(1);
});
