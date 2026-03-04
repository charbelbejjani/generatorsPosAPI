import crypto from 'crypto';
import prisma from '../prisma';

export interface StoredToken {
  rt_id: number;
  rt_token: string | null;
  rt_userid: number | null;
  rt_expires_at: Date | null;
  rt_revoked: boolean | null;
  rt_created_at: Date | null;
}

export interface StoreRefreshTokenInput {
  token: string;
  userid: number;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export const generateRefreshTokenString = (): string =>
  crypto.randomBytes(64).toString('hex');

export const storeRefreshToken = async ({
  token,
  userid,
  expiresAt,
  ipAddress,
  userAgent,
}: StoreRefreshTokenInput): Promise<number> => {
  const created = await prisma.refresh_tokens.create({
    data: { rt_token: token, rt_userid: userid, rt_expires_at: expiresAt, rt_ip_address: ipAddress, rt_user_agent: userAgent },
  });
  return created.rt_id;
};

export const findRefreshToken = async (token: string): Promise<StoredToken | null> => {
  return prisma.refresh_tokens.findFirst({
    where: { rt_token: token, rt_revoked: false },
    select: {
      rt_id: true,
      rt_token: true,
      rt_userid: true,
      rt_expires_at: true,
      rt_revoked: true,
      rt_created_at: true,
    },
  });
};

export const verifyRefreshToken = async (token: string): Promise<StoredToken> => {
  const tokenData = await findRefreshToken(token);
  if (!tokenData) throw new Error('INVALID_REFRESH_TOKEN');
  if (tokenData.rt_revoked) throw new Error('INVALID_REFRESH_TOKEN');
  const now = new Date();
  if (tokenData.rt_expires_at && now > tokenData.rt_expires_at) {
    throw new Error('REFRESH_TOKEN_EXPIRED');
  }
  return tokenData;
};

export const revokeRefreshToken = async (token: string): Promise<boolean> => {
  const updated = await prisma.refresh_tokens.updateMany({
    where: { rt_token: token },
    data: { rt_revoked: true },
  });
  return updated.count > 0;
};

export const revokeAllUserTokens = async (userid: number): Promise<number> => {
  const updated = await prisma.refresh_tokens.updateMany({
    where: { rt_userid: userid, rt_revoked: false },
    data: { rt_revoked: true },
  });
  return updated.count;
};

export const cleanupExpiredTokens = async (): Promise<number> => {
  // Raw SQL for complex DATE_SUB expressions not supported by Prisma directly
  return prisma.$executeRawUnsafe(
    `DELETE FROM refresh_tokens WHERE rt_expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY) OR (rt_revoked = 1 AND rt_created_at < DATE_SUB(NOW(), INTERVAL 30 DAY))`
  );
};
