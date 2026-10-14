import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { Request, Response, NextFunction } from 'express';
import { ISessionUser } from '@src/models/common/types';

/******************************************************************************
                                Helpers
******************************************************************************/

const isDev = process.env.NODE_ENV === 'development';

const DEV_FACTOR = 10;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const byIp = (req: Request): string => ipKeyGenerator(req.ip ?? '');

const byUserOrIp = (req: Request, res: Response): string => {
  const user = res.locals.sessionUser as ISessionUser | undefined;
  const id = user?.userId;
  return id !== undefined && id !== null ? `user:${id}` : `ip:${byIp(req)}`;
};

const byIpAndAccount = (req: Request): string => {
  const body = (req.body ?? {}) as { email?: unknown; username?: unknown };
  const account = String(body.email ?? body.username ?? '')
    .trim()
    .toLowerCase();
  return `${byIp(req)}:${account}`;
};

interface LimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  keyGenerator?: (req: Request, res: Response) => string;
  skipSuccessfulRequests?: boolean;
}

const make = (opts: LimiterOptions) =>
  rateLimit({
    windowMs: opts.windowMs,
    limit: isDev ? opts.limit * DEV_FACTOR : opts.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: opts.keyGenerator ?? byIp,
    skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
    handler: (_req: Request, _res: Response, next: NextFunction) =>
      next(new RouteError(HttpStatusCodes.TOO_MANY_REQUESTS, opts.message)),
  });

/******************************************************************************
                                Limiters
******************************************************************************/

export default {
  default: make({
    windowMs: 15 * MINUTE,
    limit: 600,
    message: 'Too many requests, please try again later.',
    keyGenerator: byUserOrIp,
  }),

  public: make({
    windowMs: 15 * MINUTE,
    limit: 100,
    message: 'Too many requests, please try again later.',
  }),

  login: make({
    windowMs: 15 * MINUTE,
    limit: 5,
    message: 'Too many failed login attempts, please try again in 15 minutes.',
    keyGenerator: byIpAndAccount,
    skipSuccessfulRequests: true,
  }),

  loginByIp: make({
    windowMs: 15 * MINUTE,
    limit: 30,
    message: 'Too many failed login attempts from this IP, please try again later.',
    skipSuccessfulRequests: true,
  }),

  register: make({
    windowMs: HOUR,
    limit: 5,
    message: 'Too many registration attempts, please try again after an hour.',
  }),

  forgotPassword: make({
    windowMs: HOUR,
    limit: 5,
    message: 'Too many password reset requests, please try again after an hour.',
  }),

  resetPassword: make({
    windowMs: HOUR,
    limit: 10,
    message: 'Too many password reset attempts, please try again after an hour.',
  }),

  write: make({
    windowMs: MINUTE,
    limit: 60,
    message: 'Too many write operations, please slow down.',
    keyGenerator: byUserOrIp,
  }),

  chatbot: make({
    windowMs: MINUTE,
    limit: 10,
    message: 'You are sending messages too fast, please wait a moment.',
    keyGenerator: byUserOrIp,
  }),

  chatbotDaily: make({
    windowMs: DAY,
    limit: 200,
    message: 'Daily chatbot limit reached, please try again tomorrow.',
    keyGenerator: byUserOrIp,
  }),

  heavy: make({
    windowMs: HOUR,
    limit: 10,
    message: 'Too many heavy requests, please try again later.',
    keyGenerator: byUserOrIp,
  }),
} as const;