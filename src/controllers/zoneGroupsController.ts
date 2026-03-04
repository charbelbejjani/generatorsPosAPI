import type { Request, Response } from 'express';
import '../types';
import * as zoneGroupsService from '../services/zoneGroupsService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneGroups = await zoneGroupsService.getAll();
    res.json(zoneGroups);
  } catch (error) {
    console.error('Get all zone groups error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch zone groups' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneGroup = await zoneGroupsService.getById(req.params.id);
    if (!zoneGroup) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Zone group not found' });
      return;
    }
    res.json(zoneGroup);
  } catch (error) {
    console.error('Get zone group by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch zone group' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, active } = req.body as {
      name?: string;
      description?: string;
      active?: boolean;
    };

    if (!name) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'Zone group name is required' });
      return;
    }

    const userId = req.user?.userid;
    const zoneGroup = await zoneGroupsService.create({
      name,
      description,
      active: active !== undefined ? active : true,
      userId,
    });

    res.status(201).json(zoneGroup);
  } catch (error) {
    console.error('Create zone group error:', error);
    const err = error as Error;
    if (err.message === 'ZONE_GROUP_EXISTS') {
      res.status(409).json({ error: 'ZONE_GROUP_EXISTS', message: 'Zone group with this name already exists' });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create zone group' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, active } = req.body as { description?: string; active?: boolean };
    const userId = req.user?.userid;

    const zoneGroup = await zoneGroupsService.update(req.params.id, { description, active, userId });
    if (!zoneGroup) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Zone group not found' });
      return;
    }
    res.json(zoneGroup);
  } catch (error) {
    console.error('Update zone group error:', error);
    const err = error as Error;
    if (err.message === 'CANNOT_DEACTIVATE_HAS_ACTIVE_ZONES') {
      res.status(400).json({ error: 'CANNOT_DEACTIVATE', message: 'Cannot deactivate zone group with active zones' });
      return;
    }
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update zone group' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await zoneGroupsService.remove(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Zone group not found' });
      return;
    }
    res.json({ success: true, message: 'Zone group deactivated successfully' });
  } catch (error) {
    console.error('Delete zone group error:', error);
    const err = error as Error;
    if (err.message === 'CANNOT_DELETE_HAS_ACTIVE_ZONES') {
      res.status(400).json({ error: 'CANNOT_DELETE', message: 'Cannot delete zone group with active zones' });
      return;
    }
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete zone group' });
  }
};
