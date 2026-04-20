import { Router } from 'express';

import authRouter from './auth';
import usersRouter from './users';
import zoneGroupsRouter from './zoneGroups';
import exceptionsRouter from './exceptions';
import amperagesRouter from './amperages';
import zonesRouter from './zones';
import lookupsRouter from './lookups';
import clientsRouter from './clients';
import aadadRouter from './aadad';
import currenciesRouter from './currencies';
import schedulesRouter from './schedules';
import phoneCodesRouter from './phoneCodes';
import userGroupsRouter from './userGroups';
import pagesRouter from './pages';
import monthlyPaymentsRouter from './monthlyPayments';
import printReceiptsRouter from './printReceipts';
import allReceiptsRouter from './allReceipts';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/zone-groups', zoneGroupsRouter);
router.use('/exceptions', exceptionsRouter);
router.use('/amperages', amperagesRouter);
router.use('/zones', zonesRouter);
router.use('/lookups', lookupsRouter);
router.use('/clients', clientsRouter);
router.use('/aadad', aadadRouter);
router.use('/currencies', currenciesRouter);
router.use('/schedules', schedulesRouter);
router.use('/phone-codes', phoneCodesRouter);
router.use('/user-groups', userGroupsRouter);
router.use('/pages', pagesRouter);
router.use('/monthly-payments', monthlyPaymentsRouter);
router.use('/print-receipts', printReceiptsRouter);
router.use('/all-receipts', allReceiptsRouter);

export default router;
