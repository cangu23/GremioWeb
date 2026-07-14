import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as ChannelsController from './channels.controller';

const router = Router({ mergeParams: true });

// All channel routes require auth
router.use(authenticate);

// Channels CRUD
router.get('/', ChannelsController.getChannels);
router.post('/', ChannelsController.createChannel);
router.put('/:channelId', ChannelsController.updateChannel);
router.delete('/:channelId', ChannelsController.deleteChannel);

// Messages within a channel
router.get('/:channelId/messages', ChannelsController.getMessages);
router.post('/:channelId/messages', ChannelsController.sendMessage);
router.patch('/:channelId/messages/:messageId', ChannelsController.updateMessage);
router.delete('/:channelId/messages/:messageId', ChannelsController.deleteMessage);

export default router;
