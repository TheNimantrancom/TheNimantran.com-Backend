import { rateLimit } from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: {
    status: 429,
    success: false,
    message: "Please wait a bit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many registration attempts. Please wait a while.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
export const passwordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many change attempts. Try Later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
export const checkOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many verify attempts. Try Later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
