import crypto from 'crypto';

/**
 * Generate random token untuk email verification dan password reset
 */
export const generateToken = (length = 32) => {
	return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate OTP (6 digit)
 */
export const generateOtp = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};
