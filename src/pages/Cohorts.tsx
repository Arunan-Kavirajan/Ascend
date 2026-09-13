import { useState, useEffect, useMemo } from 'react';

import { collection, query, where, getDocs } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition';
import { useUser, type UserProfile } from '../context/UserContext';
import { db } from '../lib/firebase';
import { getCohortsForUser, createCohort, joinCohort, type Cohort } from '../lib/cohorts';

export default function Cohorts() {
  const { profile } = useUser();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const loadCohorts = async () => {
    if (!profile || !profile.cohorts || profile.cohorts.length === 0) {
      setCohorts([]);
      setSelectedCohort(null);
      setLoading(false);
      return;
    }
    const fetched = await getCohortsForUser(profile.cohorts);
    setCohorts(fetched);
    if (fetched.length > 0 && !selectedCohort) {
      setSelectedCohort(fetched[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCohorts();
  }, [profile?.cohorts]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedCohort || selectedCohort.members.length === 0) {
        setMembers([]);
        return;
      }
      try {
        const q = query(collection(db, 'users'), where('uid', 'in', selectedCohort.members));
        const snap = await getDocs(q);
        const fetchedUsers = snap.docs.map(d => d.data() as UserProfile);
        
        // Sort by total focus time (or weekly if we wanted to toggle)
        fetchedUsers.sort((a, b) => (b.totalFocusMinutes || 0) - (a.totalFocusMinutes || 0));
        
        setMembers(fetchedUsers);
      } catch (e) {
        console.error("Failed to fetch cohort members", e);
      }
    };
    fetchMembers();
  }, [selectedCohort]);

  const handleCreate = async () => {
    if (!profile || !createName.trim()) return;
    const newCohort = await createCohort(profile.uid, createName.trim());
    if (newCohort) {
      setShowCreate(false);
      setCreateName("");
      // Profile listener will naturally update `profile.cohorts`, triggering a reload.
      // But we can eagerly set it:
      setCohorts(prev => [...prev, newCohort]);
      setSelectedCohort(newCohort);
    }
  };

  const handleJoin = async () => {
    if (!profile || !joinCode.trim()) return;
    setJoinError("");
    try {
      const joined = await joinCohort(profile.uid, joinCode.trim());
      if (joined) {
        setShowJoin(false);
        setJoinCode("");
        setCohorts(prev => [...prev.filter(c => c.id !== joined.id), joined]);
        setSelectedCohort(joined);
      }
    } catch (e: any) {
      setJoinError(e.message || "Failed to join cohort");
    }
  };

  const totalCohortFocus = useMemo(() => {
    return members.reduce((sum, member) => sum + (member.weeklyFocusMinutes || 0), 0);
  }, [members]);

  const copyInvite = () => {
    if (selectedCohort) {
      navigator.clipboard.writeText(selectedCohort.inviteCode);
      // Could show a toast here
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
        <Sidebar />
        
        <main className="flex-1 ml-64 p-12 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end border-b border-[var(--border)] pb-8 mb-12">
              <div>
                <h1 className="font-mono text-4xl tracking-tight mb-2 uppercase">Cohorts</h1>
                <p className="text-sm text-[var(--text-secondary)] font-mono uppercase tracking-widest">
                  Private Syndicates & Internal Lobbies
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowJoin(true)}
                  className="font-mono text-xs uppercase tracking-widest px-6 py-2 border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-white transition-colors"
                >
                  Join via Code
                </button>
                <button 
                  onClick={() => setShowCreate(true)}
                  className="font-mono text-xs uppercase tracking-widest px-6 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity"
                >
                  Found a Cohort
                </button>
              </div>
            </div>

            {loading ? (
              <div className="font-mono text-[var(--text-muted)] animate-pulse">Syncing Cohort Network...</div>
            ) : cohorts.length === 0 ? (
              <div className="border border-[var(--border)] p-12 text-center bg-[var(--surface-1)]">
                <p className="font-mono text-[var(--text-muted)] mb-6">You are not a member of any Cohorts.</p>
                <div className="flex justify-center gap-4">
                  <button onClick={() => setShowJoin(true)} className="font-mono text-sm px-6 py-2 border border-[var(--border)] hover:bg-white hover:text-black transition-colors">Join Existing</button>
                  <button onClick={() => setShowCreate(true)} className="font-mono text-sm px-6 py-2 border border-[var(--border)] hover:bg-white hover:text-black transition-colors">Create New</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-12 flex-col xl:flex-row">
                
                {/* Cohort Selector (Left Sidebar) */}
                <div className="w-full xl:w-64 shrink-0 flex flex-col gap-2">
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-[var(--text-muted)] mb-4">Your Cohorts</h3>
                  {cohorts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCohort(c)}
                      className={`p-4 text-left border transition-colors ${selectedCohort?.id === c.id ? 'border-[var(--text-primary)] bg-[var(--surface-1)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'}`}
                    >
                      <p className={`font-mono truncate ${selectedCohort?.id === c.id ? 'text-[var(--text-primary)]' : ''}`}>{c.name}</p>
                      <p className="text-[10px] font-mono tracking-widest mt-1 uppercase">{c.members.length} / 30 Members</p>
                    </button>
                  ))}
                </div>

                {/* Selected Cohort Main View */}
                {selectedCohort && (
                  <div className="flex-1">
                    <div className="mb-8 flex justify-between items-start">
                      <div>
                        <h2 className="text-3xl font-mono mb-2">{selectedCohort.name}</h2>
                        <div className="flex items-center gap-4">
                          <p className="text-sm font-mono text-[var(--text-secondary)] tracking-widest">INVITE CODE:</p>
                          <button onClick={copyInvite} className="group flex items-center gap-2 border border-[var(--border)] px-3 py-1 bg-[var(--surface-1)] hover:border-white transition-colors">
                            <span className="font-mono font-bold tracking-widest">{selectedCohort.inviteCode}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] group-hover:text-white"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Weekly Bounty */}
                      {selectedCohort.weeklyGoalMinutes && (
                        <div className="border border-[var(--border)] p-4 w-64 bg-[var(--surface-1)] relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-1 bg-[var(--accent)] transition-all" style={{ width: `${Math.min(100, (totalCohortFocus / selectedCohort.weeklyGoalMinutes) * 100)}%` }} />
                          <p className="text-[10px] font-mono tracking-widest text-[var(--accent)] mb-1">[ WEEKLY BOUNTY ]</p>
                          <div className="font-mono text-sm">
                            {Math.floor(totalCohortFocus / 60)}h / {Math.floor(selectedCohort.weeklyGoalMinutes / 60)}h
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Internal Leaderboard */}
                    <div className="border border-[var(--border)] bg-[var(--surface-1)]">
                      <div className="grid grid-cols-[60px_1fr_120px_140px] gap-4 p-4 border-b border-[var(--border)] text-xs font-mono uppercase tracking-widest text-[var(--text-muted)]">
                        <div className="text-center">Rank</div>
                        <div>Operative</div>
                        <div className="text-right">Level</div>
                        <div className="text-right">Total Focus</div>
                      </div>
                      
                      {members.map((member, idx) => (
                        <div key={member.uid} className="grid grid-cols-[60px_1fr_120px_140px] gap-4 p-4 border-b border-[var(--border)] last:border-0 items-center">
                          <div className="text-center font-mono font-bold text-[var(--text-muted)]">
                            {idx + 1}
                          </div>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="relative">
                              {member.photoURL ? (
                                <img src={member.photoURL} className="w-8 h-8 rounded border border-[var(--border)]" alt={member.displayName} />
                              ) : (
                                <div className="w-8 h-8 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center font-mono text-xs">
                                  {member.displayName?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              
                              {/* Deep Work Radar Indicator */}
                              {member.isFocusing && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--surface-1)] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" title="Deep Work Active" />
                              )}
                            </div>
                            <div className="truncate">
                              <p className="font-medium text-sm text-[var(--text-primary)] truncate">{member.displayName}</p>
                              {member.isFocusing && (
                                <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mt-0.5">Focusing</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right font-mono text-sm">
                            Lv. {member.level}
                          </div>
                          <div className="text-right font-mono text-sm text-[var(--text-primary)]">
                            {Math.floor((member.totalFocusMinutes || 0) / 60)}h {(member.totalFocusMinutes || 0) % 60}m
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-8 max-w-sm w-full">
            <h3 className="font-mono text-xl mb-6 uppercase tracking-widest">Found a Cohort</h3>
            <input 
              type="text"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              placeholder="Cohort Name (e.g. Protocol 9)"
              className="w-full bg-transparent border border-[var(--border)] p-3 mb-8 font-mono text-sm text-white focus:outline-none focus:border-white"
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowCreate(false)} className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-white">Cancel</button>
              <button onClick={handleCreate} disabled={!createName.trim()} className="font-mono text-xs uppercase tracking-widest border border-[var(--border)] px-4 py-2 hover:bg-white hover:text-black transition-colors disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-8 max-w-sm w-full">
            <h3 className="font-mono text-xl mb-6 uppercase tracking-widest">Join Cohort</h3>
            <input 
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Invite Code (e.g. AX-7B9)"
              maxLength={6}
              className="w-full bg-transparent border border-[var(--border)] p-3 mb-2 font-mono text-sm text-white focus:outline-none focus:border-white uppercase tracking-widest text-center"
            />
            {joinError && <p className="text-[var(--accent-rose)] text-xs font-mono mb-6">{joinError}</p>}
            {!joinError && <div className="h-6 mb-2"></div>}
            
            <div className="flex justify-end gap-4">
              <button onClick={() => { setShowJoin(false); setJoinError(""); }} className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-white">Cancel</button>
              <button onClick={handleJoin} disabled={joinCode.length < 6} className="font-mono text-xs uppercase tracking-widest border border-[var(--border)] px-4 py-2 hover:bg-white hover:text-black transition-colors disabled:opacity-50">Join</button>
            </div>
          </div>
        </div>
      )}

    </PageTransition>
  );
}
