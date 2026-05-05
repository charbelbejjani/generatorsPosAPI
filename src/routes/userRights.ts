import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as controller from '../controllers/userRightsController';

const USER_RIGHTS_PAGE_ID = 4;
const router = Router();

// Get all pages (grouped by section) with current rights for a group
router.get('/:groupId', authenticate, authorize(USER_RIGHTS_PAGE_ID, 'read'), controller.getRightsByGroup);

// Save (overwrite) all rights for a group
router.put('/:groupId', authenticate, authorize(USER_RIGHTS_PAGE_ID, 'edit'), controller.saveRights);

// Get controls for a specific page+group
router.get('/:groupId/controls/:pageId', authenticate, authorize(USER_RIGHTS_PAGE_ID, 'read'), controller.getControlsByPageAndGroup);

// Save controls for a specific page+group
router.put('/:groupId/controls/:pageId', authenticate, authorize(USER_RIGHTS_PAGE_ID, 'edit'), controller.saveControls);

export default router;
