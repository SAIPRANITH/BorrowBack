import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeUser } from '../controllers/auth.controller.js';

test('auth responses expose a complete, consistent profile shape', () => {
  const user = {
    _id: 'user-id',
    name: 'BorrowBack User',
    email: 'user@example.com',
    phone: '1234567890',
    profilePhoto: 'https://example.com/profile.jpg',
    role: 'user',
    averageRating: 4.5,
    totalRatings: 6,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  assert.deepEqual(serializeUser(user), {
    success: true,
    _id: 'user-id',
    name: 'BorrowBack User',
    email: 'user@example.com',
    phone: '1234567890',
    profilePhoto: 'https://example.com/profile.jpg',
    role: 'user',
    averageRating: 4.5,
    totalRatings: 6,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  });
});
