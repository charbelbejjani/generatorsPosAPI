import type { Request, Response } from 'express';
import '../types';
import * as phoneCodesService from '../services/phoneCodesService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const phoneCodes = await phoneCodesService.getAll();
    res.json(phoneCodes);
  } catch (error) {
    console.error('Get all phone codes error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch phone codes' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const phoneCode = await phoneCodesService.getById(req.params.id);
    if (!phoneCode) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phone code not found' });
      return;
    }
    res.json(phoneCode);
  } catch (error) {
    console.error('Get phone code by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch phone code' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { number, type } = req.body as {
      number?: string;
      type?: number;
    };
    const userId = req.user?.userid;

    if (!number || type === undefined || type === null) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'number and type are required' });
      return;
    }

    const phoneCode = await phoneCodesService.create({ number, type: Number(type), userId });
    res.status(201).json(phoneCode);
  } catch (error) {
    console.error('Create phone code error:', error);
    const err = error as Error;
    if (err.message === 'PHONE_CODE_EXISTS') {
      res.status(409).json({ error: 'PHONE_CODE_EXISTS', message: 'Phone code with this number and type already exists' });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create phone code' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { number, type, active } = req.body as {
      number?: string;
      type?: number;
      active?: number;
    };
    const userId = req.user?.userid;

    const phoneCode = await phoneCodesService.update(req.params.id, {
      number,
      type: type !== undefined ? Number(type) : undefined,
      active: active !== undefined ? Number(active) : undefined,
      userId,
    });
    if (!phoneCode) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phone code not found' });
      return;
    }
    res.json(phoneCode);
  } catch (error) {
    console.error('Update phone code error:', error);
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update phone code' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await phoneCodesService.remove(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phone code not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete phone code error:', error);
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete phone code' });
  }
};
