import type { Request, Response } from 'express';
import '../types';
import * as allReceiptsService from '../services/allReceiptsService';

export const getBySchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schId, zoneGroupId } = req.query as Record<string, string | undefined>;

    if (!schId) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'schId is required' });
      return;
    }

    const result = await allReceiptsService.getBySchedule(
      parseInt(schId, 10),
      zoneGroupId ? parseInt(zoneGroupId, 10) : undefined
    );

    res.json(result);
  } catch (error) {
    console.error('Get receipts by schedule error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch receipts' });
  }
};

export const bulkAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pdIds, action } = req.body as { pdIds?: number[]; action?: number };

    if (!pdIds || !Array.isArray(pdIds) || pdIds.length === 0) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'pdIds array is required' });
      return;
    }

    if (action !== 1 && action !== 2 && action !== 3) {
      res.status(400).json({
        error: 'INVALID_ACTION',
        message: 'action must be 1 (undo payment), 2 (undo print), or 3 (delete)',
      });
      return;
    }

    const result = await allReceiptsService.bulkAction(
      pdIds.map(Number),
      action as allReceiptsService.BulkAction
    );

    res.json({
      message: 'Action applied successfully',
      affected: result.affected,
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ error: 'ACTION_FAILED', message: 'Failed to apply bulk action' });
  }
};
