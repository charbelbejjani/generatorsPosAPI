import type { Request, Response } from 'express';
import '../types';
import * as exceptionsService from '../services/exceptionsService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const exceptions = await exceptionsService.getAll();
    res.json(exceptions);
  } catch (error) {
    console.error('Get all exceptions error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch exceptions' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const exception = await exceptionsService.getById(req.params.id);
    if (!exception) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Exception not found' });
      return;
    }
    res.json(exception);
  } catch (error) {
    console.error('Get exception by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch exception' });
  }
};
