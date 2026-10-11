import User from '../models/User.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const sendPushNotification = async (notification) => {
  const user = await User.findById(notification.user).select('+pushTokens');
  const tokens = user?.pushTokens || [];
  if (tokens.length === 0) return;

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tokens.map((to) => ({
      to,
      title: 'BorrowBack',
      body: notification.message,
      sound: 'default',
      priority: 'high',
      channelId: 'default',
      data: {
        notificationId: notification._id.toString(),
        type: notification.type,
      },
    }))),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Expo push service returned HTTP ${response.status}`);
  }

  const result = await response.json();
  const tickets = Array.isArray(result.data) ? result.data : [result.data];
  const staleTokens = tickets.flatMap((ticket, index) =>
    ticket?.details?.error === 'DeviceNotRegistered' ? [tokens[index]] : []
  );

  if (staleTokens.length > 0) {
    await User.updateOne(
      { _id: user._id },
      { $pull: { pushTokens: { $in: staleTokens } } }
    );
  }

  const failures = tickets.filter((ticket) => ticket?.status === 'error'
    && ticket?.details?.error !== 'DeviceNotRegistered');
  if (failures.length > 0) {
    throw new Error(`Expo push delivery failed: ${failures.map((ticket) => ticket.message).join('; ')}`);
  }
};
