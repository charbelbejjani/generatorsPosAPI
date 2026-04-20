import type { Request, Response } from 'express';
import '../types';
import * as monthlyPaymentsService from '../services/monthlyPaymentsService';

export const generate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schId, isAadad } = req.body as { schId?: number; isAadad?: number };
    const userId = req.user?.userid;

    if (!schId) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'schId is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      return;
    }

    // isAadad: 0 = not aadad, 1 = is aadad, undefined/null = all
    const aadadFilter =
      isAadad !== undefined && isAadad !== null && (isAadad === 0 || isAadad === 1)
        ? isAadad
        : undefined;

    const result = await monthlyPaymentsService.generate(Number(schId), userId, aadadFilter);

    res.json({
      message: 'Payments generated successfully',
      inserted: result.inserted,
    });
  } catch (error) {
    console.error('Generate monthly payments error:', error);
    const err = error as Error;
    if (err.message === 'SCHEDULE_NOT_FOUND') {
      res.status(404).json({ error: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found or inactive' });
      return;
    }
    res.status(500).json({ error: 'GENERATE_FAILED', message: 'Failed to generate monthly payments' });
  }
};
