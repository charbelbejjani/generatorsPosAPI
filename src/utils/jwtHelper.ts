import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';

export interface TokenPayload {
  userid: number;
  username: string;
  group_id: number;
  groupname?: string;
  permissions?: Record<number, number>;
  pages?: number[];
  controls?: number[];
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export type AccessTokenInput = Omit<TokenPayload, 'type' | 'iat' | 'exp'>;

export const generateAccessToken = (payload: AccessTokenInput): string => {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: Pick<TokenPayload, 'userid'>): string => {
  return jwt.sign({ userid: payload.userid, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === 'TokenExpiredError') throw new Error('TOKEN_EXPIRED');
    if (err.name === 'JsonWebTokenError') throw new Error('INVALID_TOKEN');
    throw error;
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  return jwt.decode(token) as TokenPayload | null;
};
