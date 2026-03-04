import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import * as lookupsController from '../controllers/lookupsController';

const router = Router();

router.use(authenticate);

router.get('/zones', lookupsController.getZones);
router.get('/zone-groups', lookupsController.getZoneGroups);
router.get('/amperages', lookupsController.getAmperages);
router.get('/exceptions', lookupsController.getExceptions);

export default router;
