import { env } from '../config/env.js';

/**
 * Send email menggunakan Resend API
 * Untuk development tanpa API key, log ke console
 */
export const sendEmail = async ({ to, subject, html, text }) => {
	if (!env.resendApiKey) {
		// Development mode - log to console
		console.log('📧 [Email] Development Mode');
		console.log(`To: ${to}`);
		console.log(`Subject: ${subject}`);
		console.log(`\n${text || html}\n`);
		return { success: true, isDev: true };
	}

	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.resendApiKey}`,
			},
			body: JSON.stringify({
				from: 'noreply@sentrawarga.com',
				to,
				subject,
				html: html || text,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('Email send error:', error);
			throw new Error(`Email send failed: ${error.message}`);
		}

		const data = await response.json();
		console.log(`✅ Email sent to ${to}`, { id: data.id });
		return { success: true, id: data.id };
	} catch (error) {
		console.error('Error sending email:', error);
		throw error;
	}
};

/**
 * Send email verifikasi
 */
export const sendVerificationEmail = async (email, token) => {
	const verificationUrl = `${env.appBaseUrl}/verifikasi-email?email=${encodeURIComponent(email)}&token=${token}`;

	const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Verifikasi Email Anda</h2>
        </div>
        <div class="content">
          <p>Halo,</p>
          <p>Terima kasih telah mendaftar di <strong>SentraWarga</strong>! Silakan klik tombol di bawah untuk memverifikasi email Anda.</p>
          <a href="${verificationUrl}" class="button">Verifikasi Email</a>
          <p>Atau salin tautan ini: <a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>Link verifikasi berlaku selama 24 jam.</p>
          <p>Jika Anda tidak membuat akun ini, abaikan email ini.</p>
        </div>
        <div class="footer">
          <p>© 2026 SentraWarga. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
  `;

	return sendEmail({
		to: email,
		subject: 'Verifikasi Email - SentraWarga',
		html,
		text: `Silakan klik tautan ini untuk memverifikasi email: ${verificationUrl}`,
	});
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, token) => {
	const resetUrl = `${env.appBaseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

	const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
        .warning { color: #dc2626; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Reset Kata Sandi Anda</h2>
        </div>
        <div class="content">
          <p>Halo,</p>
          <p>Kami menerima permintaan untuk mereset kata sandi akun Anda. Silakan klik tombol di bawah untuk membuat kata sandi baru.</p>
          <a href="${resetUrl}" class="button">Reset Kata Sandi</a>
          <p>Atau salin tautan ini: <a href="${resetUrl}">${resetUrl}</a></p>
          <p class="warning">⚠️ Link reset berlaku selama 1 jam. Jangan bagikan link ini kepada siapa pun.</p>
          <p>Jika Anda tidak meminta reset kata sandi ini, abaikan email ini dan kata sandi Anda akan tetap aman.</p>
        </div>
        <div class="footer">
          <p>© 2026 SentraWarga. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
  `;

	return sendEmail({
		to: email,
		subject: 'Reset Kata Sandi - SentraWarga',
		html,
		text: `Silakan klik tautan ini untuk mereset kata sandi: ${resetUrl}`,
	});
};
