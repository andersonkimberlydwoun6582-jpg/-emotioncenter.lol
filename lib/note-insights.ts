import type { CommunityPost } from '@/lib/community-data';

const goldEmotions = new Set(['grateful', 'loved', 'relieved', 'hopeful']);
const greenEmotions = new Set(['amused']);
const blueEmotions = new Set(['grief', 'numb']);
const redEmotions = new Set(['frustration', 'angry', 'overwhelmed']);

export type CalendarTone = 'gold' | 'green' | 'blue' | 'red' | 'mixed' | 'unmarked';

export type CalendarDay = {
  date: string;
  dayNumber: number;
  future: boolean;
  notes: CommunityPost[];
  emotions: string[];
  tone: CalendarTone;
};

export function localDateKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-CA');
}

export function getStreak(notes: CommunityPost[], today = new Date()) {
  const writtenDays = new Set(notes.map((note) => note.createdAt ? localDateKey(note.createdAt) : '').filter(Boolean));
  const check = new Date(today);
  check.setHours(12, 0, 0, 0);
  let streak = 0;

  while (writtenDays.has(localDateKey(check))) {
    streak += 1;
    check.setDate(check.getDate() - 1);
  }

  return streak;
}

export function streakMessage(streak: number) {
  if (streak === 0) return 'Start your first entry today.';
  if (streak === 1) return "You wrote today. That's enough.";
  if (streak <= 3) return `${streak} days in a row. Building a rhythm.`;
  if (streak <= 6) return `${streak} days. Something's shifting.`;
  return `${streak} days. You're showing up for yourself.`;
}

function calendarTone(emotions: string[]): CalendarTone {
  const hasGold = emotions.some((emotion) => goldEmotions.has(emotion));
  const hasGreen = emotions.some((emotion) => greenEmotions.has(emotion));
  const hasBlue = emotions.some((emotion) => blueEmotions.has(emotion));
  const hasRed = emotions.some((emotion) => redEmotions.has(emotion));
  const hasLight = hasGold || hasGreen;
  const hasHeavy = hasBlue || hasRed;

  if (hasLight && hasHeavy) return 'mixed';
  if (hasRed) return 'red';
  if (hasBlue) return 'blue';
  if (hasGold) return 'gold';
  if (hasGreen) return 'green';
  return 'unmarked';
}

export function getCalendarDays(notes: CommunityPost[], today = new Date(), weeks = 12) {
  const notesByDate = new Map<string, CommunityPost[]>();
  for (const note of notes) {
    if (!note.createdAt) continue;
    const date = localDateKey(note.createdAt);
    if (!date) continue;
    const entries = notesByDate.get(date) ?? [];
    entries.push(note);
    notesByDate.set(date, entries);
  }

  const current = new Date(today);
  current.setHours(12, 0, 0, 0);
  const currentKey = localDateKey(current);
  const start = new Date(current);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday - (weeks - 1) * 7);

  return Array.from({ length: weeks * 7 }, (_, index): CalendarDay => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const date = localDateKey(day);
    const dayNotes = notesByDate.get(date) ?? [];
    const emotions = [...new Set(dayNotes.flatMap((note) => note.emotions ?? []))];
    return {
      date,
      dayNumber: day.getDate(),
      future: date > currentKey,
      notes: dayNotes,
      emotions,
      tone: calendarTone(emotions),
    };
  });
}
