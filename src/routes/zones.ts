import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as zonesController from '../controllers/zonesController';

const router = Router();

router.use(authenticate);

router.get('/', authorize(5, 'read'), zonesController.getAll);
router.get('/:id', authorize(5, 'read'), zonesController.getById);
router.post('/', authorize(5, 'add'), zonesController.create);
router.put('/:id', authorize(5, 'edit'), zonesController.update);
router.delete('/:id', authorize(5, 'delete'), zonesController.remove);

export default router;
