export const EMOTIONS = [
  { id: 'grief', emoji: '😢', label: 'Grief' },
  { id: 'frustration', emoji: '😤', label: 'Frustration' },
  { id: 'grateful', emoji: '🙏', label: 'Grateful' },
  { id: 'amused', emoji: '😂', label: 'Amused' },
  { id: 'hopeful', emoji: '😔', label: 'Hopeful' },
  { id: 'numb', emoji: '😶', label: 'Numb' },
  { id: 'angry', emoji: '😡', label: 'Angry' },
  { id: 'relieved', emoji: '🥲', label: 'Relieved' },
  { id: 'overwhelmed', emoji: '🤯', label: 'Overwhelmed' },
  { id: 'loved', emoji: '💛', label: 'Loved' },
] as const;

export type EmotionId = typeof EMOTIONS[number]['id'];
