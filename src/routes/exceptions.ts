import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as controller from '../controllers/exceptionsController';

const DATA_ENTRY_PAGE_ID = 9;
const router = Router();

router.get('/', authenticate, authorize(DATA_ENTRY_PAGE_ID, 'read'), controller.getAll);
router.get('/:id', authenticate, authorize(DATA_ENTRY_PAGE_ID, 'read'), controller.getById);

export default router;
