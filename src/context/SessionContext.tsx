import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { db } from "../lib/firebase";
import { auth } from "../lib/firebase";

export type TimerMode = "pomodoro" | "regular";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  focusTime: number;
};

export type Session = {
  id: string;
  name: string;
  timerMode: TimerMode;
  tasks: Task[];
  status: "active" | "completed";
  createdAt: number;
  totalFocusTime: number;
  completedPomodoros: number;
  isStrict?: boolean;
  report?: { earnedAP: number; earnedXP: number };
};

type SessionContextType = {
  sessions: Session[];
  loading: boolean;
  createSession: (
    name: string,
    timerMode: TimerMode,
    isStrict?: boolean
  ) => Promise<Session>;
  updateSession: (
    id: string,
    updates: Partial<Session>
  ) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  getSession: (id: string) => Session | undefined;
};

const SessionContext =
  createContext<SessionContextType | null>(null);

export function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous snapshot listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const sessionsRef = collection(db, 'users', user.uid, 'sessions');

      unsubscribeSnapshot = onSnapshot(
        sessionsRef,
        (snapshot) => {
          const loadedSessions: Session[] = snapshot.docs.map((document) => {
            const data = document.data();
            return {
              id: document.id,
              name: data.name,
              timerMode: data.timerMode,
              tasks: data.tasks ?? [],
              status: data.status ?? 'active',
              createdAt: data.createdAt ?? Date.now(),
              totalFocusTime: data.totalFocusTime ?? 0,
              completedPomodoros: data.completedPomodoros ?? 0,
              isStrict: data.isStrict ?? false,
              report: data.report,
            };
          });
          loadedSessions.sort((a, b) => b.createdAt - a.createdAt);
          setSessions(loadedSessions);
          setLoading(false);
        },
        (error) => {
          console.error('Failed to load sessions:', error);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const createSession = async (
    name: string,
    timerMode: TimerMode,
    isStrict: boolean = false
  ) => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User is not authenticated.");
    }

    const sessionData = {
      name,
      timerMode,
      tasks: [],
      status: "active" as const,
      createdAt: Date.now(),
      totalFocusTime: 0,
      completedPomodoros: 0,
      isStrict,
    };

    const sessionsRef = collection(
      db,
      "users",
      user.uid,
      "sessions"
    );

    const document = await addDoc(
      sessionsRef,
      sessionData
    );

    return {
      id: document.id,
      ...sessionData,
    };
  };

  const updateSession = async (
    id: string,
    updates: Partial<Session>
  ) => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User is not authenticated.");
    }

    const sessionRef = doc(
      db,
      "users",
      user.uid,
      "sessions",
      id
    );

    const { id: _, ...data } = updates;

    await updateDoc(sessionRef, data);
  };

  const deleteSession = async (id: string) => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User is not authenticated.");
    }

    const sessionRef = doc(
      db,
      "users",
      user.uid,
      "sessions",
      id
    );

    await deleteDoc(sessionRef);
  };

  const getSession = (id: string) => {
    return sessions.find(
      (session) => session.id === id
    );
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        loading,
        createSession,
        updateSession,
        deleteSession,
        getSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessions() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error(
      "useSessions must be used inside SessionProvider"
    );
  }

  return context;
}