import type { Request, Response } from 'express';
import '../types';
import * as printReceiptsService from '../services/printReceiptsService';

export const getUnprinted = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneGroupId } = req.query as { zoneGroupId?: string };
    const result = await printReceiptsService.getUnprinted(
      zoneGroupId ? parseInt(zoneGroupId, 10) : undefined
    );
    res.json(result);
  } catch (error) {
    console.error('Get unprinted receipts error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch unprinted receipts' });
  }
};

export const markPrinted = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pdIds } = req.body as { pdIds?: number[] };
    const userId = req.user?.userid;

    if (!pdIds || !Array.isArray(pdIds) || pdIds.length === 0) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'pdIds array is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      return;
    }

    const result = await printReceiptsService.markPrinted(
      pdIds.map(Number),
      userId
    );

    res.json({
      message: 'Receipts marked as printed successfully',
      printed: result.printed,
    });
  } catch (error) {
    console.error('Mark printed error:', error);
    res.status(500).json({ error: 'MARK_PRINTED_FAILED', message: 'Failed to mark receipts as printed' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await printReceiptsService.deleteReceipt(parseInt(req.params.id, 10));
    res.status(204).send();
  } catch (error) {
    const err = error as Error;
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Receipt not found or already inactive' });
      return;
    }
    if (err.message === 'ALREADY_PRINTED') {
      res.status(409).json({ error: 'ALREADY_PRINTED', message: 'Cannot delete a receipt that has already been printed' });
      return;
    }
    console.error('Delete receipt error:', error);
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete receipt' });
  }
};

export const getReceiptData = async (req: Request, res: Response): Promise<void> => {
  try {
    const receipt = await printReceiptsService.getReceiptData(parseInt(req.params.id, 10));
    if (!receipt) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Receipt not found' });
      return;
    }
    res.json(receipt);
  } catch (error) {
    console.error('Get receipt data error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch receipt data' });
  }
};
