import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as aadadController from '../controllers/aadadController';

const router = Router();

router.use(authenticate);

router.post('/move-new-to-old', authorize(10, 'edit'), aadadController.moveNewToOld);
router.get('/:zoneId/statistics', authorize(10, 'read'), aadadController.getStatistics);
router.get('/:zoneId', authorize(10, 'read'), aadadController.getByZone);
router.put('/:zoneId', authorize(10, 'edit'), aadadController.bulkUpdateByZone);

export default router;
