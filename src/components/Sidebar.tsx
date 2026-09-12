import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../lib/firebase';
import { logout } from '../lib/auth';
import ThemeToggle from './ThemeToggle';
import { useUser, getTodayString } from '../context/UserContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/sessions', label: 'Sessions' },
  { path: '/sessions/new', label: 'Focus' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/achievements', label: 'Achievements' },
  { path: '/store', label: 'Store' }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUser();

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
    <aside 
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-50 transition-colors border-r"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Header section */}
      <div className="p-8">
        <div className="font-mono text-sm tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
          [ A ] ASCEND
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex items-center px-4 py-2 outline-none group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavDot"
                  className="absolute left-0 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent-indigo)' }}
                  initial={false}
                  transition={{ duration: 0.2 }}
                />
              )}
              <span 
                className="text-sm font-medium transition-colors"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
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
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
              LVL {currentLevel}
            </p>
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

          <div className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: 'var(--text-secondary)' }}>{profile?.ap || 0} AP</span>
            <span style={{ color: streakColor }}>🔥 {profile?.currentStreak || 0}</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs text-left w-fit transition-colors hover:underline mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Logout
          </button>
        </div>
        <div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
