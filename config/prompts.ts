import type { Channel } from '@/lib/community-data';

export const CHANNEL_PROMPTS: Record<Channel, string[]> = {
  grief: [
    'What do you wish you had said to them?',
    "What's a memory of them that you never want to fade?",
    'If they could see you now, what would you want them to know?',
    "What's the hardest time of day without them?",
    'What tradition or ritual of theirs do you still keep?',
  ],
  vent: [
    "What happened today that you can't say out loud?",
    'Who or what crossed a line this week?',
    "What's a situation you're tired of pretending is fine?",
    'If you could scream one thing right now, what would it be?',
    "What's the part of this that nobody else sees?",
  ],
  gratitude: [
    'What made you smile today that you usually overlook?',
    'Who showed up for you recently, in a small way?',
    'What is one thing your body did for you today?',
    "What's a hard thing that turned out to be worth it?",
    "What's something you're grateful to have left behind?",
  ],
  fun: [
    "What's the silliest thing that happened to you this week?",
    "What made you laugh so hard you couldn't breathe?",
    "What's a small, ridiculous joy you'd defend to the death?",
    "What's the best thing you overheard a stranger say?",
    'If your pet could talk for 10 seconds, what would they say?',
  ],
};
