import rateLimit from 'express-rate-limit';

// Rate limit per email (not per IP)
// Example: max 3 requests per hour per email
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => {
    // Use normalized email as key if present, else fallback to IP
    const email = req.body?.email || req.query?.email || '';
    return String(email).trim().toLowerCase() || req.ip;
  },
  message: {
    success: false,
    message: 'Terlalu banyak permintaan untuk email ini. Silakan coba lagi nanti.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
