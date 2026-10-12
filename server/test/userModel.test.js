import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import test from 'node:test';
import User from '../models/User.js';

const passwordHashHook = User.schema.s.hooks._pres
  .get('save')
  .find(({ fn }) => fn.name === 'hashPasswordBeforeSave')?.fn;

test('saving a user without changing the password preserves the existing hash', async () => {
  assert.ok(passwordHashHook, 'User password save hook is registered');

  const password = 'correct horse battery staple';
  const hash = await bcrypt.hash(password, 4);
  const user = {
    password: hash,
    isModified: (field) => field !== 'password',
  };

  await passwordHashHook.call(user);

  assert.equal(user.password, hash);
  assert.equal(await bcrypt.compare(password, user.password), true);
});

test('saving a changed password stores a verifiable hash', async () => {
  assert.ok(passwordHashHook, 'User password save hook is registered');

  const password = 'new secure password';
  const user = {
    password,
    isModified: (field) => field === 'password',
  };

  await passwordHashHook.call(user);

  assert.notEqual(user.password, password);
  assert.equal(await bcrypt.compare(password, user.password), true);
});
