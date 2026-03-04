import type { Request, Response, NextFunction } from 'express';
import * as jwtHelper from '../utils/jwtHelper';
import '../types';

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'MISSING_TOKEN', message: 'Authorization token is required' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'INVALID_TOKEN_FORMAT', message: 'Token format should be: Bearer <token>' });
      return;
    }

    const token = parts[1];
    const decoded = jwtHelper.verifyToken(token);

    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'INVALID_TOKEN_TYPE', message: 'Invalid token type' });
      return;
    }

    req.user = {
      userid: decoded.userid,
      username: decoded.username,
      group_id: decoded.group_id,
      groupname: decoded.groupname,
      permissions: decoded.permissions ?? {},
      pages: decoded.pages ?? [],
      controls: decoded.controls ?? [],
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    const err = error as Error;
    if (err.message === 'TOKEN_EXPIRED') {
      res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Token has expired. Please refresh your token.' });
      return;
    }
    if (err.message === 'INVALID_TOKEN') {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid token provided' });
      return;
    }
    res.status(401).json({ error: 'AUTHENTICATION_FAILED', message: 'Authentication failed' });
  }
};

export default authenticate;
