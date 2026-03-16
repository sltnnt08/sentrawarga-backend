import { Router } from 'express';
import { callbackHandler, loginHandler, meHandler, registerHandler } from '../controllers/auth-controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authRateLimiter } from '../middlewares/security.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validators/auth-validator.js';

const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, validate(registerSchema), registerHandler);
authRoutes.post('/login', authRateLimiter, validate(loginSchema), loginHandler);
authRoutes.get('/callback', callbackHandler);
authRoutes.get('/me', authenticate, meHandler);

export { authRoutes };
