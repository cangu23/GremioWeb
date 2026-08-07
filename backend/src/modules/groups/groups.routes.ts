import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as GroupsController from './groups.controller';

const router = Router();

router.get('/', authenticate, GroupsController.listMyGroups);
router.post('/', authenticate, GroupsController.createGroup);
router.get('/:groupId/messages', authenticate, GroupsController.getGroupMessages);
router.post('/:groupId/messages', authenticate, GroupsController.sendGroupMessage);
router.post('/:groupId/members', authenticate, GroupsController.addGroupMember);
router.delete('/:groupId/members/:userId', authenticate, GroupsController.removeGroupMember);
router.delete('/:groupId/leave', authenticate, GroupsController.leaveGroup);

export default router;
