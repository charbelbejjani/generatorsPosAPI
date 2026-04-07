import type { Request, Response } from 'express';
import '../types';
import * as schedulesService from '../services/schedulesService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await schedulesService.getAll();
    res.json(schedules);
  } catch (error) {
    console.error('Get all schedules error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch schedules' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await schedulesService.getById(req.params.id);
    if (!schedule) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Schedule not found' });
      return;
    }
    res.json(schedule);
  } catch (error) {
    console.error('Get schedule by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch schedule' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year, description, cost, kwCost, dollarRate, active } = req.body as {
      month?: number;
      year?: number;
      description?: string;
      cost?: number;
      kwCost?: number;
      dollarRate?: number;
      active?: boolean;
    };
    const userId = req.user?.userid;

    if (month === undefined || month === null || year === undefined || year === null) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'month and year are required' });
      return;
    }

    const schedule = await schedulesService.create({
      month: Number(month),
      year: Number(year),
      description,
      cost: cost !== undefined ? Number(cost) : undefined,
      kwCost: kwCost !== undefined ? Number(kwCost) : undefined,
      dollarRate: dollarRate !== undefined ? Number(dollarRate) : undefined,
      active,
      userId,
    });
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Create schedule error:', error);
    const err = error as Error;
    if (err.message === 'SCHEDULE_EXISTS') {
      res.status(409).json({ error: 'SCHEDULE_EXISTS', message: 'A schedule for this month and year already exists' });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create schedule' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, cost, kwCost, dollarRate, active } = req.body as {
      description?: string;
      cost?: number;
      kwCost?: number;
      dollarRate?: number;
      active?: boolean;
    };
    const userId = req.user?.userid;

    const schedule = await schedulesService.update(req.params.id, {
      description,
      cost: cost !== undefined ? Number(cost) : undefined,
      kwCost: kwCost !== undefined ? Number(kwCost) : undefined,
      dollarRate: dollarRate !== undefined ? Number(dollarRate) : undefined,
      active,
      userId,
    });
    if (!schedule) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Schedule not found' });
      return;
    }
    res.json(schedule);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update schedule' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await schedulesService.remove(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Schedule not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete schedule' });
  }
};
