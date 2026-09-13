export type StoreItem = {
  id: string;
  name: string;
  description: string;
  type: 'title' | 'consumable' | 'theme' | 'sound';
  price: number;
  levelReq: number;
  preview?: { bg: string; border: string; accent: string }; // For themes
};

export const STORE_ITEMS: StoreItem[] = [
  // Consumables & Boosters
  { id: 'streak-shield', name: 'Streak Shield', description: 'Protects your streak if you miss a day. Max 3.', type: 'consumable', price: 400, levelReq: 2 },
  { id: 'focus-elixir', name: 'Focus Elixir (XP)', description: 'Grants +100% XP for your next completed session.', type: 'consumable', price: 150, levelReq: 3 },
  { id: 'ap-booster', name: 'AP Booster', description: 'Grants +100% AP for your next completed session.', type: 'consumable', price: 300, levelReq: 5 },
  
  // Themes
  { id: 'theme-dark', name: 'Monochrome Dark', description: 'Pure, disciplined obsidian and soft titanium whites.', type: 'theme', price: 0, levelReq: 1, preview: { bg: '#09090b', border: '#27272a', accent: '#ffffff' } },
  { id: 'theme-amber', name: 'Solar Amber', description: 'Deep volcanic obsidian infused with radiant molten amber.', type: 'theme', price: 600, levelReq: 2, preview: { bg: '#0b0a08', border: '#78350f', accent: '#f59e0b' } },
  { id: 'theme-matrix', name: 'Emerald Matrix', description: 'Tactical cyber-carbon with glowing terminal green highlights.', type: 'theme', price: 1000, levelReq: 4, preview: { bg: '#040d08', border: '#065f46', accent: '#10b981' } },
  { id: 'theme-cyberpunk', name: 'Neon Protocol', description: 'Electric cyan and vivid magenta against dark midnight navy.', type: 'theme', price: 1500, levelReq: 6, preview: { bg: '#040814', border: '#0e7490', accent: '#00f0ff' } },
  { id: 'theme-crimson', name: 'Crimson Protocol', description: 'High-contrast shadow graphite with bold scarlet red accents.', type: 'theme', price: 2500, levelReq: 8, preview: { bg: '#0d0505', border: '#991b1b', accent: '#ef4444' } },

  // Soundscapes
  { id: 'sound-brown-noise', name: 'Deep Brown Noise', description: 'A warm, low-frequency hum to drown out distractions.', type: 'sound', price: 500, levelReq: 2 },
  { id: 'sound-white-noise', name: 'Static White Noise', description: 'A sharp, consistent static screen for pure isolation.', type: 'sound', price: 500, levelReq: 2 },
  { id: 'sound-rain', name: 'Midnight Rain', description: 'Heavy raindrops on a glass window.', type: 'sound', price: 800, levelReq: 3 },
  { id: 'sound-campfire', name: 'Crackling Campfire', description: 'Warm, rhythmic crackles of burning wood.', type: 'sound', price: 1000, levelReq: 4 },
  { id: 'sound-ocean', name: 'Ocean Waves', description: 'Slow, rhythmic crashing of waves on a midnight beach.', type: 'sound', price: 1200, levelReq: 5 },
  { id: 'sound-forest', name: 'Windy Forest', description: 'Gusting winds and occasional night birds through pine trees.', type: 'sound', price: 1500, levelReq: 6 },

  // Titles
  { id: 'title-novice', name: 'Novice', description: 'Just starting the journey.', type: 'title', price: 0, levelReq: 1 },
  { id: 'title-scholar', name: 'Scholar', description: 'Dedicated to the craft.', type: 'title', price: 500, levelReq: 3 },
  { id: 'title-thinker', name: 'Deep Thinker', description: 'For those who get lost in the flow.', type: 'title', price: 1200, levelReq: 5 },
  { id: 'title-vanguard', name: 'Vanguard', description: 'Leading the charge on the leaderboard.', type: 'title', price: 3000, levelReq: 7 },
  { id: 'title-architect', name: 'Architect of Time', description: 'You control your hours; they do not control you.', type: 'title', price: 5000, levelReq: 10 },
  { id: 'title-iron-will', name: 'Iron Will', description: 'Unbreakable consistency.', type: 'title', price: 8000, levelReq: 15 },
  { id: 'title-ascended', name: 'Ascended', description: 'You have conquered your distractions.', type: 'title', price: 15000, levelReq: 20 },
];

export type QuestType = 'focus_time' | 'tasks_completed' | 'dawn_patrol' | 'night_owl' | 'deep_work' | 'iron_discipline';

export type DailyQuest = {
  id: string;
  desc: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  type: QuestType;
};

export type WeeklyContract = {
  id: string;
  desc: string;
  target: number;
  progress: number;
  reward: number;
  rewardXP: number;
  completed: boolean;
  type: 'focus_time' | 'tasks_completed';
  assignedDate: string; // Used to check if it's a new week
};

export const QUEST_POOL: Omit<DailyQuest, 'progress' | 'completed'>[] = [
  { id: 'q_focus_60', desc: 'Focus for 60 mins', target: 60, reward: 50, type: 'focus_time' },
  { id: 'q_focus_120', desc: 'Focus for 120 mins', target: 120, reward: 120, type: 'focus_time' },
  { id: 'q_tasks_3', desc: 'Finish 3 tasks', target: 3, reward: 40, type: 'tasks_completed' },
  { id: 'q_tasks_10', desc: 'Task Slayer: Finish 10 tasks', target: 10, reward: 150, type: 'tasks_completed' },
  { id: 'q_dawn_patrol', desc: 'Dawn Patrol: Complete a session before 9 AM', target: 1, reward: 80, type: 'dawn_patrol' },
  { id: 'q_night_owl', desc: 'Night Owl: Complete a session after 10 PM', target: 1, reward: 80, type: 'night_owl' },
  { id: 'q_deep_work', desc: 'Deep Work: Complete a single 90+ min session', target: 1, reward: 200, type: 'deep_work' },
];

export const CONTRACT_POOL: Omit<WeeklyContract, 'progress' | 'completed' | 'assignedDate'>[] = [
  { id: 'wc_focus_10h', desc: 'Titan\'s Grind: 10 Hours of Focus', target: 600, reward: 1000, rewardXP: 1000, type: 'focus_time' },
  { id: 'wc_focus_15h', desc: 'Ascendant\'s Grind: 15 Hours of Focus', target: 900, reward: 2000, rewardXP: 2000, type: 'focus_time' },
  { id: 'wc_tasks_50', desc: 'Executioner: Complete 50 Tasks', target: 50, reward: 1500, rewardXP: 1500, type: 'tasks_completed' },
];

export function generateDailyQuests(): DailyQuest[] {
  const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(q => ({
    ...q,
    progress: 0,
    completed: false
  }));
}

export function generateWeeklyContract(): WeeklyContract {
  const contract = CONTRACT_POOL[Math.floor(Math.random() * CONTRACT_POOL.length)];
  return {
    ...contract,
    progress: 0,
    completed: false,
    assignedDate: new Date().toISOString()
  };
}
