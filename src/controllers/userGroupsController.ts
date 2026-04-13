import type { Request, Response } from 'express';
import '../types';
import * as userGroupsService from '../services/userGroupsService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await userGroupsService.getAll();
    res.json(groups);
  } catch (error) {
    console.error('Get all user groups error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch user groups' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await userGroupsService.getById(req.params.id);
    if (!group) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User group not found' });
      return;
    }
    res.json(group);
  } catch (error) {
    console.error('Get user group by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch user group' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, active } = req.body as { name?: string; active?: boolean };

    if (!name) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'Group name is required' });
      return;
    }

    const group = await userGroupsService.create({ name, active });
    res.status(201).json(group);
  } catch (error) {
    console.error('Create user group error:', error);
    const err = error as Error;
    if (err.message === 'USER_GROUP_EXISTS') {
      res.status(409).json({ error: 'USER_GROUP_EXISTS', message: 'User group with this name already exists' });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create user group' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, active } = req.body as { name?: string; active?: boolean };

    const group = await userGroupsService.update(req.params.id, { name, active });
    if (!group) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User group not found' });
      return;
    }
    res.json(group);
  } catch (error) {
    console.error('Update user group error:', error);
    const err = error as Error;
    if (err.message === 'CANNOT_DEACTIVATE_HAS_USERS') {
      res.status(400).json({ error: 'CANNOT_DEACTIVATE', message: 'Cannot deactivate group: users are assigned to this group' });
      return;
    }
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update user group' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await userGroupsService.remove(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User group not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete user group error:', error);
    const err = error as Error;
    if (err.message === 'CANNOT_DELETE_HAS_USERS') {
      res.status(400).json({ error: 'CANNOT_DELETE', message: 'Cannot delete group: users are assigned to this group' });
      return;
    }
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete user group' });
  }
};
