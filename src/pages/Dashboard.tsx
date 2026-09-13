import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition';
import { useSessions } from '../context/SessionContext';
import { useUser } from '../context/UserContext';
import { auth } from '../lib/firebase';
import { generateMatrix, calculateCircadian, calculateVelocity } from '../lib/telemetry';
import type { DayData } from '../lib/telemetry';
import { ConsistencyMatrix } from '../components/ConsistencyMatrix';
import { CircadianHorizon } from '../components/CircadianHorizon';

export default function Dashboard() {
  const { sessions } = useSessions();
  const { profile, rerollQuest } = useUser();
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Year filter: 'last-365' or specific year like 2024
  const [selectedYear, setSelectedYear] = useState<number | 'last-365'>('last-365');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();

  const totalFocusSeconds = sessions.reduce((acc, s) => acc + s.totalFocusTime, 0);
  const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);
  const totalTasks = sessions.reduce((acc, s) => acc + s.tasks.filter(t => t.completed).length, 0);
  const totalPomodoros = sessions.reduce((acc, s) => acc + s.completedPomodoros, 0);

  const formatSessionTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} SEC`;
    return `${Math.floor(seconds / 60)} MIN`;
  };

  const { startDate, endDate } = useMemo(() => {
    if (selectedYear === 'last-365') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 364);
      return { startDate: start, endDate: end };
    } else {
      return {
        startDate: new Date(selectedYear, 0, 1),
        endDate: new Date(selectedYear, 11, 31)
      };
    }
  }, [selectedYear]);

  const matrixData = useMemo(() => generateMatrix(sessions, startDate, endDate), [sessions, startDate, endDate]);
  const circadianData = useMemo(() => calculateCircadian(sessions), [sessions]);
  const velocityData = useMemo(() => calculateVelocity(sessions), [sessions]);

  // Generate available years based on session data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear()); // Always include current year
    sessions.forEach(s => {
      years.add(new Date(s.createdAt).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!selectedDate) return sessions;
    return sessions.filter((s) => {
      const sDate = new Date(s.createdAt);
      return (
        sDate.getDate() === selectedDate.getDate() &&
        sDate.getMonth() === selectedDate.getMonth() &&
        sDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [sessions, selectedDate]);

  const handleDayClick = (day: DayData) => {
    if (
      selectedDate &&
      selectedDate.getDate() === day.date.getDate() &&
      selectedDate.getMonth() === day.date.getMonth() &&
      selectedDate.getFullYear() === day.date.getFullYear()
    ) {
      // Toggle off
      setSelectedDate(null);
    } else {
      setSelectedDate(day.date);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        
        <main className="flex-1 ml-60 relative overflow-y-auto">
          
          <div className="relative z-10 max-w-5xl mx-auto p-12">
            
            {/* Header */}
            <motion.header 
              className="mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-medium mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {getGreeting()}, {user?.displayName?.split(' ')[0] || 'User'}.
              </h1>
              <p className="font-mono text-sm tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {currentDate}
              </p>
            </motion.header>

            {/* Stats Row */}
            <motion.div 
              className="grid grid-cols-4 gap-8 mb-16"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div>
                <div className="font-mono text-5xl mb-2" style={{ color: 'var(--text-primary)' }}>
                  {Math.floor(totalFocusMinutes / 60)}<span className="text-2xl text-[var(--text-muted)]">h</span> {totalFocusMinutes % 60}<span className="text-2xl text-[var(--text-muted)]">m</span>
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Study Time</div>
              </div>

              <div>
                <div className="font-mono text-5xl mb-2" style={{ color: 'var(--text-primary)' }}>
                  {sessions.length}
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Sessions</div>
              </div>

              <div>
                <div className="font-mono text-5xl mb-2" style={{ color: 'var(--text-primary)' }}>
                  {totalTasks}
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Tasks Done</div>
              </div>

              <div>
                <div className="font-mono text-5xl mb-2" style={{ color: 'var(--text-primary)' }}>
                  {totalPomodoros}
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Pomodoros</div>
              </div>
            </motion.div>

            {/* Telemetry Suite */}
            <motion.div
              className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {/* Left Column: Consistency Matrix & Velocity */}
              <div className="lg:col-span-2 space-y-8">
                <div className="border p-6 rounded-md bg-zinc-900/50" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-zinc-300">Consistency Matrix</h3>
                    
                    {/* Year Filter */}
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => setSelectedYear('last-365')}
                        className={`px-3 py-1 rounded transition-colors ${selectedYear === 'last-365' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Last 365 Days
                      </button>
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className={`px-3 py-1 rounded transition-colors ${selectedYear === year ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ConsistencyMatrix 
                    matrix={matrixData}
                    selectedDate={selectedDate}
                    onDayClick={handleDayClick}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-6 rounded-md bg-zinc-900/50" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Focus Velocity</p>
                    <p className="text-3xl font-mono text-white">{velocityData.minutesPerTask}<span className="text-sm text-zinc-500 ml-1">min/task</span></p>
                  </div>
                  <div className="border p-6 rounded-md bg-zinc-900/50" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Session Integrity</p>
                    <p className="text-3xl font-mono text-white">{velocityData.sessionIntegrity}<span className="text-sm text-zinc-500 ml-1">%</span></p>
                  </div>
                </div>
              </div>

              {/* Right Column: Circadian Horizon */}
              <div className="border p-6 rounded-md bg-zinc-900/50 flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
                <CircadianHorizon
                  hourly={circadianData.hourly}
                  quartiles={circadianData.quartiles}
                  peakWindow={circadianData.peakWindow}
                />
              </div>
            </motion.div>

            {/* CTA Box */}
            <motion.div 
              className="border p-8 mb-16 flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div>
                <h2 className="text-2xl font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Deep Work Awaits</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Immerse yourself and track your progress.</p>
              </div>
              <button
                onClick={() => navigate('/sessions/new')}
                className="px-8 py-3 text-sm font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-95"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Create Session
              </button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Tactical Operations */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Tactical Operations</h3>
                  {profile?.dailyQuests?.filter(q => q.completed).length === 3 && (
                    <span className="text-[var(--text-primary)] text-xs font-mono tracking-widest flex items-center gap-1 border border-[var(--text-primary)] px-2 py-1 bg-[var(--text-primary)]/10">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      PERFECT DAY (+50 AP)
                    </span>
                  )}
                </div>

                <div className="space-y-4 flex-1">
                  {/* Weekly Contract */}
                  {profile?.weeklyContract && (
                    <div className="border border-[var(--border)] p-5 relative overflow-hidden bg-[var(--surface-1)]">
                      <div className="absolute top-0 left-0 h-1 bg-[var(--text-primary)] transition-all" style={{ width: `${Math.min(100, (profile.weeklyContract.progress / profile.weeklyContract.target) * 100)}%` }} />
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-mono tracking-widest text-[var(--accent)] mb-1">[ WEEKLY CONTRACT ]</p>
                          <p className="font-medium text-sm text-[var(--text-primary)]">{profile.weeklyContract.desc}</p>
                          <p className="text-xs mt-1 text-[var(--text-secondary)]">+{profile.weeklyContract.reward} AP &nbsp;&bull;&nbsp; +{profile.weeklyContract.rewardXP} XP</p>
                        </div>
                        {profile.weeklyContract.completed && (
                          <div className="text-[var(--text-primary)] border border-[var(--text-primary)] rounded-full p-1 bg-[var(--text-primary)]/10">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-xs text-[var(--text-muted)] text-right mt-2">
                        {profile.weeklyContract.progress} / {profile.weeklyContract.target}
                      </div>
                    </div>
                  )}

                  {/* Daily Directives */}
                  <div className="space-y-3 pt-2">
                    {profile?.dailyQuests?.map(q => {
                      const completed = q.progress >= q.target;
                      return (
                        <div 
                          key={q.id} 
                          className="flex items-center justify-between p-4 border relative group transition-all" 
                          style={{ 
                            borderColor: 'var(--border)',
                            opacity: completed ? 0.6 : 1,
                            backgroundColor: completed ? 'var(--bg-primary)' : 'var(--surface-1)'
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-5 h-5 border flex items-center justify-center shrink-0 transition-colors"
                              style={{ 
                                borderColor: completed ? 'var(--text-primary)' : 'var(--border)',
                                backgroundColor: completed ? 'var(--text-primary)' : 'transparent'
                              }}
                            >
                              {completed && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--bg-primary)]"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-[var(--text-primary)]">{q.desc}</p>
                              <p className="text-xs mt-0.5 text-[var(--text-secondary)]">+{q.reward} AP</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {!completed && (
                              <button
                                onClick={() => rerollQuest(q.id)}
                                disabled={profile.ap < 25}
                                className={`text-[10px] font-mono tracking-wider border px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity ${profile.ap >= 25 ? 'border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-white' : 'border-[var(--border)] text-[var(--text-faint)] cursor-not-allowed'}`}
                                title="Reroll Directive (25 AP)"
                              >
                                ↻ 25 AP
                              </button>
                            )}
                            <div className="font-mono text-xs w-12 text-right text-[var(--text-muted)]">
                              {q.progress}/{q.target}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Recent Sessions List */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {selectedDate ? `Activity for ${selectedDate.toLocaleDateString()}` : 'Recent Activity'}
                  </h3>
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-xs font-mono transition-all hover:text-white text-zinc-500 cursor-pointer"
                    >
                      Clear Filter &times;
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {filteredSessions.slice(0, 3).map(session => (
                    <div key={session.id} className="flex items-center justify-between py-4 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <p className="font-medium text-base mb-1" style={{ color: 'var(--text-primary)' }}>{session.name}</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatSessionTime(session.totalFocusTime)}</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/sessions/${session.id}`)}
                        className="text-sm font-medium transition-all duration-200 hover:text-[var(--text-primary)] hover:translate-x-0.5 cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Open &rarr;
                      </button>
                    </div>
                  ))}
                  {filteredSessions.length > 0 && (
                    <button
                      onClick={() => navigate('/sessions')}
                      className="text-xs font-mono tracking-wider transition-all duration-200 hover:text-[var(--text-primary)] hover:underline mt-2 cursor-pointer flex items-center gap-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      View All Activity &rarr;
                    </button>
                  )}
                  {filteredSessions.length === 0 && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sessions found{selectedDate ? ' for this day.' : '.'}</p>
                  )}
                </div>
              </motion.div>
            </div>

          </div>
        </main>
      </div>
    </PageTransition>
  );
}
