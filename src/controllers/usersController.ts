import type { Request, Response } from 'express';
import '../types';
import * as userService from '../services/usersService';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, username, password, email, group_id } = req.body as {
      first_name?: string;
      last_name?: string;
      username?: string;
      password?: string;
      email?: string;
      group_id?: number;
    };
    if (!first_name || !username || !password) {
      res.status(400).json({ error: 'Missing required fields: first_name, username, password' });
      return;
    }
    const id = await userService.create({ first_name, last_name, username, password, email, group_id });
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, username, password, email, group_id, active } = req.body as {
      first_name?: string;
      last_name?: string;
      username?: string;
      password?: string;
      email?: string;
      group_id?: number;
      active?: boolean;
    };
    const user = await userService.update(parseInt(req.params.id, 10), {
      first_name, last_name, username, password, email,
      group_id: group_id !== undefined ? Number(group_id) : undefined,
      active,
    });
    if (!user) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await userService.remove(parseInt(req.params.id, 10));
    if (!success) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
