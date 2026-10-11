import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  registerPushToken,
  removePushToken,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/push-token', registerPushToken);
router.delete('/push-token', removePushToken);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
