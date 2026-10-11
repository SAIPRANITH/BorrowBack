import Notification from '../models/Notification.js';
import User from '../models/User.js';

const isExpoPushToken = (token) =>
  typeof token === 'string' && /^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(token);

export const registerPushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    if (!isExpoPushToken(pushToken)) {
      res.status(400);
      throw new Error('A valid Expo push token is required');
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { pushTokens: pushToken },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const removePushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    if (!isExpoPushToken(pushToken)) {
      res.status(400);
      throw new Error('A valid Expo push token is required');
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushTokens: pushToken },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('borrow')
      .sort('-createdAt');

    res.json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    notification.status = 'read';
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, status: 'unread' },
      { $set: { status: 'read' } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      status: 'unread',
    });

    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
};
