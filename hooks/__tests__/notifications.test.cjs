const test = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../scripts/test-support/load-ts.cjs');

function notifications({ permission = 'granted', blocked = false, failAt = 0, version = 36 } = {}) {
  const calls = [];
  const scheduled = new Map();
  const store = new Map();
  let receipt;
  let scheduleCount = 0;
  let handler;
  const native = {
    AndroidImportance: { NONE: 0, DEFAULT: 3 },
    SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly', DATE: 'date', TIME_INTERVAL: 'timeInterval' },
    getPermissionsAsync: async () => ({ status: permission, granted: permission === 'granted', canAskAgain: false }),
    requestPermissionsAsync: async () => { calls.push('permission prompt'); return { status: permission, granted: permission === 'granted', canAskAgain: false }; },
    setNotificationChannelAsync: async () => {},
    getNotificationChannelAsync: async () => ({ importance: blocked ? 0 : 3 }),
    getAllScheduledNotificationsAsync: async () => Array.from(scheduled, ([identifier]) => ({ identifier })),
    getLastNotificationResponseAsync: async () => null,
    setNotificationHandler: value => { handler = value; },
    scheduleNotificationAsync: async request => {
      calls.push(request); scheduleCount++;
      if (scheduleCount === failAt) throw new Error('Native scheduler failed');
      const id = 'notification-' + scheduleCount;
      if (request.trigger?.type) scheduled.set(id, request); else receipt?.({ request: { identifier: id, content: request.content } });
      return id;
    },
    cancelScheduledNotificationAsync: async id => { calls.push({ canceled: id }); scheduled.delete(id); },
    addNotificationReceivedListener: callback => { receipt = callback; return { remove() { receipt = null; } }; },
    addNotificationResponseReceivedListener: () => ({ remove() {} }),
  };
  const load = loader({
    'expo-notifications': native,
    'react-native': { Platform: { OS: 'android', Version: version }, Linking: { openSettings: async () => { calls.push('settings opened'); } } },
    'react-native-mmkv': { createMMKV: () => ({ getBoolean: key => store.get(key), getString: key => store.get(key), set: (key, value) => store.set(key, value), remove: key => store.delete(key) }) },
    './notification.handlers': { handleNotificationResponse: async () => {} },
  });
  const { notificationService: service } = load('src/services/notifications/notification.service.ts');
  const { notificationStorage: storage } = load('src/services/notifications/notification.storage.ts');
  const types = load('src/services/notifications/notification.types.ts');
  return { service, storage, types, calls, scheduled, handler: () => handler };
}
test('Android test notifications deliver immediately on the correct channel without an alarm trigger', async () => {
  const { service, calls, handler, types } = notifications();
  const detach = service.attachListeners();
  try {
    assert.equal(await service.sendTestDailyFinanceReminderAsync(), 'notification-1');
    const request = calls.find(call => call.content);
    assert.deepEqual(request.trigger, { channelId: types.NotificationChannelId.Reminders });
    assert.equal((await handler().handleNotification()).shouldShowBanner, true);
  } finally { detach(); }
});
test('a blocked Android notification channel produces an actionable failure, never a false sent message', async () => {
  const { service, calls } = notifications({ blocked: true });
  await assert.rejects(service.sendTestDailyFinanceReminderAsync(), /channel is blocked.*Android settings/);
  assert.equal(calls.some(call => call.content), false);
});
test('background reconciliation never opens settings or prompts for permission', async () => {
  const { service, storage, types, calls } = notifications({ permission: 'denied' });
  storage.setDailyFinanceReminder({ config: { ...types.DEFAULT_DAILY_FINANCE_REMINDER, enabled: true }, schedule: null });
  storage.setMonthlyInsightPrompt({ config: { ...types.DEFAULT_MONTHLY_INSIGHT_PROMPT, enabled: true }, schedule: null });
  await service.initializeAsync();
  assert.equal(calls.includes('settings opened'), false);
  assert.equal(calls.includes('permission prompt'), false);
  assert.equal(calls.some(call => call.content), false);
});
test('a failed reminder update removes partial new schedules and preserves the previous working schedule', async () => {
  const { service, storage, types, scheduled, calls } = notifications({ failAt: 2 });
  const config = { ...types.DEFAULT_DAILY_FINANCE_REMINDER, enabled: true };
  storage.setDailyFinanceReminder({ config, schedule: { ids: ['old'], scheduledAt: '' } });
  scheduled.set('old', {});
  await assert.rejects(service.scheduleDailyFinanceReminder({ ...config, reminders: [{ hour: 10, minute: 0 }, { hour: 11, minute: 0 }] }), /Native scheduler failed/);
  assert.deepEqual(Array.from(scheduled.keys()), ['old']);
  assert.deepEqual(storage.getDailyFinanceReminder().schedule.ids, ['old']);
  assert.equal(calls.some(call => call.canceled === 'old'), false);
});
test('quiet hours cannot silently enable reminders with no scheduled notifications', async () => {
  const { service, types, calls } = notifications();
  await assert.rejects(service.scheduleDailyFinanceReminder({ ...types.DEFAULT_DAILY_FINANCE_REMINDER, quietHours: { enabled: true, startHour: 20, startMinute: 0, endHour: 8, endMinute: 0 } }), /All reminder times fall inside Quiet hours/);
  assert.equal(calls.some(call => call.content), false);
});

test('Android versions before notification channels can still deliver a test notification', async () => {
  const { service, calls } = notifications({ version: 25, blocked: true });
  assert.equal(await service.sendTestDailyFinanceReminderAsync(), 'notification-1');
  assert.equal(calls.some(call => call.content), true);
});
