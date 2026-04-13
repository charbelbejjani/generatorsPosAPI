import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as controller from '../controllers/usersController';

const USERS_PAGE_ID = 1;
const router = Router();

router.get('/', authenticate, authorize(USERS_PAGE_ID, 'read'), controller.getAllUsers);
router.get('/:id', authenticate, authorize(USERS_PAGE_ID, 'read'), controller.getUserById);
router.post('/', authenticate, authorize(USERS_PAGE_ID, 'add'), controller.createUser);
router.put('/:id', authenticate, authorize(USERS_PAGE_ID, 'edit'), controller.updateUser);
router.delete('/:id', authenticate, authorize(USERS_PAGE_ID, 'delete'), controller.deleteUser);

export default router;
