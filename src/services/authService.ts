import prisma from '../prisma';
import * as passwordHelper from '../utils/passwordHelper';
import * as jwtHelper from '../utils/jwtHelper';
import * as tokenService from './tokenService';
import * as permissionsService from './permissionsService';

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS ?? '5', 10);

export interface LoginInput {
  username: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    userid: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    group_id: number | null;
    groupname?: string;
  };
  permissions: permissionsService.FullPermissionData;
}

export const login = async ({
  username,
  password,
  ipAddress,
  userAgent,
}: LoginInput): Promise<LoginResult> => {
  const user = await prisma.users.findFirst({
    where: { username },
    include: { users_groups: true },
  });

  if (!user) throw new Error('INVALID_CREDENTIALS');
  if (!user.active) throw new Error('ACCOUNT_INACTIVE');
  if (user.locked) throw new Error('ACCOUNT_LOCKED');
  if ((user.loginattempts ?? 0) >= MAX_LOGIN_ATTEMPTS) {
    await prisma.users.update({ where: { userid: user.userid }, data: { locked: true } });
    throw new Error('ACCOUNT_LOCKED_MAX_ATTEMPTS');
  }

  const isPasswordValid = await passwordHelper.comparePassword(password, user.password ?? '');
  if (!isPasswordValid) {
    await prisma.users.update({
      where: { userid: user.userid },
      data: { loginattempts: (user.loginattempts ?? 0) + 1 },
    });
    throw new Error('INVALID_CREDENTIALS');
  }

  await prisma.users.update({
    where: { userid: user.userid },
    data: { loginattempts: 0, last_login: new Date() },
  });
  await prisma.tbluserlogin.create({ data: { log_userid: user.userid, log_type: 1 } });

  const permissionData = await permissionsService.getFullPermissionData(user.group_id!);
  const groupname = user.users_groups?.groupname ?? undefined;

  const accessToken = jwtHelper.generateAccessToken({
    userid: user.userid,
    username: user.username ?? '',
    group_id: user.group_id!,
    groupname,
    permissions: permissionData.permissions,
    pages: permissionData.pages,
    controls: permissionData.controls,
  });

  const refreshTokenString = tokenService.generateRefreshTokenString();
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  await tokenService.storeRefreshToken({
    token: refreshTokenString,
    userid: user.userid,
    expiresAt: refreshTokenExpiry,
    ipAddress,
    userAgent,
  });

  return {
    access_token: accessToken,
    refresh_token: refreshTokenString,
    expires_in: 900,
    token_type: 'Bearer',
    user: {
      userid: user.userid,
      username: user.username ?? '',
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      group_id: user.group_id,
      groupname,
    },
    permissions: permissionData,
  };
};

export interface RefreshResult {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export const refresh = async (refreshToken: string): Promise<RefreshResult> => {
  const tokenData = await tokenService.verifyRefreshToken(refreshToken);

  const user = await prisma.users.findUnique({
    where: { userid: tokenData.rt_userid! },
    include: { users_groups: true },
  });
  if (!user) throw new Error('USER_NOT_FOUND');
  if (!user.active) throw new Error('ACCOUNT_INACTIVE');
  if (user.locked) throw new Error('ACCOUNT_LOCKED');

  const permissionData = await permissionsService.getFullPermissionData(user.group_id!);

  const accessToken = jwtHelper.generateAccessToken({
    userid: user.userid,
    username: user.username ?? '',
    group_id: user.group_id!,
    groupname: user.users_groups?.groupname ?? undefined,
    permissions: permissionData.permissions,
    pages: permissionData.pages,
    controls: permissionData.controls,
  });

  return { access_token: accessToken, expires_in: 900, token_type: 'Bearer' };
};

export interface LogoutInput {
  refreshToken: string;
  userid: number;
}

export const logout = async ({ refreshToken, userid }: LogoutInput): Promise<{ success: boolean }> => {
  await tokenService.revokeRefreshToken(refreshToken);
  await prisma.tbluserlogin.create({ data: { log_userid: userid, log_type: 0 } });
  return { success: true };
};

export const getCurrentUser = async (userid: number) => {
  const user = await prisma.users.findUnique({
    where: { userid: Number(userid) },
    include: { users_groups: true },
  });
  if (!user) throw new Error('USER_NOT_FOUND');
  const permissionData = await permissionsService.getFullPermissionData(user.group_id!);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safeUser } = user;
  return { ...safeUser, permissions: permissionData };
};

export interface ChangePasswordInput {
  userid: number;
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async ({
  userid,
  currentPassword,
  newPassword,
}: ChangePasswordInput): Promise<{ success: boolean }> => {
  const user = await prisma.users.findUnique({ where: { userid: Number(userid) } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const isPasswordValid = await passwordHelper.comparePassword(currentPassword, user.password ?? '');
  if (!isPasswordValid) throw new Error('INVALID_CURRENT_PASSWORD');

  const validation = passwordHelper.validatePasswordStrength(newPassword);
  if (!validation.valid) throw new Error(validation.message);

  const hashedPassword = await passwordHelper.hashPassword(newPassword);
  await prisma.users.update({ where: { userid: Number(userid) }, data: { password: hashedPassword } });
  await tokenService.revokeAllUserTokens(userid);

  return { success: true };
};
