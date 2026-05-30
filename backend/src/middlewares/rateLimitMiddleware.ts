import rateLimit from 'express-rate-limit';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false,
  handler: () => {
    throw new RouteError(
      HttpStatusCodes.TOO_MANY_REQUESTS,
      'Too many requests, please try again later.',
    );
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new RouteError(
      HttpStatusCodes.TOO_MANY_REQUESTS,
      'Too many login attempts, please try again after an hour.',
    );
  },
});

export default {
  default: limiter,
  auth: authLimiter,
} as const;