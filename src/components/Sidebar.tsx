import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../lib/firebase';
import { logout } from '../lib/auth';
import { useUser, getTodayString } from '../context/UserContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/sessions', label: 'Sessions' },
  { path: '/sessions/new', label: 'Focus' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/cohorts', label: 'Cohorts' },
  { path: '/achievements', label: 'Achievements' },
  { path: '/store', label: 'Store' },
  { path: '/profile', label: 'Profile' }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const user = auth.currentUser;

  const currentXP = profile?.xp || 0;
  const currentLevel = Math.floor(Math.sqrt(currentXP / 100)) + 1;
  const currentLevelBaseXP = 100 * Math.pow(currentLevel - 1, 2);
  const nextLevelBaseXP = 100 * Math.pow(currentLevel, 2);
  const xpProgress = currentXP - currentLevelBaseXP;
  const xpRequired = nextLevelBaseXP - currentLevelBaseXP;
  const progressPercent = (xpProgress / xpRequired) * 100;

  const isSecuredToday = profile?.lastActiveDate === getTodayString();
  const streakColor = isSecuredToday ? 'var(--accent-warm)' : 'var(--text-muted)';

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border)] z-40 flex items-center justify-between px-4">
        <div className="font-mono text-sm tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
          [ A ] ASCEND
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-[var(--text-primary)] focus:outline-none"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <aside 
        className={`fixed left-0 top-0 h-full w-60 flex flex-col z-50 transition-transform duration-300 border-r ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)'
        }}
      >
        {/* Header section */}
        <div className="p-8 flex justify-between items-center">
          <div className="font-mono text-sm tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
            [ A ] ASCEND
          </div>
          <button 
            className="md:hidden text-[var(--text-muted)] hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className="relative flex items-center px-4 py-2.5 outline-none group transition-all duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavDot"
                  className="absolute left-0 w-1 h-4 rounded-r"
                  style={{ backgroundColor: 'var(--accent)' }}
                  initial={false}
                  transition={{ duration: 0.2 }}
                />
              )}
              <span 
                className={`text-sm tracking-wide transition-all duration-200 group-hover:translate-x-1 ${
                  isActive 
                    ? 'font-medium text-[var(--text-primary)]' 
                    : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer section */}
      <div className="p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col gap-3 text-left hover:opacity-80 transition-opacity focus:outline-none w-full"
          >
            <div className="w-full">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                  LVL {currentLevel}
                </p>
              </div>
              {profile?.equipped?.title && (
                <p className="text-[10px] font-mono tracking-widest uppercase mt-0.5" style={{ color: 'var(--accent)' }}>
                  {profile.equipped.title.replace('title-', '').replace('-', ' ')}
                </p>
              )}
            </div>
            
            <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono w-full">
              <span style={{ color: 'var(--text-secondary)' }}>{profile?.ap || 0} AP</span>
              <div className="flex items-center gap-3">
                {(profile?.streakShields || 0) > 0 && (
                  <span title="Streak Shields" style={{ color: 'var(--text-secondary)' }}>🛡️ {profile?.streakShields}</span>
                )}
                <span style={{ color: streakColor }}>🔥 {profile?.currentStreak || 0}</span>
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="text-xs text-left w-fit transition-all duration-200 hover:text-[var(--text-primary)] hover:underline mt-1 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            Logout
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
