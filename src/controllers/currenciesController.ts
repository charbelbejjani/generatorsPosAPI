import type { Request, Response } from 'express';
import '../types';
import * as currenciesService from '../services/currenciesService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const currencies = await currenciesService.getAll();
    res.json(currencies);
  } catch (error) {
    console.error('Get all currencies error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch currencies' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const currency = await currenciesService.getById(req.params.id);
    if (!currency) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Currency not found' });
      return;
    }
    res.json(currency);
  } catch (error) {
    console.error('Get currency by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch currency' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, symbol, active } = req.body as {
      description?: string;
      symbol?: string;
      active?: boolean;
    };
    const userId = req.user?.userid;

    if (!description || !symbol) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'description and symbol are required' });
      return;
    }

    const currency = await currenciesService.create({ description, symbol, active, userId });
    res.status(201).json(currency);
  } catch (error) {
    console.error('Create currency error:', error);
    const err = error as Error;
    if (err.message === 'CURRENCY_EXISTS') {
      res.status(409).json({ error: 'CURRENCY_EXISTS', message: 'Currency with this description already exists' });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create currency' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol, active } = req.body as {
      symbol?: string;
      active?: boolean;
    };
    const userId = req.user?.userid;

    const currency = await currenciesService.update(req.params.id, { symbol, active, userId });
    if (!currency) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Currency not found' });
      return;
    }
    res.json(currency);
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update currency' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await currenciesService.remove(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Currency not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete currency error:', error);
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete currency' });
  }
};
