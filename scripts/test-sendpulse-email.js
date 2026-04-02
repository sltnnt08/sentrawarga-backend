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

	const sentAt = new Date().toLocaleString('id-ID', {
		dateStyle: 'full',
		timeStyle: 'long',
	});

	const info = await transporter.sendMail({
		from,
		to,
		subject: 'Tes SMTP SentraWarga Berhasil',
		text: `Halo,

Ini adalah email tes dari sistem SentraWarga.

Jika email ini masuk, berarti konfigurasi SendPulse SMTP kamu sudah aktif dan siap dipakai untuk:
- Verifikasi email pengguna baru
- Reset kata sandi

Waktu pengiriman: ${sentAt}

Terima kasih,
Tim SentraWarga`,
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Tes SMTP SentraWarga</title>
			</head>
			<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
					<tr>
						<td style="background:linear-gradient(135deg,#059669,#10b981);padding:20px 24px;color:#ffffff;">
							<h2 style="margin:0;font-size:22px;">Tes SMTP SentraWarga Berhasil</h2>
						</td>
					</tr>
					<tr>
						<td style="padding:24px;line-height:1.65;">
							<p style="margin:0 0 14px;">Halo,</p>
							<p style="margin:0 0 14px;">Ini adalah email tes dari sistem <strong>SentraWarga</strong>.</p>
							<p style="margin:0 0 14px;">Jika email ini masuk, berarti konfigurasi <strong>SendPulse SMTP</strong> kamu sudah aktif dan siap dipakai untuk:</p>
							<ul style="margin:0 0 16px 18px;padding:0;">
								<li>Verifikasi email pengguna baru</li>
								<li>Reset kata sandi</li>
							</ul>
							<p style="margin:0 0 6px;"><strong>Waktu pengiriman:</strong> ${sentAt}</p>
						</td>
					</tr>
					<tr>
						<td style="padding:16px 24px;background:#f8fafc;color:#475569;font-size:13px;">
							Terima kasih,<br />Tim SentraWarga
						</td>
					</tr>
				</table>
			</body>
			</html>
		`,
	});

	console.log('SendPulse send success:', { messageId: info.messageId });
};

run().catch((err) => {
	console.error('SendPulse send failed:', err);
	process.exit(1);
});
