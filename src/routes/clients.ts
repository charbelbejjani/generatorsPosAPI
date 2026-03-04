import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as clientsController from '../controllers/clientsController';

const router = Router();

router.use(authenticate);

router.get('/next-order-number', authorize(8, 'read'), clientsController.getNextOrderNumber);
router.get('/', authorize(8, 'read'), clientsController.getAll);
router.get('/:id', authorize(8, 'read'), clientsController.getById);
router.post('/', authorize(8, 'add'), clientsController.create);
router.put('/:id', authorize(8, 'edit'), clientsController.update);
router.delete('/:id', authorize(8, 'delete'), clientsController.remove);

export default router;
