import jwt from 'jsonwebtoken';
import { env } from './env';
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

export interface AccessTokenPayload {
  userId: string;
  email: string;
  name: string;
}

export const signAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      name: payload.name
    },
    env.JWT_SECRET,
    {
      subject: payload.userId,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS
    }
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload & jwt.JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload & jwt.JwtPayload;
};
