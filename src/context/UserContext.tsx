import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { generateDailyQuests, generateWeeklyContract, type DailyQuest, type WeeklyContract, QUEST_POOL } from '../lib/constants';
import { ACHIEVEMENTS, TIERS } from '../lib/achievements';
import type { Session } from './SessionContext';

export type UserProfile = {
  uid: string;
  displayName: string;
  bio?: string;
  photoURL: string;
  ap: number;
  xp: number;
  totalFocusMinutes: number;
  weeklyFocusMinutes: number;
  currentWeek: string;
  totalTasks: number;
  level: number;
  achievements: string[];
  claimedAchievements: string[];
  inventory: string[];
  equipped: { theme: string; sound: string; title: string; };
  lastActiveDate: string;
  currentStreak: number;
  streakShields: number;
  boosters: { [id: string]: number }; // e.g. { 'focus-elixir': 2, 'ap-booster': 0 }
  questRefreshDate: string;
  dailyQuests: DailyQuest[];
  weeklyContract?: WeeklyContract;
  cohorts: string[];
  isFocusing?: boolean;
};

type UserContextType = {
  profile: UserProfile | null;
  loading: boolean;
  awardSession: (minutes: number, tasks: number, sessions: Session[]) => Promise<{ earnedAP: number; earnedXP: number } | undefined>;
  purchaseItem: (id: string, cost: number, levelReq: number, type: 'title' | 'consumable' | 'theme' | 'sound') => Promise<boolean>;
  equipItem: (type: 'theme' | 'sound' | 'title', id: string) => Promise<void>;
  unequipItem: (type: 'theme' | 'sound' | 'title') => Promise<void>;
  claimAchievement: (id: string) => Promise<boolean>;
  claimTierMastery: (tierLevel: number) => Promise<boolean>;
  updateProfileDetails: (details: { displayName?: string; bio?: string }) => Promise<void>;
  rerollQuest: (questId: string) => Promise<boolean>;
  updateFocusStatus: (isFocusing: boolean) => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

function getWeekString(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

export function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
          let docExists = false;
          let docData: any = null;

          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              docExists = true;
              docData = docSnap.data();
            }
          } catch (e) {
            console.error("Firebase Auth Error: Failed to getDoc.", e);
          }
          
          const currentWeek = getWeekString(new Date());
          const today = getTodayString();

          if (!docExists) {
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'Ascender',
              photoURL: user.photoURL || '',
              ap: 0,
              xp: 0,
              totalFocusMinutes: 0,
              weeklyFocusMinutes: 0,
              currentWeek,
              totalTasks: 0,
              level: 1,
              achievements: [],
              claimedAchievements: [],
              inventory: ['theme-dark', 'sound-none', 'title-novice'],
              equipped: {
                theme: 'theme-dark',
                sound: 'sound-none',
                title: 'title-novice'
              },
              lastActiveDate: today,
              currentStreak: 0,
              streakShields: 0,
              boosters: {},
              questRefreshDate: today,
              dailyQuests: generateDailyQuests(),
              weeklyContract: generateWeeklyContract(),
              cohorts: [],
              isFocusing: false
            };
            try {
              await setDoc(docRef, newProfile);
            } catch (e) {
              console.error("Firebase Auth Error: Failed to setDoc new profile.", e);
            }
          } else if (docData) {
            const data = docData as UserProfile;
            const updates: any = {};
            
            if (!data.cohorts) updates.cohorts = [];
            if (data.isFocusing === undefined) updates.isFocusing = false;
            
            if (data.currentWeek !== currentWeek) {
              updates.weeklyFocusMinutes = 0;
              updates.currentWeek = currentWeek;
              updates.weeklyContract = generateWeeklyContract(); // Reset weekly contract
            } else if (!data.weeklyContract) {
              updates.weeklyContract = generateWeeklyContract(); // Polyfill for existing users
            }
            
            if (data.questRefreshDate !== today) {
              updates.questRefreshDate = today;
              updates.dailyQuests = generateDailyQuests();
            }

            if (!data.boosters) {
              updates.boosters = {}; // Polyfill
            }

            if (Object.keys(updates).length > 0) {
              try {
                await updateDoc(docRef, updates);
              } catch (e) {
                console.error("Firebase Auth Error: Failed to updateDoc existing profile.", e);
              }
            }
          }

        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              ...data,
              uid: user.uid,
              achievements: data.achievements || [],
              inventory: data.inventory || ['title-novice'],
              dailyQuests: data.dailyQuests || [],
              streakShields: data.streakShields || 0,
              boosters: data.boosters || {},
              weeklyContract: data.weeklyContract || undefined,
              cohorts: data.cohorts || [],
              isFocusing: data.isFocusing || false,
              equipped: data.equipped || { theme: 'dark', sound: 'default', title: 'title-novice' }
            } as UserProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firebase Auth Error: onSnapshot failed for user profile.", error);
        });

        return () => {
          unsubscribeSnapshot();
        };
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const awardSession = async (minutes: number, tasks: number, sessions: Session[]) => {
    if (!profile) return undefined;

    const today = getTodayString();
    let newStreak = profile.currentStreak || 0;
    let newStreakShields = profile.streakShields || 0;
    
    if (profile.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      if (profile.lastActiveDate === yesterdayString) {
        newStreak += 1;
      } else if (profile.lastActiveDate) {
        // They missed a day. Check for shield.
        if (newStreakShields > 0) {
          newStreakShields -= 1;
          newStreak += 1; // Count today!
          console.log("🛡️ Streak Shield consumed! Streak protected.");
        } else {
          newStreak = 1; // missed a day and no shields
        }
      } else {
        newStreak = 1; // first session ever
      }
    } else if (newStreak === 0) {
      // Self-heal invalid state where date was updated without streak
      newStreak = 1;
    }

    // BOOSTER MATH
    let apMultiplier = 1.0;
    let xpMultiplier = 1.0;
    const newBoosters = { ...(profile.boosters || {}) };
    
    // Check for streak multipliers first
    if (newStreak >= 30) apMultiplier = 2.0;
    else if (newStreak >= 14) apMultiplier = 1.5;
    else if (newStreak >= 7) apMultiplier = 1.2;

    // Apply & Consume Active Boosters
    if (newBoosters['ap-booster'] && newBoosters['ap-booster'] > 0) {
      apMultiplier *= 2.0;
      newBoosters['ap-booster'] -= 1;
    }
    if (newBoosters['focus-elixir'] && newBoosters['focus-elixir'] > 0) {
      xpMultiplier *= 2.0;
      newBoosters['focus-elixir'] -= 1;
    }

    const baseEarned = (minutes * 10) + (tasks * 50);
    const totalAP = Math.floor(baseEarned * apMultiplier);
    
    // XP uses multiplied value now if Elixir is active
    const xpEarned = Math.floor(baseEarned * xpMultiplier);
    const newTotalXP = (profile.xp || 0) + xpEarned;
    
    // Progressive Level Formula: Level = floor(sqrt(XP / 100)) + 1
    const newLevel = Math.floor(Math.sqrt(newTotalXP / 100)) + 1;

    const newTotalMin = (profile.totalFocusMinutes || 0) + minutes;
    const newTotalTasks = (profile.totalTasks || 0) + tasks;

    // Quests Evaluation
    let extraAP = 0;
    let extraXP = 0;
    const currentHour = new Date().getHours();
    
    const updatedQuests = (profile.dailyQuests || []).map(q => {
      if (q.completed) return q;
      
      let progressAmount = 0;
      if (q.type === 'focus_time') progressAmount = minutes;
      else if (q.type === 'tasks_completed') progressAmount = tasks;
      else if (q.type === 'dawn_patrol' && currentHour < 9) progressAmount = 1;
      else if (q.type === 'night_owl' && currentHour >= 22) progressAmount = 1;
      else if (q.type === 'deep_work' && minutes >= 90) progressAmount = 1;

      const newProgress = Math.min(q.progress + progressAmount, q.target);
      if (newProgress >= q.target) {
        extraAP += q.reward;
        return { ...q, progress: newProgress, completed: true };
      }
      return { ...q, progress: newProgress };
    });

    // Perfection Bonus
    const previouslyCompletedQuests = (profile.dailyQuests || []).filter(q => q.completed).length;
    const newlyCompletedQuests = updatedQuests.filter(q => q.completed).length;
    if (previouslyCompletedQuests < 3 && newlyCompletedQuests === 3) {
      extraAP += 50; // Perfection Bonus
    }

    // Weekly Contract Evaluation
    let updatedWeeklyContract = profile.weeklyContract;
    if (updatedWeeklyContract && !updatedWeeklyContract.completed) {
      let contractProgressAmount = 0;
      if (updatedWeeklyContract.type === 'focus_time') contractProgressAmount = minutes;
      else if (updatedWeeklyContract.type === 'tasks_completed') contractProgressAmount = tasks;

      const newContractProgress = Math.min(updatedWeeklyContract.progress + contractProgressAmount, updatedWeeklyContract.target);
      if (newContractProgress >= updatedWeeklyContract.target) {
        extraAP += updatedWeeklyContract.reward;
        extraXP += updatedWeeklyContract.rewardXP;
        updatedWeeklyContract = { ...updatedWeeklyContract, progress: newContractProgress, completed: true };
      } else {
        updatedWeeklyContract = { ...updatedWeeklyContract, progress: newContractProgress };
      }
    }

    // Create a temporary projected profile to check achievements accurately
    const projectedProfile = {
      ...profile,
      totalFocusMinutes: newTotalMin,
      totalTasks: newTotalTasks,
      currentStreak: newStreak,
      level: newLevel,
      xp: newTotalXP
    };

    // Achievements
    const newAchievements = [...(profile.achievements || [])];
    
    ACHIEVEMENTS.forEach(ach => {
      if (!newAchievements.includes(ach.id)) {
        const [curr, target] = ach.progress(projectedProfile, sessions);
        if (curr >= target) {
          newAchievements.push(ach.id);
        }
      }
    });

    const finalAP = totalAP + extraAP;

    const finalXP = newTotalXP + extraXP;
    const finalLevel = Math.floor(Math.sqrt(finalXP / 100)) + 1;

    await updateDoc(doc(db, 'users', profile.uid), {
      ap: increment(finalAP),
      xp: finalXP,
      totalFocusMinutes: increment(minutes),
      weeklyFocusMinutes: increment(minutes),
      totalTasks: increment(tasks),
      level: finalLevel,
      achievements: newAchievements,
      lastActiveDate: today,
      currentStreak: newStreak,
      streakShields: newStreakShields,
      dailyQuests: updatedQuests,
      weeklyContract: updatedWeeklyContract,
      boosters: newBoosters
    });

    return { earnedAP: finalAP, earnedXP: xpEarned + extraXP };
  };

  const claimAchievement = async (id: string) => {
    if (!profile) return false;
    
    // Validate it's not already claimed
    if (profile.claimedAchievements?.includes(id)) return false;
    
    // Validate it's unlocked
    if (!profile.achievements?.includes(id)) return false;

    // Find the achievement
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return false;

    const newClaimed = [...(profile.claimedAchievements || []), id];
    
    await updateDoc(doc(db, 'users', profile.uid), {
      ap: increment(ach.apReward),
      claimedAchievements: newClaimed
    });

    return true;
  };

  const claimTierMastery = async (tierLevel: number) => {
    if (!profile) return false;
    
    const capstoneId = `tier-${tierLevel}-mastery`;
    if (profile.claimedAchievements?.includes(capstoneId)) return false;
    
    // Validate all achievements in the tier are unlocked
    const tierAchs = ACHIEVEMENTS.filter(a => a.tier === tierLevel);
    const allUnlocked = tierAchs.every(a => profile.achievements?.includes(a.id));
    if (!allUnlocked) return false;

    const tierDef = TIERS.find(t => t.level === tierLevel);
    if (!tierDef) return false;

    const newClaimed = [...(profile.claimedAchievements || []), capstoneId];
    
    await updateDoc(doc(db, 'users', profile.uid), {
      ap: increment(tierDef.capstoneReward),
      claimedAchievements: newClaimed
    });

    return true;
  };

  const purchaseItem = async (id: string, cost: number, levelReq: number, type: 'title' | 'consumable' | 'theme' | 'sound') => {
    if (!profile) return false;
    if (profile.level < levelReq || profile.ap < cost) return false;

    try {
      const updates: any = { ap: increment(-cost) };
      
      if (type === 'consumable') {
        if (id === 'streak-shield') {
          if (profile.streakShields >= 3) return false; // MAX
          updates.streakShields = increment(1);
        } else {
          // It's a booster (focus-elixir, ap-booster)
          const currentBoosters = profile.boosters || {};
          updates.boosters = {
            ...currentBoosters,
            [id]: (currentBoosters[id] || 0) + 1
          };
        }
      } else {
        if (profile.inventory.includes(id)) return false;
        updates.inventory = [...profile.inventory, id];
      }
      
      await updateDoc(doc(db, 'users', profile.uid), updates);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const equipItem = async (type: 'theme' | 'sound' | 'title', id: string) => {
    if (!profile) return;
    const isFreeOrBase = id === 'dark' || id === 'title-novice' || id === 'sound-default';
    if (!isFreeOrBase && !(profile.inventory || []).includes(id)) return;
    
    await updateDoc(doc(db, 'users', profile.uid), {
      [`equipped.${type}`]: id
    });
  };

  const unequipItem = async (type: 'theme' | 'sound' | 'title') => {
    if (!profile) return;
    await updateDoc(doc(db, 'users', profile.uid), {
      [`equipped.${type}`]: ''
    });
  };

  const updateProfileDetails = async (details: { displayName?: string; bio?: string }) => {
    if (!profile) return;
    const updates: any = {};
    if (details.displayName !== undefined) updates.displayName = details.displayName;
    if (details.bio !== undefined) updates.bio = details.bio;
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'users', profile.uid), updates);
    }
  };

  const rerollQuest = async (questId: string) => {
    if (!profile || profile.ap < 25) return false;
    
    const questIndex = profile.dailyQuests.findIndex(q => q.id === questId);
    if (questIndex === -1 || profile.dailyQuests[questIndex].completed) return false;

    // Pick a new quest not currently active
    const activeIds = profile.dailyQuests.map(q => q.id);
    const availableQuests = QUEST_POOL.filter(q => !activeIds.includes(q.id));
    if (availableQuests.length === 0) return false;

    const newQuestDef = availableQuests[Math.floor(Math.random() * availableQuests.length)];
    const newQuest: DailyQuest = { ...newQuestDef, progress: 0, completed: false };

    const newQuests = [...profile.dailyQuests];
    newQuests[questIndex] = newQuest;

    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        ap: increment(-25),
        dailyQuests: newQuests
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateFocusStatus = useCallback(async (isFocusing: boolean) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { isFocusing });
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <UserContext.Provider value={{ profile, loading, awardSession, purchaseItem, equipItem, unequipItem, claimAchievement, claimTierMastery, updateProfileDetails, rerollQuest, updateFocusStatus }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
