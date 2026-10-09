import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  borrow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrow',
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'request',
      'approval',
      'rejection',
      'reminder',
      'overdue',
      'fine',
      'return',
      'rating',
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ['read', 'unread'],
    default: 'unread',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
