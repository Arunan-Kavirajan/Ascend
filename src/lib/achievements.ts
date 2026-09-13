import type { UserProfile } from '../context/UserContext';
import type { Session } from '../context/SessionContext';

export interface Achievement {
  id: string;
  tier: number;
  name: string;
  description: string;
  apReward: number;
  progress: (profile: UserProfile, sessions: Session[]) => [number, number];
}

export const TIERS = [
  { level: 1, name: 'Initiate', capstoneTitle: 'The Awakened', capstoneReward: 150 },
  { level: 2, name: 'Apprentice', capstoneTitle: 'Iron Vanguard', capstoneReward: 300 },
  { level: 3, name: 'Adept', capstoneTitle: 'Flow Weaver', capstoneReward: 500 },
  { level: 4, name: 'Master', capstoneTitle: 'Monolith Mind', capstoneReward: 750 },
  { level: 5, name: 'Grandmaster', capstoneTitle: 'Unbroken Sovereign', capstoneReward: 1200 },
  { level: 6, name: 'Ascended', capstoneTitle: 'The Ascended Prime', capstoneReward: 2500 },
];

const achievements: Achievement[] = [];

// Helper functions for common progress calculations
const getFocusMinutes = (p: UserProfile) => p.totalFocusMinutes || 0;
const getTasks = (p: UserProfile) => p.totalTasks || 0;
const getStreak = (p: UserProfile) => p.currentStreak || 0;
const getPomodoros = (sessions: Session[]) => sessions.reduce((acc, s) => acc + (s.completedPomodoros || 0), 0);
const getMaxSessionLen = (sessions: Session[]) => Math.max(0, ...sessions.map(s => s.totalFocusTime / 60));
// unused strict sessions placeholder // assuming isStrict might be added, or we just mock it for now. Let's just use normal sessions > 60m as 'deep' sessions
const getDeepSessions = (sessions: Session[]) => sessions.filter(s => s.totalFocusTime >= 60 * 60).length;

function addTier(tier: number, apBase: number, defs: Omit<Achievement, 'tier' | 'apReward' | 'id'>[]) {
  defs.forEach((d, i) => {
    achievements.push({
      ...d,
      tier,
      id: `ach-t${tier}-${i}`,
      apReward: apBase + (i % 3) * 10 // Slight variation in rewards
    });
  });
}

