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

export default router;
