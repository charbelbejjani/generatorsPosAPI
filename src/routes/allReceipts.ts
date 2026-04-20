import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as allReceiptsController from '../controllers/allReceiptsController';

const ALL_RECEIPTS_PAGE_ID = 16;
const router = Router();

router.use(authenticate);

router.get('/', authorize(ALL_RECEIPTS_PAGE_ID, 'read'), allReceiptsController.getBySchedule);
router.post('/bulk-action', authorize(ALL_RECEIPTS_PAGE_ID, 'edit'), allReceiptsController.bulkAction);

export default router;
