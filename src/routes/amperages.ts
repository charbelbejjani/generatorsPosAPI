import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as controller from '../controllers/amperagesController';

const AMPERAGE_PAGE_ID = 7;
const router = Router();

router.get('/', authenticate, authorize(AMPERAGE_PAGE_ID, 'read'), controller.getAll);
router.get('/:id', authenticate, authorize(AMPERAGE_PAGE_ID, 'read'), controller.getById);
router.post('/', authenticate, authorize(AMPERAGE_PAGE_ID, 'add'), controller.create);
router.put('/:id', authenticate, authorize(AMPERAGE_PAGE_ID, 'edit'), controller.update);
router.delete('/:id', authenticate, authorize(AMPERAGE_PAGE_ID, 'delete'), controller.remove);

export default router;
