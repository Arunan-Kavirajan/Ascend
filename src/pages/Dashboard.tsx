import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition';
import { useSessions } from '../context/SessionContext';
import { useUser } from '../context/UserContext';
import { auth } from '../lib/firebase';

export default function Dashboard() {
  const { sessions } = useSessions();
  const { profile } = useUser();
  const navigate = useNavigate();
  const user = auth.currentUser;
  
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

            {/* Stats Row (No cards) */}
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
                className="px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-indigo)' }}
              >
                Create Session
              </button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Daily Quests */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-xs uppercase tracking-widest font-semibold mb-6" style={{ color: 'var(--text-muted)' }}>Daily Quests</h3>
                <div className="space-y-3">
                  {profile?.dailyQuests?.map(q => {
                    const completed = q.progress >= q.target;
                    return (
                      <div 
                        key={q.id} 
                        className="flex items-center justify-between p-4 border" 
                        style={{ 
                          borderColor: 'var(--border)',
                          opacity: completed ? 0.5 : 1
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-5 h-5 border flex items-center justify-center shrink-0"
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
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{q.desc}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>+{q.reward} AP</p>
                          </div>
                        </div>
                        <div className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {q.progress} / {q.target}
                        </div>
                      </div>
                    );
                  })}
                  {(!profile?.dailyQuests || profile.dailyQuests.length === 0) && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active quests.</p>
                  )}
                </div>
              </motion.div>

              {/* Recent Sessions List */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-xs uppercase tracking-widest font-semibold mb-6" style={{ color: 'var(--text-muted)' }}>Recent Activity</h3>
                <div className="space-y-4">
                  {sessions.slice(0, 3).map(session => (
                    <div key={session.id} className="flex items-center justify-between py-4 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <p className="font-medium text-base mb-1" style={{ color: 'var(--text-primary)' }}>{session.name}</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatSessionTime(session.totalFocusTime)}</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/sessions/${session.id}`)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Open
                      </button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent sessions found.</p>
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
