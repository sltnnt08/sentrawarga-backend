import { env } from '../config/env.js';
import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.sendpulseSmtpHost,
    port: env.sendpulseSmtpPort,
    secure: env.sendpulseSmtpSecure,
    auth: {
      user: env.sendpulseSmtpUser,
      pass: env.sendpulseSmtpPass,
    },
  });

  return transporter;
};

/**
 * Send email menggunakan SendPulse SMTP
 * Untuk development tanpa konfigurasi SMTP, log ke console
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!env.sendpulseSmtpUser || !env.sendpulseSmtpPass || !env.sendpulseFromEmail) {
		// Development mode - log to console
		console.log('📧 [Email] Development Mode');
		console.log(`To: ${to}`);
		console.log(`Subject: ${subject}`);
		console.log(`\n${text || html}\n`);
		return { success: true, isDev: true };
	}

	try {
    const info = await getTransporter().sendMail({
      from: env.sendpulseFromEmail,
      to,
      subject,
      text,
      html,
      replyTo: env.sendpulseReplyTo || undefined,
    });

    if (!info?.messageId) {
      throw new Error('Email send failed: messageId is missing');
		}

    console.log(`✅ Email sent to ${to}`, { messageId: info.messageId });
    return { success: true, id: info.messageId };
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
        .code { font-family: monospace; background: #e5e7eb; padding: 10px 14px; border-radius: 6px; display: inline-block; word-break: break-all; }
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
          <p>Kode verifikasi Anda:</p>
          <p class="code">${token}</p>
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
    text: `Kode verifikasi: ${token}\nSilakan klik tautan ini untuk memverifikasi email: ${verificationUrl}`,
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
