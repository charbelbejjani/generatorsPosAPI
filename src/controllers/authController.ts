import type { Request, Response } from 'express';
import '../types';
import * as authService from '../services/authService';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: 'MISSING_CREDENTIALS', message: 'Username and password are required' });
      return;
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login({ username, password, ipAddress, userAgent });
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    const err = error as Error;
    const errorMap: Record<string, [number, string]> = {
      INVALID_CREDENTIALS: [401, 'Invalid username or password'],
      ACCOUNT_INACTIVE: [403, 'Account is inactive'],
      ACCOUNT_LOCKED: [403, 'Account is locked'],
      ACCOUNT_LOCKED_MAX_ATTEMPTS: [403, 'Account locked due to too many failed attempts'],
    };
    const [status, message] = errorMap[err.message] ?? [500, 'Login failed'];
    res.status(status).json({ error: err.message ?? 'LOGIN_FAILED', message });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body as { refresh_token?: string };

    if (!refresh_token) {
      res.status(400).json({ error: 'MISSING_TOKEN', message: 'Refresh token is required' });
      return;
    }

    const result = await authService.refresh(refresh_token);
    res.json(result);
  } catch (error) {
    console.error('Refresh error:', error);
    const err = error as Error;
    const errorMap: Record<string, [number, string]> = {
      INVALID_REFRESH_TOKEN: [401, 'Invalid refresh token'],
      REFRESH_TOKEN_EXPIRED: [401, 'Refresh token has expired'],
      USER_NOT_FOUND: [401, 'User not found'],
      ACCOUNT_INACTIVE: [403, 'Account is inactive'],
      ACCOUNT_LOCKED: [403, 'Account is locked'],
    };
    const [status, message] = errorMap[err.message] ?? [500, 'Token refresh failed'];
    res.status(status).json({ error: err.message ?? 'REFRESH_FAILED', message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body as { refresh_token?: string };
    const userid = req.user!.userid;

    if (!refresh_token) {
      res.status(400).json({ error: 'MISSING_TOKEN', message: 'Refresh token is required' });
      return;
    }

    const result = await authService.logout({ refreshToken: refresh_token, userid });
    res.json(result);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'LOGOUT_FAILED', message: 'Logout failed' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userid = req.user!.userid;
    const user = await authService.getCurrentUser(userid);
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    const err = error as Error;
    if (err.message === 'USER_NOT_FOUND') {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
      return;
    }
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to get user info' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body as {
      current_password?: string;
      new_password?: string;
    };
    const userid = req.user!.userid;

    if (!current_password || !new_password) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'current_password and new_password are required' });
      return;
    }

    const result = await authService.changePassword({
      userid,
      currentPassword: current_password,
      newPassword: new_password,
    });
    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    const err = error as Error;
    const errorMap: Record<string, [number, string]> = {
      USER_NOT_FOUND: [404, 'User not found'],
      INVALID_CURRENT_PASSWORD: [400, 'Current password is incorrect'],
    };
    const [status, message] = errorMap[err.message] ?? [500, 'Failed to change password'];
    res.status(status).json({ error: err.message ?? 'CHANGE_PASSWORD_FAILED', message });
  }
};
