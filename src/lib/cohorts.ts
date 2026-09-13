import { collection, doc, setDoc, updateDoc, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export type Cohort = {
  id: string;
  name: string;
  inviteCode: string;
  hostUid: string;
  members: string[]; // UIDs
  createdAt: string;
  weeklyGoalMinutes?: number;
};

// Generate a random 6-character alphanumeric code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createCohort(hostUid: string, name: string, weeklyGoalMinutes?: number): Promise<Cohort | null> {
  try {
    const inviteCode = generateInviteCode();
    // We use the invite code as the document ID for easy querying, or a generic UID.
    // Let's use a standard doc reference, but store inviteCode inside.
    const cohortRef = doc(collection(db, 'cohorts'));
    
    const newCohort: Cohort = {
      id: cohortRef.id,
      name,
      inviteCode,
      hostUid,
      members: [hostUid],
      createdAt: new Date().toISOString(),
      weeklyGoalMinutes: weeklyGoalMinutes || 1000 // default to ~16 hours
    };

    await setDoc(cohortRef, newCohort);
    
    // Also add to user's profile
    const userRef = doc(db, 'users', hostUid);
    await updateDoc(userRef, {
      cohorts: arrayUnion(cohortRef.id)
    });

    return newCohort;
  } catch (error) {
    console.error("Error creating cohort:", error);
    return null;
  }
}

export async function joinCohort(userId: string, inviteCode: string): Promise<Cohort | null> {
  try {
    // Find cohort by invite code
    const q = query(collection(db, 'cohorts'), where('inviteCode', '==', inviteCode.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error("Cohort not found");
    }

    const cohortDoc = snapshot.docs[0];
    const cohort = cohortDoc.data() as Cohort;

    if (cohort.members.includes(userId)) {
      return cohort; // Already joined
    }

    if (cohort.members.length >= 30) {
      throw new Error("Cohort is full (Max 30 members)");
    }

    // Add user to cohort
    await updateDoc(cohortDoc.ref, {
      members: arrayUnion(userId)
    });

    // Add cohort to user profile
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      cohorts: arrayUnion(cohort.id)
    });

    return { ...cohort, members: [...cohort.members, userId] };
  } catch (error) {
    console.error("Error joining cohort:", error);
    throw error;
  }
}

export async function getCohortsForUser(cohortIds: string[]): Promise<Cohort[]> {
  if (!cohortIds || cohortIds.length === 0) return [];
  
  try {
    // Firestore 'in' query limit is 30, which is fine since users probably won't be in 30 cohorts.
    // But if they are, we'd need to chunk it. For now, simple query.
    // If cohortIds is > 30, slice it.
    const safeIds = cohortIds.slice(0, 30);
    const q = query(collection(db, 'cohorts'), where('id', 'in', safeIds));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data() as Cohort);
  } catch (error) {
    console.error("Error fetching user cohorts:", error);
    return [];
  }
}