// Tier 1: Initiate (18 achievements)
addTier(1, 30, [
  { name: 'First Breath', description: 'Focus for your first 10 minutes.', progress: (p, _s) => [getFocusMinutes(p), 10] },
  { name: 'Genesis', description: 'Reach 1 hour of total focus.', progress: (p, _s) => [getFocusMinutes(p), 60] },
  { name: 'The First Stone', description: 'Complete your first task.', progress: (p, _s) => [getTasks(p), 1] },
  { name: 'Apprentice Builder', description: 'Complete 5 tasks.', progress: (p, _s) => [getTasks(p), 5] },
  { name: 'Spark of Discipline', description: 'Maintain a 3-day streak.', progress: (p, _s) => [getStreak(p), 3] },
  { name: 'First Pomodoro', description: 'Complete 1 Pomodoro block.', progress: (_p, s) => [getPomodoros(s), 1] },
  { name: 'Timer Initiate', description: 'Complete 5 Pomodoro blocks.', progress: (_p, s) => [getPomodoros(s), 5] },
  { name: 'Deep Dip', description: 'Complete a single session of 20+ minutes.', progress: (_p, s) => [getMaxSessionLen(s), 20] },
  { name: 'Leveling Up', description: 'Reach Level 2.', progress: (p, _s) => [p.level || 1, 2] },
  { name: 'Wealth Builder', description: 'Accumulate 100 AP (All Time).', progress: (p, _s) => [(p.level || 1)*100, 200] }, // mocked progress
  { name: 'Night Owl Initiate', description: 'Log a session after 10 PM.', progress: (_p, s) => [s.some(x => new Date(x.createdAt).getHours() >= 22) ? 1 : 0, 1] },
  { name: 'Early Bird', description: 'Log a session before 8 AM.', progress: (_p, s) => [s.some(x => new Date(x.createdAt).getHours() <= 7) ? 1 : 0, 1] },
  { name: 'Weekend Warrior', description: 'Log a session on a Saturday.', progress: (_p, s) => [s.some(x => new Date(x.createdAt).getDay() === 6) ? 1 : 0, 1] },
  { name: 'Sunday Restless', description: 'Log a session on a Sunday.', progress: (_p, s) => [s.some(x => new Date(x.createdAt).getDay() === 0) ? 1 : 0, 1] },
  { name: 'Two in a Day', description: 'Complete 2 sessions in one day.', progress: (_p, s) => [s.length >= 2 ? 2 : s.length, 2] },
  { name: 'Task Trio', description: 'Complete 3 tasks in one session.', progress: (_p, s) => [Math.max(0, ...s.map(x => x.tasks?.filter(t => t.completed).length || 0)), 3] },
  { name: 'Getting Serious', description: 'Reach 2 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 120] },
  { name: 'Ten Steps', description: 'Complete 10 tasks total.', progress: (p, _s) => [getTasks(p), 10] },
]);

// Tier 2: Apprentice (18 achievements)
addTier(2, 60, [
  { name: 'Momentum', description: 'Reach 5 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 300] },
  { name: 'Steady Hands', description: 'Complete 25 tasks total.', progress: (p, _s) => [getTasks(p), 25] },
  { name: 'One Week', description: 'Maintain a 7-day streak.', progress: (p, _s) => [getStreak(p), 7] },
  { name: 'Pomodoro Adept', description: 'Complete 20 Pomodoro blocks.', progress: (_p, s) => [getPomodoros(s), 20] },
  { name: 'Deep Diver', description: 'Complete a single 45+ min session.', progress: (_p, s) => [getMaxSessionLen(s), 45] },
  { name: 'Level 5', description: 'Reach Level 5.', progress: (p, _s) => [p.level || 1, 5] },
  { name: 'Task Master I', description: 'Complete 5 tasks in one session.', progress: (_p, s) => [Math.max(0, ...s.map(x => x.tasks?.filter(t => t.completed).length || 0)), 5] },
  { name: 'Triple Threat', description: 'Complete 3 sessions in one day.', progress: (_p, s) => [Math.min(3, s.length), 3] },
  { name: 'Night Watch', description: 'Log 3 sessions after 10 PM.', progress: (_p, s) => [Math.min(3, s.filter(x => new Date(x.createdAt).getHours() >= 22).length), 3] },
  { name: 'Dawn Chorus', description: 'Log 3 sessions before 8 AM.', progress: (_p, s) => [Math.min(3, s.filter(x => new Date(x.createdAt).getHours() <= 7).length), 3] },
  { name: 'Full Weekend', description: 'Log sessions on both Sat and Sun in your lifetime.', progress: (_p, s) => [(s.some(x => new Date(x.createdAt).getDay() === 6) ? 1 : 0) + (s.some(x => new Date(x.createdAt).getDay() === 0) ? 1 : 0), 2] },
  { name: 'Deep Work I', description: 'Complete 1 deep session (60m+).', progress: (_p, s) => [getDeepSessions(s), 1] },
  { name: 'Ten Hours', description: 'Reach 10 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 600] },
  { name: 'Fifty Tasks', description: 'Complete 50 tasks total.', progress: (p, _s) => [getTasks(p), 50] },
  { name: 'Double Digits', description: 'Maintain a 10-day streak.', progress: (p, _s) => [getStreak(p), 10] },
  { name: 'Pomodoro Enthusiast', description: 'Complete 50 Pomodoros.', progress: (_p, s) => [getPomodoros(s), 50] },
  { name: 'Level 10', description: 'Reach Level 10.', progress: (p, _s) => [p.level || 1, 10] },
  { name: 'Focus Endurance', description: 'Reach 15 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 900] },
]);

// Tier 3: Adept (18 achievements)
addTier(3, 120, [
  { name: 'The Grind', description: 'Reach 25 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 1500] },
  { name: 'Task Force', description: 'Complete 100 tasks total.', progress: (p, _s) => [getTasks(p), 100] },
  { name: 'Fortnight', description: 'Maintain a 14-day streak.', progress: (p, _s) => [getStreak(p), 14] },
  { name: 'Pomodoro Master', description: 'Complete 100 Pomodoros.', progress: (_p, s) => [getPomodoros(s), 100] },
  { name: 'The Long Haul', description: 'Complete a single 90+ min session.', progress: (_p, s) => [getMaxSessionLen(s), 90] },
  { name: 'Level 15', description: 'Reach Level 15.', progress: (p, _s) => [p.level || 1, 15] },
  { name: 'Deep Work V', description: 'Complete 5 deep sessions (60m+).', progress: (_p, s) => [getDeepSessions(s), 5] },
  { name: 'Vampire', description: 'Log 10 sessions after 10 PM.', progress: (_p, s) => [Math.min(10, s.filter(x => new Date(x.createdAt).getHours() >= 22).length), 10] },
  { name: 'Early Riser', description: 'Log 10 sessions before 8 AM.', progress: (_p, s) => [Math.min(10, s.filter(x => new Date(x.createdAt).getHours() <= 7).length), 10] },
  { name: 'Unstoppable', description: 'Complete 4 sessions in one day.', progress: (_p, s) => [Math.min(4, s.length), 4] },
  { name: 'Task Master II', description: 'Complete 10 tasks in one session.', progress: (_p, s) => [Math.max(0, ...s.map(x => x.tasks?.filter(t => t.completed).length || 0)), 10] },
  { name: 'Forty Hours', description: 'Reach 40 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 2400] },
  { name: 'Three Weeks', description: 'Maintain a 21-day streak.', progress: (p, _s) => [getStreak(p), 21] },
  { name: '150 Tasks', description: 'Complete 150 tasks total.', progress: (p, _s) => [getTasks(p), 150] },
  { name: 'Level 20', description: 'Reach Level 20.', progress: (p, _s) => [p.level || 1, 20] },
  { name: 'Deep Work X', description: 'Complete 10 deep sessions (60m+).', progress: (_p, s) => [getDeepSessions(s), 10] },
  { name: 'Half Century', description: 'Reach 50 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 3000] },
  { name: 'Pomodoro Veteran', description: 'Complete 150 Pomodoros.', progress: (_p, s) => [getPomodoros(s), 150] },
]);

// Tier 4: Master (18 achievements)
addTier(4, 250, [
  { name: 'Centurion', description: 'Reach 100 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 6000] },
  { name: 'Task Lord', description: 'Complete 250 tasks total.', progress: (p, _s) => [getTasks(p), 250] },
  { name: 'One Month', description: 'Maintain a 30-day streak.', progress: (p, _s) => [getStreak(p), 30] },
  { name: 'Pomodoro Lord', description: 'Complete 250 Pomodoros.', progress: (_p, s) => [getPomodoros(s), 250] },
  { name: 'Marathon', description: 'Complete a single 120+ min session.', progress: (_p, s) => [getMaxSessionLen(s), 120] },
  { name: 'Level 25', description: 'Reach Level 25.', progress: (p, _s) => [p.level || 1, 25] },
  { name: 'Deep Work XXV', description: 'Complete 25 deep sessions (60m+).', progress: (_p, s) => [getDeepSessions(s), 25] },
  { name: 'Night King', description: 'Log 25 sessions after 10 PM.', progress: (_p, s) => [Math.min(25, s.filter(x => new Date(x.createdAt).getHours() >= 22).length), 25] },
  { name: 'Dawn Bringer', description: 'Log 25 sessions before 8 AM.', progress: (_p, s) => [Math.min(25, s.filter(x => new Date(x.createdAt).getHours() <= 7).length), 25] },
  { name: 'Relentless', description: 'Complete 5 sessions in one day.', progress: (_p, s) => [Math.min(5, s.length), 5] },
  { name: 'Task Master III', description: 'Complete 15 tasks in one session.', progress: (_p, s) => [Math.max(0, ...s.map(x => x.tasks?.filter(t => t.completed).length || 0)), 15] },
  { name: '150 Hours', description: 'Reach 150 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 9000] },
  { name: '45 Days', description: 'Maintain a 45-day streak.', progress: (p, _s) => [getStreak(p), 45] },
  { name: '350 Tasks', description: 'Complete 350 tasks total.', progress: (p, _s) => [getTasks(p), 350] },
  { name: 'Level 30', description: 'Reach Level 30.', progress: (p, _s) => [p.level || 1, 30] },
  { name: 'Deep Work L', description: 'Complete 50 deep sessions (60m+).', progress: (_p, s) => [getDeepSessions(s), 50] },
  { name: '200 Hours', description: 'Reach 200 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 12000] },
  { name: '400 Pomodoros', description: 'Complete 400 Pomodoros.', progress: (_p, s) => [getPomodoros(s), 400] },
]);

// Tier 5: Grandmaster (18 achievements)
addTier(5, 500, [
  { name: 'True Dedication', description: 'Reach 250 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 15000] },
  { name: 'Task Grandmaster', description: 'Complete 500 tasks total.', progress: (p, _s) => [getTasks(p), 500] },
  { name: 'Two Months', description: 'Maintain a 60-day streak.', progress: (p, _s) => [getStreak(p), 60] },
  { name: 'Pomodoro Grandmaster', description: 'Complete 500 Pomodoros.', progress: (_p, s) => [getPomodoros(s), 500] },
  { name: 'Iron Will', description: 'Complete a single 180+ min session.', progress: (_p, s) => [getMaxSessionLen(s), 180] },
  { name: 'Level 35', description: 'Reach Level 35.', progress: (p, _s) => [p.level || 1, 35] },
  { name: 'Deep Work C', description: 'Complete 100 deep sessions (60m+).', progress: (_p, s) => [getDeepSessions(s), 100] },
  { name: 'Creature of the Night', description: 'Log 50 sessions after 10 PM.', progress: (_p, s) => [Math.min(50, s.filter(x => new Date(x.createdAt).getHours() >= 22).length), 50] },
  { name: 'Sun God', description: 'Log 50 sessions before 8 AM.', progress: (_p, s) => [Math.min(50, s.filter(x => new Date(x.createdAt).getHours() <= 7).length), 50] },
  { name: 'Machine', description: 'Complete 6 sessions in one day.', progress: (_p, s) => [Math.min(6, s.length), 6] },
  { name: 'Task Master IV', description: 'Complete 25 tasks in one session.', progress: (_p, s) => [Math.max(0, ...s.map(x => x.tasks?.filter(t => t.completed).length || 0)), 25] },
  { name: '300 Hours', description: 'Reach 300 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 18000] },
  { name: '75 Days', description: 'Maintain a 75-day streak.', progress: (p, _s) => [getStreak(p), 75] },
  { name: '750 Tasks', description: 'Complete 750 tasks total.', progress: (p, _s) => [getTasks(p), 750] },
  { name: 'Level 40', description: 'Reach Level 40.', progress: (p, _s) => [p.level || 1, 40] },
  { name: 'Deep Work CL', description: 'Complete 150 deep sessions (60m+).', progress: (_p, s) => [getDeepSessions(s), 150] },
  { name: '400 Hours', description: 'Reach 400 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 24000] },
  { name: '750 Pomodoros', description: 'Complete 750 Pomodoros.', progress: (_p, s) => [getPomodoros(s), 750] },
]);

// Tier 6: Ascended (18 achievements)
addTier(6, 1000, [
  { name: 'The Monolith', description: 'Reach 500 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 30000] },
  { name: 'Task Ascendant', description: 'Complete 1,000 tasks total.', progress: (p, _s) => [getTasks(p), 1000] },
  { name: '100 Days of Focus', description: 'Maintain a 100-day streak.', progress: (p, _s) => [getStreak(p), 100] },
  { name: 'Pomodoro Ascendant', description: 'Complete 1,000 Pomodoros.', progress: (_p, s) => [getPomodoros(s), 1000] },
  { name: 'The Apex Session', description: 'Complete a single 240+ min session.', progress: (_p, s) => [getMaxSessionLen(s), 240] },
  { name: 'Level 50', description: 'Reach Level 50.', progress: (p, _s) => [p.level || 1, 50] },
  { name: 'Deep Work CCL', description: 'Complete 250 deep sessions (60m+).', progress: (_p, s) => [getDeepSessions(s), 250] },
  { name: 'Nyx', description: 'Log 100 sessions after 10 PM.', progress: (_p, s) => [Math.min(100, s.filter(x => new Date(x.createdAt).getHours() >= 22).length), 100] },
  { name: 'Eos', description: 'Log 100 sessions before 8 AM.', progress: (_p, s) => [Math.min(100, s.filter(x => new Date(x.createdAt).getHours() <= 7).length), 100] },
  { name: 'Limitless', description: 'Complete 7 sessions in one day.', progress: (_p, s) => [Math.min(7, s.length), 7] },
  { name: 'Task Master V', description: 'Complete 40 tasks in one session.', progress: (_p, s) => [Math.max(0, ...s.map(x => x.tasks?.filter(t => t.completed).length || 0)), 40] },
  { name: '750 Hours', description: 'Reach 750 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 45000] },
  { name: 'Half a Year', description: 'Maintain a 180-day streak.', progress: (p, _s) => [getStreak(p), 180] },
  { name: '1,500 Tasks', description: 'Complete 1,500 tasks total.', progress: (p, _s) => [getTasks(p), 1500] },
  { name: 'Level 60', description: 'Reach Level 60.', progress: (p, _s) => [p.level || 1, 60] },
  { name: 'Deep Work D', description: 'Complete 500 deep sessions (60m+).', progress: (_p, s) => [getDeepSessions(s), 500] },
  { name: '1,000 Hours', description: 'Reach 1,000 hours of total focus.', progress: (p, _s) => [getFocusMinutes(p), 60000] },
  { name: 'A Year of Discipline', description: 'Maintain a 365-day streak.', progress: (p, _s) => [getStreak(p), 365] },
]);

export const ACHIEVEMENTS = achievements;
