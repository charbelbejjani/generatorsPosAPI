import type { Request, Response } from 'express';
import '../types';
import * as reportsService from '../services/reportsService';

export const monthlyScheduleReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schId, zoneGroupId, hasException, beforeDate, beforeSchId } = req.query as Record<string, string | undefined>;

    if (!schId) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'schId is required' });
      return;
    }

    const parsedZoneGroupId = zoneGroupId !== undefined ? parseInt(zoneGroupId, 10) : undefined;
    const parsedHasException = hasException !== undefined ? parseInt(hasException, 10) : undefined;
    const parsedBeforeSchId = beforeSchId !== undefined ? parseInt(beforeSchId, 10) : undefined;

    if (parsedHasException !== undefined && parsedHasException !== 0 && parsedHasException !== 1) {
      res.status(400).json({ error: 'INVALID_FIELDS', message: 'hasException must be 0 or 1' });
      return;
    }

    const result = await reportsService.monthlyScheduleReport(
      parseInt(schId, 10),
      parsedZoneGroupId,
      parsedHasException,
      beforeDate,
      parsedBeforeSchId,
    );

    res.json(result);
  } catch (error) {
    console.error('Monthly schedule report error:', error);
    res.status(500).json({ error: 'REPORT_FAILED', message: 'Failed to generate monthly schedule report' });
  }
};

export const collectionReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schId, type, schIdMin, hasException, beforeDate } = req.query as Record<string, string | undefined>;

    if (!schId || !type) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'schId and type are required' });
      return;
    }

    const parsedType = parseInt(type, 10);
    if (parsedType !== 1 && parsedType !== 2) {
      res.status(400).json({ error: 'INVALID_FIELDS', message: 'type must be 1 (Loans) or 2 (Doubtful)' });
      return;
    }

    const parsedSchIdMin = schIdMin !== undefined ? parseInt(schIdMin, 10) : undefined;
    const parsedHasException = hasException !== undefined ? parseInt(hasException, 10) : undefined;

    if (parsedHasException !== undefined && parsedHasException !== 0 && parsedHasException !== 1) {
      res.status(400).json({ error: 'INVALID_FIELDS', message: 'hasException must be 0 or 1' });
      return;
    }

    const result = await reportsService.collectionReport(
      parseInt(schId, 10),
      parsedType,
      parsedSchIdMin,
      parsedHasException,
      beforeDate,
    );

    res.json(result);
  } catch (error) {
    console.error('Collection report error:', error);
    res.status(500).json({ error: 'REPORT_FAILED', message: 'Failed to generate collection report' });
  }
};

export const aadadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await reportsService.aadadReport();
    res.json({ rows });
  } catch (error) {
    console.error('Aadad report error:', error);
    res.status(500).json({ error: 'REPORT_FAILED', message: 'Failed to generate aadad report' });
  }
};
