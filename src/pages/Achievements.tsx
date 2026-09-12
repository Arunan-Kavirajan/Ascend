import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { ACHIEVEMENTS } from '../lib/constants';
import { useUser } from '../context/UserContext';

export default function Achievements() {
  const { profile } = useUser();
  const userAchievements = profile?.achievements || [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <Sidebar />
      <motion.main 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="ml-72 min-h-screen p-12"
      >
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-normal tracking-wide mb-2">Achievements</h1>
            <p className="text-sm text-[var(--text-secondary)] uppercase tracking-widest">
              Milestones & Badges
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACHIEVEMENTS.map((ach, i) => {
              const isUnlocked = userAchievements.includes(ach.id);
              
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative p-6 border transition-all duration-300 ${
                    isUnlocked 
                      ? 'border-[var(--accent-indigo)] bg-[var(--surface-1)]' 
                      : 'border-[var(--border)] bg-[var(--bg-primary)] opacity-50 grayscale'
                  }`}
                  style={{
                    boxShadow: isUnlocked ? '0 4px 20px -5px var(--shadow-glow-indigo)' : 'none'
                  }}
                >
                  {isUnlocked && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-indigo)]" />
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <h3 
                      className="text-xl font-medium tracking-wide" 
                      style={{ color: isUnlocked ? 'var(--accent-indigo)' : 'var(--text-primary)'}}
                    >
                      {ach.name}
                    </h3>
                    {isUnlocked && (
                      <span className="text-[10px] uppercase tracking-widest text-[var(--accent-indigo)] border border-[var(--accent-indigo)] px-2 py-1 bg-black/20">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {ach.description}
                  </p>
                  
                  {!isUnlocked && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-widest flex items-center justify-between">
                      <span>Locked</span>
                      <span>???</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.main>
    </div>
  );
}
