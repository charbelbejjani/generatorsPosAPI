import type { Request, Response, NextFunction } from 'express';
import * as permissionsService from '../services/permissionsService';
import '../types';

export const PERMISSION_LEVELS: Record<string, number> = {
  READ: 1,
  EDIT: 2,
  ADD: 3,
  DELETE: 4,
};

export const authorize = (
  pageIdentifier: number | string,
  requiredPermission = 'read',
  checkDB = true
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'AUTHENTICATION_REQUIRED', message: 'Please authenticate first' });
        return;
      }

      const { group_id, permissions, pages } = req.user;

      const permissionLevel = PERMISSION_LEVELS[requiredPermission.toUpperCase()];
      if (!permissionLevel) {
        res.status(500).json({ error: 'INVALID_PERMISSION_LEVEL', message: 'Invalid permission level specified' });
        return;
      }

      let pageId: number;
      if (typeof pageIdentifier === 'string') {
        const found = await permissionsService.getPageIdByIdentifier(pageIdentifier);
        if (!found) {
          res.status(404).json({ error: 'PAGE_NOT_FOUND', message: 'Page not found' });
          return;
        }
        pageId = found;
      } else {
        pageId = pageIdentifier;
      }

      const hasAccessInToken = pages.includes(pageId);
      const tokenPermissionLevel = permissions[pageId] ?? 0;

      if (!hasAccessInToken || tokenPermissionLevel < permissionLevel) {
        res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have permission to perform this action' });
        return;
      }

      if (checkDB) {
        const hasDBPermission = await permissionsService.hasPermission(group_id, pageId, permissionLevel);
        if (!hasDBPermission) {
          res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have permission to perform this action' });
          return;
        }
      }

      req.pageContext = { pageId, permission: requiredPermission, permissionLevel };
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'AUTHORIZATION_FAILED', message: 'Failed to verify permissions' });
    }
  };
};

export const authorizeControl = (controlId: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'AUTHENTICATION_REQUIRED', message: 'Please authenticate first' });
        return;
      }

      const { controls } = req.user;
      if (!controls.includes(controlId)) {
        res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have access to this control' });
        return;
      }

      next();
    } catch (error) {
      console.error('Control authorization error:', error);
      res.status(500).json({ error: 'AUTHORIZATION_FAILED', message: 'Failed to verify control access' });
    }
  };
};
