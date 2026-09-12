export type StoreItem = {
  id: string;
  name: string;
  description: string;
  type: 'theme' | 'sound' | 'title';
  price: number;
  levelReq: number;
};

export const STORE_ITEMS: StoreItem[] = [
  { id: 'theme-terminal-red', name: 'Terminal Red', description: 'Deep blacks and aggressive crimson red.', type: 'theme', price: 1000, levelReq: 1 },
  { id: 'theme-cyberpunk', name: 'Cyberpunk', description: 'Neon yellows and piercing cyans.', type: 'theme', price: 1500, levelReq: 5 },
  { id: 'theme-sepia', name: 'Sepia Paper', description: 'Warm, aged paper tones for reading.', type: 'theme', price: 800, levelReq: 1 },
  
  { id: 'sound-bowl', name: 'Singing Bowl', description: 'A deep, resonant Tibetan singing bowl.', type: 'sound', price: 500, levelReq: 1 },
  { id: 'sound-digital', name: 'Digital Beep', description: 'A crisp, classic digital watch alarm.', type: 'sound', price: 300, levelReq: 1 },
  { id: 'sound-lofi', name: 'Lo-Fi Chime', description: 'A muted, tape-warped electric piano chord.', type: 'sound', price: 600, levelReq: 3 },
  
  { id: 'title-novice', name: 'Novice', description: 'Just starting the journey.', type: 'title', price: 200, levelReq: 1 },
  { id: 'title-thinker', name: 'Deep Thinker', description: 'For those who get lost in the flow.', type: 'title', price: 1000, levelReq: 5 },
  { id: 'title-ascended', name: 'Ascended', description: 'You have conquered your distractions.', type: 'title', price: 5000, levelReq: 10 },
];

export type Achievement = {
  id: string;
  name: string;
  description: string;
  condition: (stats: { totalFocusMinutes: number; totalTasks: number }) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-first-focus', name: 'First Steps', description: 'Complete your first minute of focus.', condition: (s) => s.totalFocusMinutes >= 1 },
  { id: 'ach-10-hours', name: 'Initiate', description: 'Reach 10 hours of total focus time.', condition: (s) => s.totalFocusMinutes >= 600 },
  { id: 'ach-50-hours', name: 'Adept', description: 'Reach 50 hours of total focus time.', condition: (s) => s.totalFocusMinutes >= 3000 },
  { id: 'ach-first-task', name: 'Doer', description: 'Complete your first task.', condition: (s) => s.totalTasks >= 1 },
  { id: 'ach-50-tasks', name: 'Taskmaster', description: 'Complete 50 tasks.', condition: (s) => s.totalTasks >= 50 },
];

export type DailyQuest = {
  id: string;
  desc: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  type: 'focus_time' | 'tasks_completed';
};

export const QUEST_POOL = [
  { id: 'q_focus_60', desc: 'Deep Dive: Focus for 60 mins', target: 60, reward: 50, type: 'focus_time' as const },
  { id: 'q_focus_120', desc: 'Zone State: Focus for 120 mins', target: 120, reward: 100, type: 'focus_time' as const },
  { id: 'q_tasks_3', desc: 'Productive: Finish 3 tasks', target: 3, reward: 40, type: 'tasks_completed' as const },
  { id: 'q_tasks_10', desc: 'Task Slayer: Finish 10 tasks', target: 10, reward: 150, type: 'tasks_completed' as const },
];

export function generateDailyQuests(): DailyQuest[] {
  // Pick 3 random quests
  const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(q => ({
    ...q,
    progress: 0,
    completed: false
  }));
}
