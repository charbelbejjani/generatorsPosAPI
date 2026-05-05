import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as aadadController from '../controllers/aadadController';

const router = Router();

router.use(authenticate);

// ── must be before /:zoneId to avoid route collision ──────────────────────────
router.get('/zone-data',        authorize(10, 'read'), aadadController.getZoneData);
router.post('/save',            authorize(10, 'edit'), aadadController.saveZoneData);

// ── existing routes ───────────────────────────────────────────────────────────
router.post('/move-new-to-old', authorize(10, 'edit'), aadadController.moveNewToOld);
router.get('/:zoneId/statistics', authorize(10, 'read'), aadadController.getStatistics);
router.get('/:zoneId',          authorize(10, 'read'), aadadController.getByZone);
router.put('/:zoneId',          authorize(10, 'edit'), aadadController.bulkUpdateByZone);

export default router;
