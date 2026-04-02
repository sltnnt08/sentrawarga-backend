import { Router } from 'express';
import { callbackHandler, loginHandler, meHandler, registerHandler, verifyEmailHandler, resendVerificationEmailHandler, forgotPasswordHandler, resetPasswordHandler, googleAuthHandler } from '../controllers/auth-controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authRateLimiter } from '../middlewares/security.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema, verifyEmailSchema, resendVerificationEmailSchema, forgotPasswordSchema, resetPasswordSchema, googleAuthSchema } from '../validators/auth-validator.js';

const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, validate(registerSchema), registerHandler);
authRoutes.post('/login', authRateLimiter, validate(loginSchema), loginHandler);
authRoutes.post('/google', authRateLimiter, validate(googleAuthSchema), googleAuthHandler);
authRoutes.post('/verify-email', validate(verifyEmailSchema), verifyEmailHandler);
authRoutes.post('/resend-verification-email', authRateLimiter, validate(resendVerificationEmailSchema), resendVerificationEmailHandler);
authRoutes.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPasswordHandler);
authRoutes.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler);
authRoutes.get('/callback', callbackHandler);
authRoutes.get('/me', authenticate, meHandler);

export { authRoutes };
