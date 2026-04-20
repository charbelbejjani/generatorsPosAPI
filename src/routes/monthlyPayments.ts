import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as controller from '../controllers/monthlyPaymentsController';

const MONTHLY_PAYMENTS_PAGE_ID = 14;
const router = Router();

router.post('/generate', authenticate, authorize(MONTHLY_PAYMENTS_PAGE_ID, 'add'), controller.generate);

export default router;
