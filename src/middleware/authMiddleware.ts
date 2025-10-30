import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ message: 'Invalid Authorization header' });
  }

  try {
    const payload = verifyAccessToken(token);
    const userId = (payload.sub as string) ?? (payload as any).userId ?? '';
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.user = {
      id: userId,
      email: (payload as any).email ?? '',
      name: (payload as any).name ?? ''
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
