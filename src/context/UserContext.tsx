import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ACHIEVEMENTS, generateDailyQuests, type DailyQuest } from '../lib/constants';

export type UserProfile = {
  uid: string;
  displayName: string;
  photoURL: string;
  ap: number;
  xp: number;
  totalFocusMinutes: number;
  weeklyFocusMinutes: number;
  currentWeek: string;
  totalTasks: number;
  level: number;
  achievements: string[];
  inventory: string[];
  equipped: { theme: string; sound: string; title: string; };
  lastActiveDate: string;
  currentStreak: number;
  questRefreshDate: string;
  dailyQuests: DailyQuest[];
};

type UserContextType = {
  profile: UserProfile | null;
  loading: boolean;
  awardSession: (minutes: number, tasks: number) => Promise<{ earnedAP: number; earnedXP: number } | undefined>;
  purchaseItem: (id: string, cost: number, levelReq: number) => Promise<boolean>;
  equipItem: (type: 'theme' | 'sound' | 'title', id: string) => Promise<void>;
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
            const snapshot = await getDoc(docRef);
            docExists = snapshot.exists();
            if (docExists) docData = snapshot.data();
          } catch (e) {
            console.error("Firebase Auth Error: Failed to getDoc for user profile. Check Firestore Rules for /users/{uid}", e);
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
              currentWeek: currentWeek,
              totalTasks: 0,
              level: 1,
              achievements: [],
              inventory: ['theme-dark', 'theme-light', 'sound-default', 'title-none'],
              equipped: { theme: 'dark', sound: 'default', title: 'none' },
              lastActiveDate: '',
              currentStreak: 0,
              questRefreshDate: today,
              dailyQuests: generateDailyQuests()
            };
            try {
              await setDoc(docRef, newProfile);
            } catch (e) {
              console.error("Firebase Auth Error: Failed to setDoc new profile.", e);
            }
          } else if (docData) {
            const data = docData as UserProfile;
            const updates: any = {};
            
            if (data.currentWeek !== currentWeek) {
              updates.weeklyFocusMinutes = 0;
              updates.currentWeek = currentWeek;
            }
            
            if (data.questRefreshDate !== today) {
              updates.questRefreshDate = today;
              updates.dailyQuests = generateDailyQuests();
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
              setProfile({ ...docSnap.data(), uid: user.uid } as UserProfile);
            }
            setLoading(false);
          }, (error) => {
            console.error("Firebase Auth Error: onSnapshot failed for user profile.", error);
          });

        return () => unsubscribeSnapshot();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const awardSession = async (minutes: number, tasks: number) => {
    if (!profile) return undefined;

    const today = getTodayString();
    let newStreak = profile.currentStreak || 0;
    
    if (profile.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      if (profile.lastActiveDate === yesterdayString) {
        newStreak += 1;
      } else {
        newStreak = 1; // missed a day or first session
      }
    } else if (newStreak === 0) {
      // Self-heal invalid state where date was updated without streak
      newStreak = 1;
    }

    // MULTIPLIER MATH
    let multiplier = 1.0;
    if (newStreak >= 30) multiplier = 2.0;
    else if (newStreak >= 14) multiplier = 1.5;
    else if (newStreak >= 7) multiplier = 1.2;

    const baseEarned = (minutes * 10) + (tasks * 50);
    const totalAP = Math.floor(baseEarned * multiplier);
    
    // XP uses raw un-multiplied value so leveling remains balanced
    const xpEarned = baseEarned;
    const newTotalXP = (profile.xp || 0) + xpEarned;
    
    // Progressive Level Formula: Level = floor(sqrt(XP / 100)) + 1
    const newLevel = Math.floor(Math.sqrt(newTotalXP / 100)) + 1;

    const newTotalMin = (profile.totalFocusMinutes || 0) + minutes;
    const newTotalTasks = (profile.totalTasks || 0) + tasks;

    // Quests
    let extraAP = 0;
    const updatedQuests = (profile.dailyQuests || []).map(q => {
      if (q.completed) return q;
      let newProgress = q.progress;
      if (q.type === 'focus_time') newProgress += minutes;
      if (q.type === 'tasks_completed') newProgress += tasks;
      
      if (newProgress >= q.target) {
        extraAP += q.reward; 
        return { ...q, progress: q.target, completed: true };
      }
      return { ...q, progress: newProgress };
    });

    // Achievements
    const newAchievements = [...(profile.achievements || [])];
    ACHIEVEMENTS.forEach(ach => {
      if (!newAchievements.includes(ach.id) && ach.condition({ totalFocusMinutes: newTotalMin, totalTasks: newTotalTasks })) {
        newAchievements.push(ach.id);
      }
    });

    const finalAP = totalAP + extraAP;

    await updateDoc(doc(db, 'users', profile.uid), {
      ap: increment(finalAP),
      xp: newTotalXP,
      totalFocusMinutes: increment(minutes),
      weeklyFocusMinutes: increment(minutes),
      totalTasks: increment(tasks),
      level: newLevel,
      achievements: newAchievements,
      lastActiveDate: today,
      currentStreak: newStreak,
      dailyQuests: updatedQuests
    });

    return { earnedAP: finalAP, earnedXP: xpEarned };
  };

  const purchaseItem = async (id: string, cost: number, levelReq: number) => {
    if (!profile) return false;
    if ((profile.level || 1) < levelReq) return false;
    if ((profile.ap || 0) < cost) return false;
    if ((profile.inventory || []).includes(id)) return false;

    await updateDoc(doc(db, 'users', profile.uid), {
      ap: increment(-cost),
      inventory: [...(profile.inventory || []), id]
    });
    return true;
  };

  const equipItem = async (type: 'theme' | 'sound' | 'title', id: string) => {
    if (!profile || !(profile.inventory || []).includes(id)) return;
    
    await updateDoc(doc(db, 'users', profile.uid), {
      [`equipped.${type}`]: id
    });
  };

  return (
    <UserContext.Provider value={{ profile, loading, awardSession, purchaseItem, equipItem }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
