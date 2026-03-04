import type { Request, Response } from 'express';
import '../types';
import * as amperagesService from '../services/amperagesService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const amperages = await amperagesService.getAll();
    res.json(amperages);
  } catch (error) {
    console.error('Get all amperages error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch amperages' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const amperage = await amperagesService.getById(req.params.id);
    if (!amperage) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Amperage not found' });
      return;
    }
    res.json(amperage);
  } catch (error) {
    console.error('Get amperage by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch amperage' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { value, description, fixedAmount, active } = req.body as {
      value?: number;
      description?: string;
      fixedAmount?: number;
      active?: boolean;
    };
    const userId = req.user?.userid;

    if (value === undefined || value === null) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'Amperage value is required' });
      return;
    }

    const amperage = await amperagesService.create({ value, description, fixedAmount, active, userId });
    res.status(201).json(amperage);
  } catch (error) {
    console.error('Create amperage error:', error);
    const err = error as Error;
    if (err.message === 'AMPERAGE_EXISTS') {
      res.status(409).json({ error: 'AMPERAGE_EXISTS', message: 'Amperage with this value already exists' });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create amperage' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, fixedAmount, active } = req.body as {
      description?: string;
      fixedAmount?: number;
      active?: boolean;
    };
    const userId = req.user?.userid;

    const amperage = await amperagesService.update(req.params.id, { description, fixedAmount, active, userId });
    if (!amperage) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Amperage not found' });
      return;
    }
    res.json(amperage);
  } catch (error) {
    console.error('Update amperage error:', error);
    const err = error as Error;
    if (err.message === 'CANNOT_DEACTIVATE_HAS_CLIENTS') {
      res.status(400).json({ error: 'CANNOT_DEACTIVATE', message: 'Cannot deactivate amperage assigned to active clients' });
      return;
    }
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update amperage' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await amperagesService.remove(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Amperage not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete amperage error:', error);
    const err = error as Error;
    if (err.message === 'CANNOT_DELETE_HAS_CLIENTS') {
      res.status(400).json({ error: 'CANNOT_DELETE', message: 'Cannot delete amperage assigned to clients' });
      return;
    }
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete amperage' });
  }
};
