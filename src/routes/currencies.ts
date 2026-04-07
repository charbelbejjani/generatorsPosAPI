import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as controller from '../controllers/currenciesController';

const CURRENCIES_PAGE_ID = 12;
const router = Router();

router.get('/', authenticate, authorize(CURRENCIES_PAGE_ID, 'read'), controller.getAll);
router.get('/:id', authenticate, authorize(CURRENCIES_PAGE_ID, 'read'), controller.getById);
router.post('/', authenticate, authorize(CURRENCIES_PAGE_ID, 'add'), controller.create);
router.put('/:id', authenticate, authorize(CURRENCIES_PAGE_ID, 'edit'), controller.update);
router.delete('/:id', authenticate, authorize(CURRENCIES_PAGE_ID, 'delete'), controller.remove);

export default router;
