import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as controller from '../controllers/reportsController';

const MONTHLY_SCHEDULE_REPORT_PAGE_ID = 18;
const COLLECTION_REPORT_PAGE_ID = 23;
const AADAD_REPORT_PAGE_ID = 27;

const router = Router();

router.get('/monthly-schedule', authenticate, authorize(MONTHLY_SCHEDULE_REPORT_PAGE_ID, 'read'), controller.monthlyScheduleReport);
router.get('/collection', authenticate, authorize(COLLECTION_REPORT_PAGE_ID, 'read'), controller.collectionReport);
router.get('/aadad', authenticate, authorize(AADAD_REPORT_PAGE_ID, 'read'), controller.aadadReport);

export default router;
