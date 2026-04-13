import type { Request, Response } from 'express';
import '../types';
import * as pagesService from '../services/pagesService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const pages = await pagesService.getAll();
    res.json(pages);
  } catch (error) {
    console.error('Get all pages error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch pages' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = await pagesService.getById(req.params.id);
    if (!page) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Page not found' });
      return;
    }
    res.json(page);
  } catch (error) {
    console.error('Get page by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch page' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, url, sectionId } = req.body as {
      name?: string;
      url?: string;
      sectionId?: number;
    };

    if (!name || !url || sectionId === undefined || sectionId === null) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'name, url and sectionId are required' });
      return;
    }

    const page = await pagesService.create({ name, url, sectionId: Number(sectionId) });
    res.status(201).json(page);
  } catch (error) {
    console.error('Create page error:', error);
    const err = error as Error;
    if (err.message === 'PAGE_EXISTS') {
      res.status(409).json({ error: 'PAGE_EXISTS', message: 'Page with this name already exists' });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create page' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, url, sectionId, active } = req.body as {
      name?: string;
      url?: string;
      sectionId?: number;
      active?: boolean;
    };

    const page = await pagesService.update(req.params.id, {
      name,
      url,
      sectionId: sectionId !== undefined ? Number(sectionId) : undefined,
      active,
    });
    if (!page) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Page not found' });
      return;
    }
    res.json(page);
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update page' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await pagesService.remove(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Page not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete page error:', error);
    const err = error as Error;
    if (err.message === 'CANNOT_DELETE_HAS_RIGHTS') {
      res.status(400).json({ error: 'CANNOT_DELETE', message: 'Cannot delete page: user rights are assigned to this page' });
      return;
    }
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete page' });
  }
};
