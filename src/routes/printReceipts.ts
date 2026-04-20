import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as printReceiptsController from '../controllers/printReceiptsController';

const PRINT_RECEIPTS_PAGE_ID = 16;
const router = Router();

router.use(authenticate);

router.get('/', authorize(PRINT_RECEIPTS_PAGE_ID, 'read'), printReceiptsController.getUnprinted);
router.get('/receipt/:id', authorize(PRINT_RECEIPTS_PAGE_ID, 'read'), printReceiptsController.getReceiptData);
router.post('/mark-printed', authorize(PRINT_RECEIPTS_PAGE_ID, 'add'), printReceiptsController.markPrinted);
router.delete('/:id', authorize(PRINT_RECEIPTS_PAGE_ID, 'delete'), printReceiptsController.remove);

export default router;
