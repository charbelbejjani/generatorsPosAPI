import type { Request, Response } from 'express';
import '../types';
import * as zonesService from '../services/zonesService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneGroupId } = req.query as { zoneGroupId?: string };
    const zones = await zonesService.getAll(zoneGroupId ? parseInt(zoneGroupId, 10) : null);
    res.json(zones);
  } catch (error) {
    console.error('Get all zones error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch zones' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await zonesService.getById(parseInt(req.params.id, 10));
    if (!zone) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Zone not found' });
      return;
    }
    res.json(zone);
  } catch (error) {
    console.error('Get zone by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch zone' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, zoneGroupId, active } = req.body as {
      name?: string;
      zoneGroupId?: number;
      active?: boolean;
    };
    const userId = req.user?.userid;

    if (!name || !zoneGroupId) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'name and zoneGroupId are required' });
      return;
    }

    const zone = await zonesService.create({ name, zoneGroupId: Number(zoneGroupId), active, userId });
    res.status(201).json(zone);
  } catch (error) {
    console.error('Create zone error:', error);
    const err = error as Error;
    if (err.message === 'ZONE_GROUP_NOT_FOUND') {
      res.status(404).json({ error: 'ZONE_GROUP_NOT_FOUND', message: 'Zone group not found or inactive' });
      return;
    }
    if (err.message === 'ZONE_EXISTS') {
      res.status(409).json({ error: 'ZONE_EXISTS', message: 'Zone with this name already exists in the group' });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create zone' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, zoneGroupId, active } = req.body as {
      name?: string;
      zoneGroupId?: number;
      active?: boolean;
    };
    const userId = req.user?.userid;

    const zone = await zonesService.update(parseInt(req.params.id, 10), {
      name,
      zoneGroupId: zoneGroupId ? Number(zoneGroupId) : undefined,
      active,
      userId,
    });
    if (!zone) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Zone not found' });
      return;
    }
    res.json(zone);
  } catch (error) {
    console.error('Update zone error:', error);
    const err = error as Error;
    if (err.message === 'ZONE_GROUP_NOT_FOUND') {
      res.status(404).json({ error: 'ZONE_GROUP_NOT_FOUND', message: 'Zone group not found or inactive' });
      return;
    }
    if (err.message === 'CANNOT_DEACTIVATE_HAS_CLIENTS') {
      res.status(400).json({ error: 'CANNOT_DEACTIVATE', message: 'Cannot deactivate zone with active clients' });
      return;
    }
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update zone' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await zonesService.remove(parseInt(req.params.id, 10));
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Zone not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete zone error:', error);
    const err = error as Error;
    if (err.message === 'CANNOT_DELETE_HAS_CLIENTS') {
      res.status(400).json({ error: 'CANNOT_DELETE', message: 'Cannot delete zone with active clients' });
      return;
    }
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete zone' });
  }
};
