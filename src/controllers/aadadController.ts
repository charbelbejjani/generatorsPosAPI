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

export const getByZoneQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = parseInt(req.query.zoneId as string, 10);
    if (isNaN(zoneId)) {
      res.status(400).json({ error: 'INVALID_PARAM', message: 'zoneId query parameter is required and must be a number' });
      return;
    }
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

export const getZoneData = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId     = parseInt(req.query.zoneId as string, 10);
    const updateData = parseInt((req.query.updateData as string) ?? '1', 10);
    if (isNaN(zoneId)) {
      res.status(400).json({ error: 'INVALID_ZONE', message: 'zoneId is required' });
      return;
    }
    const result = await aadadService.getZoneData(zoneId, updateData);
    res.json(result);
  } catch (error) {
    console.error('Get zone data error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch zone data' });
  }
};

export const saveZoneData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clients } = req.body as { clients?: aadadService.SaveClient[] };
    if (!clients || !Array.isArray(clients)) {
      res.status(400).json({ error: 'INVALID_DATA', message: 'clients array is required' });
      return;
    }
    const result = await aadadService.saveZoneData(clients);
    res.json({ message: `${result.updatedCount} row(s) updated`, updatedCount: result.updatedCount });
  } catch (error) {
    console.error('Save zone data error:', error);
    res.status(500).json({ error: 'SAVE_FAILED', message: 'Failed to save zone data' });
  }
};
