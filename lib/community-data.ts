export type Channel = 'grief' | 'vent' | 'gratitude' | 'fun';
export type ReactionKey = 'relate' | 'support' | 'understand';

export type CommunityPost = {
  id: string;
  channel: Channel;
  category: string;
  title: string;
  content: string;
  createdAt: string;
  reactions: Record<ReactionKey, number>;
  responses: { id: string; content: string; createdAt: string }[];
  isMine?: boolean;
};

export const seedPosts: CommunityPost[] = [
  {
    id: 'i-still-dial-your-number', channel: 'grief', category: 'missing-parent', reactions: { relate: 22, support: 18, understand: 8 }, createdAt: '2026-08-27T22:10:00.000Z',
    title: "I still dial my mom's number sometimes",
    content: "Mom, I still open your contact and stare at it. I know no one will pick up, but seeing your name on the screen makes the world feel normal for two seconds. I got the job. I wish I could call and hear you say you knew I would.",
    responses: [{ id: 'r1', content: 'I do this too. You are not alone in that small, impossible habit.', createdAt: '2026-08-28T02:20:00.000Z' }],
  },
  {
    id: 'dad-i-wish-you-saw-me-graduate', channel: 'grief', category: 'missing-parent', reactions: { relate: 11, support: 14, understand: 6 }, createdAt: '2026-08-25T08:00:00.000Z',
    title: "Dad, I wish you'd seen me graduate",
    content: "They called my name and everyone cheered. For one bright second I looked for you in the crowd. I wore the watch you gave me. I hope somehow that counts as having you there.", responses: [],
  },
  {
    id: 'ten-years-wasnt-enough', channel: 'grief', category: 'pet-loss', reactions: { relate: 29, support: 25, understand: 13 }, createdAt: '2026-08-23T18:45:00.000Z',
    title: "Ten years with you wasn't enough",
    content: "I still put my hand down when I pass the place where your bed used to be. I still save the last bite of my sandwich, and then I remember. You were the best part of every bad day. The house is too quiet without you, buddy.",
    responses: [{ id: 'r2', content: 'The quiet after losing them is so real. Sending you gentleness.', createdAt: '2026-08-24T07:30:00.000Z' }],
  },
  {
    id: 'my-cat-knew-when-i-was-sad', channel: 'grief', category: 'pet-loss', reactions: { relate: 20, support: 21, understand: 11 }, createdAt: '2026-08-21T14:15:00.000Z',
    title: 'My cat always knew when I was sad',
    content: "You would climb onto my chest and purr like it was your job to keep me here. I hope you knew how many times you did exactly that. I hope you knew you were family.", responses: [],
  },
  {
    id: 'the-goodbye-i-never-said', channel: 'grief', category: 'friend', reactions: { relate: 8, support: 10, understand: 6 }, createdAt: '2026-08-19T11:40:00.000Z',
    title: 'This is the goodbye I never got to say',
    content: "I thought there would be another coffee, another ridiculous voice note, another chance to tell you that you made the hard years survivable. Thank you. I am sorry. I miss you.", responses: [],
  },
  {
    id: 'my-boss-took-credit-again', channel: 'vent', category: 'work', reactions: { relate: 18, support: 9, understand: 12 }, createdAt: '2026-08-29T09:12:00.000Z',
    title: 'My boss took credit for my work again',
    content: "He presented my idea in the meeting like it appeared in his head overnight. Then thanked me for taking notes. I smiled because rent exists, but I am absolutely furious.", responses: [],
  },
  {
    id: 'always-the-one-who-reaches-out', channel: 'vent', category: 'relationships', reactions: { relate: 14, support: 8, understand: 6 }, createdAt: '2026-08-28T17:05:00.000Z',
    title: "I'm tired of always being the one who reaches out",
    content: "If I stopped texting first, half my friendships would disappear. I am tired of calling that connection. I want someone to notice when I go quiet.", responses: [{ id: 'r3', content: 'I stopped reaching out for a month and learned a lot. It hurt, but it was clarifying.', createdAt: '2026-08-29T01:00:00.000Z' }],
  },
  {
    id: 'rent-went-up-again', channel: 'vent', category: 'money', reactions: { relate: 12, support: 3, understand: 4 }, createdAt: '2026-08-27T13:20:00.000Z',
    title: 'My rent went up and my paycheck did not',
    content: "I work full time. I budget. I skip things. Somehow the answer is still that I should try harder while every basic part of being alive gets more expensive.", responses: [],
  },
  {
    id: 'stop-telling-me-to-calm-down', channel: 'vent', category: 'relationships', reactions: { relate: 21, support: 8, understand: 13 }, createdAt: '2026-08-26T21:45:00.000Z',
    title: 'Please stop telling me to calm down',
    content: "I am not dramatic because I finally reacted after explaining the same boundary five times. Calling me sensitive does not erase what happened.", responses: [],
  },
  {
    id: 'customer-service-maze', channel: 'vent', category: 'life', reactions: { relate: 10, support: 2, understand: 4 }, createdAt: '2026-08-24T16:30:00.000Z',
    title: 'I spent two hours trying to reach a human being',
    content: "Every menu sent me back to the beginning. The chatbot apologized twelve times and solved nothing. I would like to scream into a very large pillow.", responses: [],
  },
  {
    id: 'grateful-for-the-friend-who-called', channel: 'gratitude', category: 'people', reactions: { relate: 12, support: 10, understand: 8 }, createdAt: '2026-08-30T07:20:00.000Z',
    title: 'Grateful for the friend who called at the right time',
    content: 'I had gone quiet and she noticed. She did not ask me to explain everything—she just stayed on the phone while I made dinner. That small kindness changed the whole evening.',
    responses: [{ id: 'r4', content: 'The people who notice our silence are such a gift.', createdAt: '2026-08-30T08:05:00.000Z' }],
  },
  {
    id: 'today-the-sun-felt-good', channel: 'gratitude', category: 'small-things', reactions: { relate: 17, support: 4, understand: 9 }, createdAt: '2026-08-29T10:25:00.000Z',
    title: 'Today the sun on my face felt really good',
    content: 'Nothing huge happened. I stood outside with my coffee for five minutes and felt warm. I want to remember that an ordinary morning can still give me something.', responses: [],
  },
  {
    id: 'proud-i-said-no', channel: 'gratitude', category: 'growth', reactions: { relate: 13, support: 12, understand: 5 }, createdAt: '2026-08-28T15:40:00.000Z',
    title: 'I am proud that I finally said no',
    content: 'My voice shook, but I kept the boundary. I usually make myself smaller to keep the peace. Today I chose myself without being cruel.', responses: [],
  },
  {
    id: 'my-dog-brought-me-a-sock', channel: 'fun', category: 'tiny-win', reactions: { relate: 9, support: 5, understand: 18 }, createdAt: '2026-08-30T12:15:00.000Z',
    title: 'My dog brought me one sock like it was treasure',
    content: 'He entered the room so proudly, placed it at my feet, and waited for applause. Honestly? He got a standing ovation.',
    responses: [{ id: 'r5', content: 'Please tell him the internet is very proud of his important work.', createdAt: '2026-08-30T12:45:00.000Z' }],
  },
  {
    id: 'accidental-video-call-ceiling', channel: 'fun', category: 'awkward', reactions: { relate: 14, support: 3, understand: 16 }, createdAt: '2026-08-29T19:10:00.000Z',
    title: 'I joined a video call as a ceiling fan',
    content: 'My camera was on, my phone was flat on the desk, and I spent the first minute of the meeting presenting a dramatic close-up of the ceiling fan. Nobody stopped me.', responses: [],
  },
  {
    id: 'kid-called-pigeons-city-chickens', channel: 'fun', category: 'overheard', reactions: { relate: 7, support: 4, understand: 21 }, createdAt: '2026-08-28T09:30:00.000Z',
    title: 'A kid called pigeons “city chickens”',
    content: 'I heard it at the crosswalk and now I refuse to call them anything else. The city chickens were having a very serious meeting.', responses: [],
  },
];
