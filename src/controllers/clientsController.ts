import type { Request, Response } from 'express';
import '../types';
import * as clientsService from '../services/clientsService';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId, search, activeOnly } = req.query as Record<string, string | undefined>;
    const result = await clientsService.getAll({
      zoneId: zoneId ? parseInt(zoneId, 10) : undefined,
      search,
      activeOnly: activeOnly === 'true',
    });
    res.json(result);
  } catch (error) {
    console.error('Get all clients error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch clients' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await clientsService.getById(req.params.id);
    if (!client) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Client not found' });
      return;
    }
    res.json(client);
  } catch (error) {
    console.error('Get client by ID error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch client' });
  }
};

export const getNextOrderNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.query as { zoneId?: string };
    if (!zoneId) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'zoneId is required' });
      return;
    }
    const nextOrderNumber = await clientsService.getNextOrderNumber(parseInt(zoneId, 10));
    res.json({ nextOrderNumber });
  } catch (error) {
    console.error('Get next order number error:', error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to get next order number' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      orderNumber, firstName, middleName, lastName,
      zoneId, amperageId, paymentAmperageId, exceptionId,
      mobile, address, active,
    } = req.body as Record<string, unknown>;
    const userId = req.user?.userid;

    if (!zoneId) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'zoneId is required' });
      return;
    }

    const client = await clientsService.create({
      orderNumber: orderNumber as number | undefined,
      firstName: firstName as string | undefined,
      middleName: middleName as string | undefined,
      lastName: lastName as string | undefined,
      zoneId: Number(zoneId),
      amperageId: amperageId ? Number(amperageId) : undefined,
      paymentAmperageId: paymentAmperageId ? Number(paymentAmperageId) : undefined,
      exceptionId: exceptionId ? Number(exceptionId) : undefined,
      mobile: mobile as string | undefined,
      address: address as string | undefined,
      active: active !== undefined ? Boolean(active) : true,
      userId,
    });
    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    const err = error as Error;
    const errorMap: Record<string, [number, string, string]> = {
      ZONE_NOT_FOUND: [404, 'ZONE_NOT_FOUND', 'Zone not found or inactive'],
      AMPERAGE_NOT_FOUND: [404, 'AMPERAGE_NOT_FOUND', 'Amperage not found or inactive'],
      PAYMENT_AMPERAGE_NOT_FOUND: [404, 'PAYMENT_AMPERAGE_NOT_FOUND', 'Payment amperage not found or inactive'],
      EXCEPTION_NOT_FOUND: [404, 'EXCEPTION_NOT_FOUND', 'Exception not found'],
    };
    const mapped = errorMap[err.message];
    if (mapped) {
      res.status(mapped[0]).json({ error: mapped[1], message: mapped[2] });
      return;
    }
    res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to create client' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      orderNumber,title, firstName, middleName, lastName,gender,
      zoneId, amperageId, paymentAmperageId, exceptionId,exceptionAmount,
      mobile,active,isAaddad
    } = req.body as Record<string, unknown>;
    const userId = req.user?.userid;

    const client = await clientsService.update(req.params.id, {
      orderNumber: orderNumber as number | undefined,
      title: title as string | undefined,
      firstName: firstName as string | undefined,
      middleName: middleName as string | undefined,
      lastName: lastName as string | undefined,
      gender: gender as string | undefined,
      zoneId: zoneId ? Number(zoneId) : undefined,
      amperageId: amperageId ? Number(amperageId) : undefined,
      paymentAmperageId: paymentAmperageId ? Number(paymentAmperageId) : undefined,
      exceptionId: exceptionId ? Number(exceptionId) : undefined,
      exceptionAmount: exceptionId ? Number(req.body.exceptionAmount) : undefined,
      mobile: mobile as string | undefined,
      active: active !== undefined ? Boolean(active) : undefined,
      isAaddad: isAaddad !== undefined ? Boolean(isAaddad) : undefined,
      userId,
    });

    if (!client) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Client not found' });
      return;
    }
    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    const err = error as Error;
    const errorMap: Record<string, [number, string, string]> = {
      ZONE_NOT_FOUND: [404, 'ZONE_NOT_FOUND', 'Zone not found or inactive'],
      AMPERAGE_NOT_FOUND: [404, 'AMPERAGE_NOT_FOUND', 'Amperage not found or inactive'],
      PAYMENT_AMPERAGE_NOT_FOUND: [404, 'PAYMENT_AMPERAGE_NOT_FOUND', 'Payment amperage not found or inactive'],
      EXCEPTION_NOT_FOUND: [404, 'EXCEPTION_NOT_FOUND', 'Exception not found'],
    };
    const mapped = errorMap[err.message];
    if (mapped) {
      res.status(mapped[0]).json({ error: mapped[1], message: mapped[2] });
      return;
    }
    res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update client' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await clientsService.remove(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Client not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete client' });
  }
};
