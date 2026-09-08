export type Channel = 'grief' | 'vent' | 'gratitude' | 'fun';

export type CommunityPost = {
  id: string;
  channel: Channel;
  category: string;
  title: string;
  content: string;
  emotions?: string[];
  publishedAt?: string;
  createdAt?: string;
  isMine?: boolean;
};

export const seedPosts: CommunityPost[] = [
  {
    id: 'i-still-dial-your-number', channel: 'grief', category: 'missing-parent',
    title: "I still dial my mom's number sometimes",
    content: "Mom, I still open your contact and stare at it. I know no one will pick up, but seeing your name on the screen makes the world feel normal for two seconds. I got the job. I wish I could call and hear you say you knew I would.",
    emotions: ['grief', 'loved'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'dad-i-wish-you-saw-me-graduate', channel: 'grief', category: 'missing-parent',
    title: "Dad, I wish you'd seen me graduate",
    content: "They called my name and everyone cheered. For one bright second I looked for you in the crowd. I wore the watch you gave me. I hope somehow that counts as having you there.",
    emotions: ['grief', 'hopeful'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'ten-years-wasnt-enough', channel: 'grief', category: 'pet-loss',
    title: "Ten years with you wasn't enough",
    content: "I still put my hand down when I pass the place where your bed used to be. I still save the last bite of my sandwich, and then I remember. You were the best part of every bad day. The house is too quiet without you, buddy.",
    emotions: ['grief', 'loved'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'my-cat-knew-when-i-was-sad', channel: 'grief', category: 'pet-loss',
    title: 'My cat always knew when I was sad',
    content: "You would climb onto my chest and purr like it was your job to keep me here. I hope you knew how many times you did exactly that. I hope you knew you were family.",
    emotions: ['grief', 'loved'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'the-goodbye-i-never-said', channel: 'grief', category: 'friend',
    title: 'This is the goodbye I never got to say',
    content: "I thought there would be another coffee, another ridiculous voice note, another chance to tell you that you made the hard years survivable. Thank you. I am sorry. I miss you.",
    emotions: ['grief', 'grateful'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'my-boss-took-credit-again', channel: 'vent', category: 'work',
    title: 'My boss took credit for my work again',
    content: "He presented my idea in the meeting like it appeared in his head overnight. Then thanked me for taking notes. I smiled because rent exists, but I am absolutely furious.",
    emotions: ['frustration', 'angry'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'always-the-one-who-reaches-out', channel: 'vent', category: 'relationships',
    title: "I'm tired of always being the one who reaches out",
    content: "If I stopped texting first, half my friendships would disappear. I am tired of calling that connection. I want someone to notice when I go quiet.",
    emotions: ['frustration', 'grief'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'rent-went-up-again', channel: 'vent', category: 'money',
    title: 'My rent went up and my paycheck did not',
    content: "I work full time. I budget. I skip things. Somehow the answer is still that I should try harder while every basic part of being alive gets more expensive.",
    emotions: ['overwhelmed', 'frustration'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'stop-telling-me-to-calm-down', channel: 'vent', category: 'relationships',
    title: 'Please stop telling me to calm down',
    content: "I am not dramatic because I finally reacted after explaining the same boundary five times. Calling me sensitive does not erase what happened.",
    emotions: ['angry', 'frustration'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'customer-service-maze', channel: 'vent', category: 'life',
    title: 'I spent two hours trying to reach a human being',
    content: "Every menu sent me back to the beginning. The chatbot apologized twelve times and solved nothing. I would like to scream into a very large pillow.",
    emotions: ['frustration', 'amused'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'grateful-for-the-friend-who-called', channel: 'gratitude', category: 'people',
    title: 'Grateful for the friend who called at the right time',
    content: 'I had gone quiet and she noticed. She did not ask me to explain everything—she just stayed on the phone while I made dinner. That small kindness changed the whole evening.',
    emotions: ['grateful', 'loved'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'today-the-sun-felt-good', channel: 'gratitude', category: 'small-things',
    title: 'Today the sun on my face felt really good',
    content: 'Nothing huge happened. I stood outside with my coffee for five minutes and felt warm. I want to remember that an ordinary morning can still give me something.',
    emotions: ['grateful', 'hopeful'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'proud-i-said-no', channel: 'gratitude', category: 'growth',
    title: 'I am proud that I finally said no',
    content: 'My voice shook, but I kept the boundary. I usually make myself smaller to keep the peace. Today I chose myself without being cruel.',
    emotions: ['relieved', 'grateful'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'my-dog-brought-me-a-sock', channel: 'fun', category: 'tiny-win',
    title: 'My dog brought me one sock like it was treasure',
    content: 'He entered the room so proudly, placed it at my feet, and waited for applause. Honestly? He got a standing ovation.',
    emotions: ['amused', 'loved'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'accidental-video-call-ceiling', channel: 'fun', category: 'awkward',
    title: 'I joined a video call as a ceiling fan',
    content: 'My camera was on, my phone was flat on the desk, and I spent the first minute of the meeting presenting a dramatic close-up of the ceiling fan. Nobody stopped me.',
    emotions: ['amused'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
  {
    id: 'kid-called-pigeons-city-chickens', channel: 'fun', category: 'overheard',
    title: 'A kid called pigeons “city chickens”',
    content: 'I heard it at the crosswalk and now I refuse to call them anything else. The city chickens were having a very serious meeting.',
    emotions: ['amused'],
    publishedAt: '2026-09-01T08:50:16+08:00',
  },
];
