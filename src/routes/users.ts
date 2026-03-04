import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as controller from '../controllers/usersController';

const USERS_PAGE_ID = 1;
const router = Router();

router.get('/', authenticate, authorize(USERS_PAGE_ID, 'read'), controller.getAllUsers);
router.get('/:id', authenticate, authorize(USERS_PAGE_ID, 'read'), controller.getUserById);
router.post('/', authenticate, authorize(USERS_PAGE_ID, 'add'), controller.createUser);

export default router;
