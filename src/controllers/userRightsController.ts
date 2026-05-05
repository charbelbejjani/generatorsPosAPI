import type { Request, Response } from 'express';
import '../types';
import * as userRightsService from '../services/userRightsService';

export const getRightsByGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const groupId = Number(req.params.groupId);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'INVALID_ID', message: 'Invalid group ID' });
      return;
    }

    const rights = await userRightsService.getRightsByGroup(groupId);
    res.json(rights);
  } catch (error) {
    console.error('Get rights by group error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch rights' });
  }
};

export const saveRights = async (req: Request, res: Response): Promise<void> => {
  try {
    const groupId = Number(req.params.groupId);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'INVALID_ID', message: 'Invalid group ID' });
      return;
    }

    const { rights } = req.body as {
      rights?: { pageId?: number; permission?: number }[];
    };

    if (!Array.isArray(rights)) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'rights array is required' });
      return;
    }

    const parsed = rights.map((r) => ({
      pageId: Number(r.pageId),
      permission: Number(r.permission),
    }));

    const invalid = parsed.find((r) => isNaN(r.pageId) || isNaN(r.permission) || r.permission < 0 || r.permission > 4);
    if (invalid) {
      res.status(400).json({ error: 'INVALID_FIELDS', message: 'Each right must have a valid pageId and permission (0-4)' });
      return;
    }

    await userRightsService.saveRights(groupId, parsed);
    res.status(204).send();
  } catch (error) {
    console.error('Save rights error:', error);
    const err = error as Error;
    if (err.message === 'GROUP_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User group not found' });
      return;
    }
    res.status(500).json({ error: 'SAVE_FAILED', message: 'Failed to save rights' });
  }
};

export const getControlsByPageAndGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const groupId = Number(req.params.groupId);
    const pageId = Number(req.params.pageId);

    if (isNaN(groupId) || isNaN(pageId)) {
      res.status(400).json({ error: 'INVALID_ID', message: 'Invalid group ID or page ID' });
      return;
    }

    const controls = await userRightsService.getControlsByPageAndGroup(pageId, groupId);
    res.json(controls);
  } catch (error) {
    console.error('Get controls error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch controls' });
  }
};

export const saveControls = async (req: Request, res: Response): Promise<void> => {
  try {
    const groupId = Number(req.params.groupId);
    const pageId = Number(req.params.pageId);

    if (isNaN(groupId) || isNaN(pageId)) {
      res.status(400).json({ error: 'INVALID_ID', message: 'Invalid group ID or page ID' });
      return;
    }

    const { controlIds } = req.body as { controlIds?: number[] };

    if (!Array.isArray(controlIds)) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'controlIds array is required' });
      return;
    }

    const parsed = controlIds.map(Number);
    if (parsed.some(isNaN)) {
      res.status(400).json({ error: 'INVALID_FIELDS', message: 'All controlIds must be valid numbers' });
      return;
    }

    await userRightsService.saveControls(groupId, pageId, parsed);
    res.status(204).send();
  } catch (error) {
    console.error('Save controls error:', error);
    const err = error as Error;
    if (err.message === 'GROUP_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User group not found' });
      return;
    }
    if (err.message === 'PAGE_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Page not found' });
      return;
    }
    res.status(500).json({ error: 'SAVE_FAILED', message: 'Failed to save controls' });
  }
};
