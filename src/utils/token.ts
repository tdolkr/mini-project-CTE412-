import jwt from 'jsonwebtoken';
import { env } from './env';

interface SignTokenInput {
  userId: string;
  email: string;
  name: string;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

export const signAccessToken = (input: SignTokenInput) => {
  return jwt.sign(
    {
      email: input.email,
      name: input.name
    },
    env.JWT_SECRET,
    {
      subject: input.userId,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS
    }
  );
};

export const verifyAccessToken = (
  token: string
): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
};
