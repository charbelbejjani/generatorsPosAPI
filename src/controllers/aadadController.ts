import type { Request, Response } from 'express';
import '../types';
import * as aadadService from '../services/aadadService';

export const getByZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = parseInt(req.params.zoneId, 10);
    const readings = await aadadService.getByZone(zoneId);
    res.json(readings);
  } catch (error) {
    console.error('Get readings by zone error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch readings' });
  }
};

export const bulkUpdateByZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = parseInt(req.params.zoneId, 10);
    const { readings } = req.body as { readings?: { clientId: number; newReading: number }[] };
    const userId = req.user!.userid;

    if (!readings || !Array.isArray(readings)) {
      res.status(400).json({ error: 'INVALID_DATA', message: 'readings array is required' });
      return;
    }

    await aadadService.bulkUpdateByZone(zoneId, readings, userId);
    res.json({ success: true, message: 'Readings updated successfully' });
  } catch (error) {
    console.error('Bulk update readings error:', error);
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update readings' });
  }
};

export const moveNewToOld = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userid;
    const result = await aadadService.moveNewToOld(userId);
    res.json(result);
  } catch (error) {
    console.error('Move new to old error:', error);
    res.status(500).json({ error: 'OPERATION_FAILED', message: 'Failed to move readings' });
  }
};

export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = parseInt(req.params.zoneId, 10);
    const stats = await aadadService.getZoneStatistics(zoneId);
    res.json(stats);
  } catch (error) {
    console.error('Get zone statistics error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch statistics' });
  }
};
