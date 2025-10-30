import { createUser, findUserByEmail } from '../db/userRepository';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken } from '../utils/token';
import { AppError } from '../utils/errors';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    name: input.name
  });

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    name: user.name
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  };
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const passwordValid = await comparePassword(password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    name: user.name
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  };
};
