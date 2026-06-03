import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { COOKIE_OPTIONS, Errors, ISessionUser } from '@src/models/common/types';
import AuthRepo from '@src/repos/AuthRepo';
import AuthService from '@src/services/AuthService';
import JwtUtils from '@src/common/utils/session-authenticate';
import { RouteError } from '@src/common/utils/route-errors';
import { isNonEmptyString, isString } from 'jet-validators';

import { Req, Res } from './common/express-types';
import parseReq from './common/parseReq';
import EnvVars from '@src/common/constants/env';
import UserRepo from '@src/repos/UserRepo';

/******************************************************************************
                                Constants
******************************************************************************/

const reqValidators = {
  login: parseReq({ 
    username: isNonEmptyString, 
    password: isNonEmptyString 
  }),
  register: parseReq({
    username: isNonEmptyString,
    password: isNonEmptyString,
    role: isString,
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Check authentication status and return current user data.
 * @route GET /api/auth/check
 */
async function check(req: Req, res: Res) {
  const token = req.cookies.accessToken;
  if (!token) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Session not found');
  }

  try {
    const userData = JwtUtils.decodeAccessToken(token);
    
    return res.status(HttpStatusCodes.OK).json({ 
      user: userData,
      isLoggedIn: true 
    });
  } catch (err) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Invalid or expired session');
  }
}

/**
 * Register a new user.
 * @route POST /api/auth/register
 */
async function register(req: Req, res: Res) {
  const { username, password, role } = reqValidators.register(req.body);
  
  const existingUser = await UserRepo.getOne(username);
  if (existingUser) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Username already exists');
  }
  await UserRepo.add({
    username,
    password,
    role: role || 'user',
    fullName: '',
    department: '',
    phoneNumber: '',
    email: '',
  });

  return res.status(HttpStatusCodes.CREATED).json({ message: 'Register successfully!' });
}

/**
 * Login user.
 * @route POST /api/auth/login
 */
async function login(req: Req, res: Res) {
  const { username, password } = reqValidators.login(req.body);
  const user = await AuthService.authenticate(username, password);
  if (!user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
  }
  const sessionUser: ISessionUser = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  const accessToken = JwtUtils.generateAccessToken(sessionUser);
  const refreshToken = JwtUtils.generateRefreshToken(sessionUser);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await AuthRepo.saveToken(sessionUser.id, refreshToken, expiresAt);

  res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return res.status(HttpStatusCodes.OK).json({ message: 'Login successfully' });
}

/**
 * Refresh Access Token.
 * @route GET /api/auth/refresh
 */
async function refresh(req: Req, res: Res) {
  const { refreshToken } = req.cookies;
  
  // 1. Kiểm tra xem Cookie Client gửi lên có đúng Token không
  console.log('====== DEBUG REFRESH: START ======');
  console.log('1. Raw RefreshToken từ Cookie:', refreshToken);

  if (!refreshToken) {
    console.log('❌ Lỗi: Không tìm thấy refreshToken trong Cookie');
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'No refresh token provided');
  }

  // 2. Kiểm tra dữ liệu tìm được trong Database
  const tokenDb = await AuthRepo.findToken(refreshToken);
  console.log('2. Dữ liệu Token lấy từ DB:', JSON.stringify(tokenDb, null, 2));

  if (!tokenDb) {
    console.log('❌ Lỗi: Token này không tồn tại trong Database (Có thể đã bị xóa hoặc Logout trước đó)');
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Session expired');
  }

  console.log('3. So sánh thời gian hết hạn:', {
    'Hạn của Token (expires_at)': tokenDb.expires_at,
    'Thời gian hiện tại (now)': new Date(),
    'Đã hết hạn chưa?': tokenDb.expires_at < new Date()
  });

  if (tokenDb.expires_at < new Date()) {
    console.log('❌ Lỗi: Token trong DB đã hết hạn. Đang tiến hành xóa...');
    await AuthRepo.deleteToken(refreshToken);
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Session expired');
  }

  // 3. Kiểm tra tính hợp lệ về mặt chữ ký mã hóa của JWT
  try {
    await JwtUtils.verifyToken(refreshToken, EnvVars.JwtRefreshTokenKey);
    console.log('4. Xác thực chữ ký JWT: Thành công (Token hợp lệ)');
  } catch (jwtErr) {
    console.log('❌ Lỗi: Chữ ký JWT không hợp lệ hoặc sai Secret Key:', jwtErr);
    throw jwtErr;
  }

  // 4. Kiểm tra cấu trúc định danh User truyền vào Access Token mới
  console.log('5. Kiểm tra dữ liệu user thô từ DB:', {
    user_id: tokenDb.user?.user_id,
    id: (tokenDb.user as any)?.id,
    username: tokenDb.user?.username,
    role: tokenDb.user?.role
  });

  const sessionUser: ISessionUser = {
    id: tokenDb.user.user_id,
    username: tokenDb.user.username,
    role: tokenDb.user.role,
  };
  
  console.log('6. Cấu trúc Object Session nạp vào Access Token mới:', sessionUser);

  const newAccessToken = JwtUtils.generateAccessToken(sessionUser);
  console.log('7. Access Token mới sinh ra thành công:', newAccessToken);

  res.cookie('accessToken', newAccessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  console.log('====== DEBUG REFRESH: END ======');

  return res.status(HttpStatusCodes.OK).json({ message: 'Token refreshed' });
}

/**
 * Logout.
 * @route GET /api/auth/logout
 */
async function logout(req: Req, res: Res) {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await AuthRepo.deleteToken(refreshToken);
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.status(HttpStatusCodes.OK).end();
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  login,
  refresh,
  logout,
  register,
  check
} as const;