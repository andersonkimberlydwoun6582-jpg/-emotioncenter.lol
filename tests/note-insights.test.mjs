import assert from 'node:assert/strict';
import test from 'node:test';
import { getCalendarDays, getStreak, localDateKey, streakMessage } from '../lib/note-insights.ts';

function note(date, emotions = []) {
  return { id: crypto.randomUUID(), channel: 'vent', category: 'test', title: 'Test note', content: 'A private note', createdAt: date.toISOString(), emotions, isMine: true };
}

void test('localDateKey uses the local calendar date', () => {
  assert.equal(localDateKey(new Date(2026, 8, 2, 0, 30)), '2026-09-02');
});

void test('getStreak counts consecutive local days from today only', () => {
  const today = new Date(2026, 8, 2, 12);
  const notes = [note(new Date(2026, 8, 2, 9)), note(new Date(2026, 8, 1, 20)), note(new Date(2026, 7, 30, 9))];
  assert.equal(getStreak(notes, today), 2);
  assert.equal(getStreak(notes.slice(1), today), 0);
  assert.equal(streakMessage(2), '2 days in a row. Building a rhythm.');
});

void test('calendar maps actual emotion ids and mixed light-heavy days', () => {
  const today = new Date(2026, 8, 2, 12);
  const notes = [
    note(new Date(2026, 7, 31, 9), ['grateful']),
    note(new Date(2026, 8, 1, 9), ['amused']),
    note(new Date(2026, 8, 2, 9), ['grief']),
    note(new Date(2026, 8, 3, 9), ['frustration']),
    note(new Date(2026, 8, 4, 9), ['grateful', 'grief']),
  ];
  const tones = Object.fromEntries(getCalendarDays(notes, today, 1).map((day) => [day.date, day.tone]));
  assert.equal(tones['2026-08-31'], 'gold');
  assert.equal(tones['2026-09-01'], 'green');
  assert.equal(tones['2026-09-02'], 'blue');
  assert.equal(tones['2026-09-03'], 'red');
  assert.equal(tones['2026-09-04'], 'mixed');
});
