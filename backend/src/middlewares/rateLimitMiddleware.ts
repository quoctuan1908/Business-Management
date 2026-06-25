import rateLimit from 'express-rate-limit';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';

const isDev = process.env.NODE_ENV === 'development';

const skipIfAuthenticated = (req: any) => {
  if (req.user || req.session?.user || req.headers.authorization) {
    return true;
  }
  return false;
};

const limiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 1000 : 100, 
  standardHeaders: true, 
  legacyHeaders: false,
  skip: skipIfAuthenticated,
  handler: () => {
    throw new RouteError(
      HttpStatusCodes.TOO_MANY_REQUESTS,
      'Too many requests, please try again later.',
    );
  },
});

const authLimiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : 60 * 60 * 1000,
  max: isDev ? 100 : 10, 
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