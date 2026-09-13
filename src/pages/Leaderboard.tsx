import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs, where, getCountFromServer } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';
import { db } from '../lib/firebase';
import { useUser, type UserProfile } from '../context/UserContext';
import PageTransition from '../components/PageTransition';

type Tab = 'all-time' | 'weekly';

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('all-time');
  const [top3, setTop3] = useState<UserProfile[]>([]);
  const [roster, setRoster] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Personal HUD state
  const [myRank, setMyRank] = useState<number | null>(null);
  const [gapToNext, setGapToNext] = useState<number | null>(null);

  const { profile } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const metric = tab === 'all-time' ? 'totalFocusMinutes' : 'weeklyFocusMinutes';
        const usersRef = collection(db, 'users');
        
        const q = query(
          usersRef,
          orderBy(metric, 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        const fetchedUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
        
        setTop3(fetchedUsers.slice(0, 3));
        setRoster(fetchedUsers.slice(3));

        // Calculate personal rank HUD if logged in
        if (profile) {
          const myScore = tab === 'all-time' ? (profile.totalFocusMinutes || 0) : (profile.weeklyFocusMinutes || 0);
          
          const idxInTop50 = fetchedUsers.findIndex(u => u.uid === profile.uid);
          
          if (idxInTop50 !== -1) {
            setMyRank(idxInTop50 + 1);
            if (idxInTop50 > 0) {
               const personAbove = fetchedUsers[idxInTop50 - 1];
               const personAboveScore = tab === 'all-time' ? (personAbove.totalFocusMinutes || 0) : (personAbove.weeklyFocusMinutes || 0);
               setGapToNext(personAboveScore - myScore);
            } else {
               setGapToNext(0); // Rank 1
            }
          } else {
            // Find exact rank globally
            const qRank = query(usersRef, where(metric, '>', myScore));
            const countSnap = await getCountFromServer(qRank);
            const exactRank = countSnap.data().count + 1;
            setMyRank(exactRank);

            // Find gap by fetching the lowest score that is strictly greater than mine
            const qAbove = query(usersRef, where(metric, '>', myScore), orderBy(metric, 'asc'), limit(1));
            const aboveSnap = await getDocs(qAbove);
            if (!aboveSnap.empty) {
               const personAboveData = aboveSnap.docs[0].data() as UserProfile;
               const personAboveScore = tab === 'all-time' ? (personAboveData.totalFocusMinutes || 0) : (personAboveData.weeklyFocusMinutes || 0);
               setGapToNext(personAboveScore - myScore);
            } else {
               setGapToNext(null);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [tab, profile?.uid, profile?.totalFocusMinutes, profile?.weeklyFocusMinutes]); // Added profile dependencies so it recalculates if my score changes

  // Helper to determine highest tier
  const getHighestTier = (u: UserProfile) => {
    const claimed = u.claimedAchievements || [];
    for (let i = 6; i >= 1; i--) {
      if (claimed.includes(`tier-${i}-mastery`)) return i;
    }
    return 0;
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans relative">
        <Sidebar />
        <main className="flex-1 md:ml-60 min-h-screen p-4 md:p-12 pb-32 pt-24 md:pt-12"> {/* pb-32 to account for fixed HUD */}
          <div className="max-w-5xl mx-auto">
            <header className="mb-12">
              <h1 className="text-4xl font-normal tracking-wide mb-2 uppercase">Leaderboard Arena</h1>
              <p className="text-sm text-[var(--text-secondary)] uppercase tracking-widest font-mono">
                Global Ascension Rankings
              </p>
            </header>

            <div className="flex space-x-6 md:space-x-8 mb-12 border-b border-[var(--border)] overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button
                onClick={() => setTab('all-time')}
                className={`pb-4 text-sm font-mono uppercase tracking-widest transition-colors ${
                  tab === 'all-time' 
                    ? 'text-white border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                All-Time Titans
              </button>
              <button
                onClick={() => setTab('weekly')}
                className={`pb-4 text-sm font-mono uppercase tracking-widest transition-colors flex items-center gap-2 ${
                  tab === 'weekly' 
                    ? 'text-white border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Weekly Grinders
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-600 font-mono text-sm tracking-widest uppercase animate-pulse">
                Accessing Global Database...
              </div>
            ) : top3.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 font-mono text-sm tracking-widest uppercase">
                No active ascenders found.
              </div>
            ) : (
              <>
                {/* VANGUARD PODIUM */}
                <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-16">
                  {/* Rank 2 */}
                  {top3[1] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      onClick={() => navigate(`/profile/${top3[1].uid}`)}
                      className="w-full md:w-1/3 border border-white/20 bg-zinc-900/40 p-6 flex flex-col items-center cursor-pointer hover:bg-white/5 transition-all hover:-translate-y-1"
                    >
                      <div className="text-zinc-500 font-mono text-lg mb-4">#02</div>
                      <div className="w-16 h-16 border border-white/10 bg-black flex items-center justify-center text-xl text-zinc-400 uppercase font-mono relative mb-4">
                        {top3[1].displayName ? top3[1].displayName.charAt(0) : '?'}
                        <div className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-black text-[9px] font-bold px-1 border border-black">
                          {top3[1].level || 1}
                        </div>
                      </div>
                      <div className="text-white font-medium text-lg text-center truncate w-full">{top3[1].displayName}</div>
                      <div className="text-[10px] font-mono tracking-widest text-[var(--accent)] uppercase mt-1 mb-6 text-center">
                        [ {top3[1].equipped?.title?.replace('title-', '')?.replace('-', ' ') || 'NOVICE'} ]
                      </div>
                      <div className="text-2xl font-mono text-zinc-300">
                        {tab === 'all-time' ? top3[1].totalFocusMinutes : top3[1].weeklyFocusMinutes} <span className="text-xs text-zinc-600">MIN</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Rank 1 */}
                  {top3[0] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                      onClick={() => navigate(`/profile/${top3[0].uid}`)}
                      className="w-full md:w-1/3 border-2 border-white bg-zinc-900/80 p-8 flex flex-col items-center shadow-[0_0_30px_rgba(255,255,255,0.1)] cursor-pointer hover:bg-white/10 transition-all hover:-translate-y-2 z-10"
                    >
                      <div className="text-white font-mono text-2xl font-bold mb-4 flex items-center gap-2">
                        👑 #01
                      </div>
                      <div className="w-20 h-20 border border-white bg-black flex items-center justify-center text-2xl text-white uppercase font-mono relative mb-4">
                        {top3[0].displayName ? top3[0].displayName.charAt(0) : '?'}
                        <div className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-black text-[10px] font-bold px-1.5 py-0.5 border border-black">
                          {top3[0].level || 1}
                        </div>
                      </div>
                      <div className="text-white font-bold text-xl text-center truncate w-full">{top3[0].displayName}</div>
                      <div className="text-xs font-mono tracking-widest text-[var(--accent)] uppercase mt-1 mb-6 text-center">
                        [ {top3[0].equipped?.title?.replace('title-', '')?.replace('-', ' ') || 'NOVICE'} ]
                      </div>
                      <div className="text-3xl font-mono text-white font-bold">
                        {tab === 'all-time' ? top3[0].totalFocusMinutes : top3[0].weeklyFocusMinutes} <span className="text-sm text-zinc-400 font-normal">MIN</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Rank 3 */}
                  {top3[2] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      onClick={() => navigate(`/profile/${top3[2].uid}`)}
                      className="w-full md:w-1/3 border border-white/10 bg-zinc-900/30 p-6 flex flex-col items-center cursor-pointer hover:bg-white/5 transition-all hover:-translate-y-1"
                    >
                      <div className="text-zinc-600 font-mono text-lg mb-4">#03</div>
                      <div className="w-16 h-16 border border-white/5 bg-black flex items-center justify-center text-xl text-zinc-500 uppercase font-mono relative mb-4">
                        {top3[2].displayName ? top3[2].displayName.charAt(0) : '?'}
                        <div className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-black text-[9px] font-bold px-1 border border-black">
                          {top3[2].level || 1}
                        </div>
                      </div>
                      <div className="text-zinc-300 font-medium text-lg text-center truncate w-full">{top3[2].displayName}</div>
                      <div className="text-[10px] font-mono tracking-widest text-[var(--accent)] uppercase mt-1 mb-6 text-center opacity-80">
                        [ {top3[2].equipped?.title?.replace('title-', '')?.replace('-', ' ') || 'NOVICE'} ]
                      </div>
                      <div className="text-2xl font-mono text-zinc-400">
                        {tab === 'all-time' ? top3[2].totalFocusMinutes : top3[2].weeklyFocusMinutes} <span className="text-xs text-zinc-600">MIN</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* THE CONTENDERS ROSTER */}
                {roster.length > 0 && (
                  <div className="border border-white/10 bg-zinc-900/30 p-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                          <th className="py-4 px-6 font-normal">Rank</th>
                          <th className="py-4 px-6 font-normal">Ascender</th>
                          <th className="py-4 px-6 font-normal hidden md:table-cell">Mastery</th>
                          <th className="py-4 px-6 font-normal text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map((u, i) => {
                          const isCurrentUser = profile?.uid === u.uid;
                          const equippedTitle = u.equipped?.title?.replace('title-', '')?.replace('-', ' ')?.toUpperCase() || 'NOVICE';
                          const highestTier = getHighestTier(u);
                          const actualRank = i + 4; // Roster starts at rank 4
                          
                          return (
                            <motion.tr 
                              key={u.uid}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.01 }}
                              onClick={() => navigate(`/profile/${u.uid}`)}
                              className={`border-b border-white/5 cursor-pointer last:border-0 hover:bg-white/5 transition-colors ${
                                isCurrentUser ? 'bg-white/5' : ''
                              }`}
                            >
                              <td className="py-4 px-6 text-zinc-500 font-mono text-sm tabular-nums">
                                {String(actualRank).padStart(2, '0')}
                              </td>
                              <td className="py-4 px-6 flex items-center gap-4">
                                <div className="w-10 h-10 border border-white/10 bg-black flex flex-col items-center justify-center text-xs text-zinc-400 uppercase font-mono relative">
                                  {u.displayName ? u.displayName.charAt(0) : '?'}
                                  <div className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-black text-[9px] font-bold px-1 border border-black">
                                    {u.level || 1}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col">
                                  <span className={`tracking-wide text-sm ${isCurrentUser ? 'text-[var(--accent)] font-medium' : 'text-zinc-200'}`}>
                                    {u.displayName || 'Unknown Ascender'}
                                  </span>
                                  <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5">
                                    [ {equippedTitle} ]
                                  </span>
                                </div>

                                {isCurrentUser && (
                                  <span className="ml-auto text-[10px] font-mono uppercase tracking-widest bg-white/10 px-2 py-0.5 text-white border border-white/20">
                                    YOU
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 hidden md:table-cell">
                                {highestTier > 0 ? (
                                  <span className="text-[10px] px-2 py-0.5 border border-zinc-600 text-zinc-400 font-mono tracking-widest uppercase">
                                    TIER {highestTier}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-700 font-mono tracking-widest uppercase">
                                    --
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right tabular-nums font-mono text-sm text-zinc-300">
                                {tab === 'all-time' ? u.totalFocusMinutes : u.weeklyFocusMinutes} <span className="text-[10px] text-zinc-600">MIN</span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* PINNED PERSONAL HUD OVERLAY */}
        <AnimatePresence>
          {profile && myRank !== null && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 md:left-60 right-0 border-t border-white/20 bg-black/90 backdrop-blur-md z-40 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">Global Rank</span>
                    <span className="font-mono text-2xl text-white">#{myRank}</span>
                  </div>
                  <div className="h-8 w-px bg-white/20 hidden md:block" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">Score ({tab})</span>
                    <span className="font-mono text-xl text-zinc-300">
                      {tab === 'all-time' ? (profile.totalFocusMinutes || 0) : (profile.weeklyFocusMinutes || 0)} <span className="text-xs text-zinc-600">MIN</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {myRank === 1 ? (
                    <div className="text-[10px] font-mono tracking-widest text-[var(--accent)] uppercase border border-[var(--accent)] px-3 py-1 bg-[var(--accent)]/10">
                      Apex Predator
                    </div>
                  ) : (
                    <div className="flex flex-col md:text-right">
                      <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">To Next Rank</span>
                      <span className="font-mono text-sm text-[var(--accent)]">
                        {gapToNext !== null ? `+${gapToNext + 1} MINS` : 'UNKNOWN'}
                      </span>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => navigate('/profile')}
                    className="ml-4 font-mono text-[10px] uppercase tracking-widest border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors"
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
