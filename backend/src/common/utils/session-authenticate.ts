import jsonwebtoken from 'jsonwebtoken';
import EnvVars from '@src/common/constants/env';
import { ISessionUser } from '@src/models/common/types';

function generateAccessToken(user: ISessionUser): string {
  return jsonwebtoken.sign(user, EnvVars.JwtTokenKey, { 
    expiresIn: '15m' 
  });
}

function generateRefreshToken(user: ISessionUser): string {
  return jsonwebtoken.sign({ user_id: user.user_id }, EnvVars.JwtRefreshTokenKey, { 
    expiresIn: '7d' 
  });
}

function verifyToken<T>(token: string, secret: string): Promise<T> {
  return new Promise((res, rej) => {
    jsonwebtoken.verify(token, secret, (err, decoded) => {
      return err ? rej(err) : res(decoded as T);
    });
  });
}

export default { generateAccessToken, generateRefreshToken, verifyToken } as const;