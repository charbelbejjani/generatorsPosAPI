import type { Request, Response } from 'express';
import '../types';
import * as lookupsService from '../services/lookupsService';

export const getZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const zones = await lookupsService.getActiveZones();
    res.json(zones);
  } catch (error) {
    console.error('Get zones lookup error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch zones' });
  }
};

export const getZoneGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneGroups = await lookupsService.getActiveZoneGroups();
    res.json(zoneGroups);
  } catch (error) {
    console.error('Get zone groups lookup error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch zone groups' });
  }
};

export const getAmperages = async (req: Request, res: Response): Promise<void> => {
  try {
    const amperages = await lookupsService.getActiveAmperages();
    res.json(amperages);
  } catch (error) {
    console.error('Get amperages lookup error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch amperages' });
  }
};

export const getExceptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const exceptions = await lookupsService.getActiveExceptions();
    res.json(exceptions);
  } catch (error) {
    console.error('Get exceptions lookup error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch exceptions' });
  }
};

export const getUserGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await lookupsService.getActiveUserGroups();
    res.json(groups);
  } catch (error) {
    console.error('Get user groups lookup error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch user groups' });
  }
};

export const getSections = async (req: Request, res: Response): Promise<void> => {
  try {
    const sections = await lookupsService.getAllSections();
    res.json(sections);
  } catch (error) {
    console.error('Get sections lookup error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch sections' });
  }
};

export const getSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await lookupsService.getSchedules();
    res.json(schedules);
  } catch (error) {
    console.error('Get schedules lookup error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch schedules' });
  }
};
