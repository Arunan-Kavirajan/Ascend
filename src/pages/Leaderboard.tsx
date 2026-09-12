import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';
import { db } from '../lib/firebase';
import { useUser, type UserProfile } from '../context/UserContext';

type Tab = 'all-time' | 'weekly';

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('all-time');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useUser();

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy(tab === 'all-time' ? 'totalFocusMinutes' : 'weeklyFocusMinutes', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const fetchedUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [tab]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <Sidebar />
      <motion.main 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="ml-72 min-h-screen p-12"
      >
        <div className="max-w-5xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-normal tracking-wide mb-2">Leaderboard</h1>
            <p className="text-sm text-[var(--text-secondary)] uppercase tracking-widest">
              Global Rankings
            </p>
          </header>

          <div className="flex space-x-8 mb-8 border-b border-[var(--border)]">
            <button
              onClick={() => setTab('all-time')}
              className={`pb-4 text-sm uppercase tracking-widest transition-colors ${
                tab === 'all-time' 
                  ? 'text-[var(--accent-indigo)] border-b-2 border-[var(--accent-indigo)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All-Time
            </button>
            <button
              onClick={() => setTab('weekly')}
              className={`pb-4 text-sm uppercase tracking-widest transition-colors ${
                tab === 'weekly' 
                  ? 'text-[var(--accent-indigo)] border-b-2 border-[var(--accent-indigo)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Weekly
            </button>
          </div>

          <div className="bg-[var(--surface-1)] border border-[var(--border)] p-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="py-4 px-6 font-normal">Rank</th>
                  <th className="py-4 px-6 font-normal">Name</th>
                  <th className="py-4 px-6 font-normal">Level</th>
                  <th className="py-4 px-6 font-normal text-right">Focus Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[var(--text-muted)] text-sm tracking-widest uppercase">
                      Loading Rankings...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[var(--text-muted)] text-sm tracking-widest uppercase">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => {
                    const isCurrentUser = profile?.uid === u.uid;
                    return (
                      <motion.tr 
                        key={u.uid}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors ${
                          isCurrentUser ? 'bg-[var(--surface-2)]' : ''
                        }`}
                      >
                        <td className="py-4 px-6 text-[var(--text-secondary)] tabular-nums font-medium">
                          #{i + 1}
                        </td>
                        <td className="py-4 px-6 font-medium flex items-center gap-4">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border border-[var(--border)] object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-muted)] uppercase">
                              {u.displayName ? u.displayName.charAt(0) : '?'}
                            </div>
                          )}
                          <span className={isCurrentUser ? 'text-[var(--accent-indigo)] font-semibold' : 'text-[var(--text-primary)]'}>
                            {u.displayName || 'Unknown User'}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] uppercase tracking-widest bg-[var(--surface-3)] px-2 py-0.5 text-[var(--text-secondary)] border border-[var(--border)] rounded-sm">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-[var(--text-secondary)] tabular-nums">
                          Lvl {u.level || 1}
                        </td>
                        <td className="py-4 px-6 text-right tabular-nums text-[var(--text-primary)]">
                          {tab === 'all-time' ? u.totalFocusMinutes : u.weeklyFocusMinutes} m
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
