import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { Errors, ISessionUser } from '@src/models/common/types';
import { IUser } from '@src/models/User.model';
import AuthRepo from '@src/repos/AuthRepo';
import UserRepo from '@src/repos/UserRepo';
import JwtUtils from '@src/common/utils/session-authenticate'
import EnvVars from '@src/common/constants/env';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Authenticate a user.
 */
async function authenticate(username: string, passwordInput: string): Promise<IUser> {
  const user = await UserRepo.getOne(username);
  if (!user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
  }

  const isMatch = await UserRepo.comparePassword(passwordInput, user.password);
  if (!isMatch) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
  }

  return user;
}


async function refresh(token: string) {
  const tokenDb = await AuthRepo.findToken(token);
  if (!tokenDb) throw new Error('Token not found in database');

  if (tokenDb.expires_at < new Date()) {
    await AuthRepo.deleteToken(token);
    throw new Error('Token expired');
  }

  await JwtUtils.verifyToken(token,EnvVars.JwtRefreshTokenKey);

  const sessionUser: ISessionUser = {
    id: tokenDb.user.user_id,
    username: tokenDb.user.username,
    role: tokenDb.user.role,
  };

  return JwtUtils.generateAccessToken(sessionUser);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  authenticate,
  refresh
} as const;
