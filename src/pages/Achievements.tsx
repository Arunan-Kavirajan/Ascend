import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition';
import { useUser } from '../context/UserContext';
import { useSessions } from '../context/SessionContext';
import { ACHIEVEMENTS, TIERS } from '../lib/achievements';

export default function Achievements() {
  const { profile, claimAchievement, claimTierMastery } = useUser();
  const { sessions } = useSessions();
  
  const [selectedTier, setSelectedTier] = useState<number | 'all'>('all');
  const [claiming, setClaiming] = useState<string | null>(null);

  const unlockedIds = profile?.achievements || [];
  const claimedIds = profile?.claimedAchievements || [];

  // Filter achievements based on selection
  const displayedAchievements = useMemo(() => {
    if (selectedTier === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a => a.tier === selectedTier);
  }, [selectedTier]);

  // Handle claiming
  const handleClaim = async (id: string) => {
    setClaiming(id);
    await claimAchievement(id);
    setClaiming(null);
  };

  const handleClaimMastery = async (tier: number) => {
    setClaiming(`mastery-${tier}`);
    await claimTierMastery(tier);
    setClaiming(null);
  };

  // Calculate global progress
  const totalCompleted = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const globalProgress = Math.round((totalCompleted / totalCount) * 100);

  return (
    <PageTransition>
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        
        <main className="flex-1 ml-60 relative overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-12">
            
            <header className="mb-12">
              <h1 className="text-4xl font-medium mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Achievement Engine
              </h1>
              <div className="flex items-center gap-4">
                <p className="font-mono text-sm tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  MILESTONES & REWARDS
                </p>
                <div className="h-1 flex-1 max-w-xs rounded-full bg-zinc-900 overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-white" 
                    initial={{ width: 0 }}
                    animate={{ width: `${globalProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="font-mono text-xs text-zinc-500">{totalCompleted} / {totalCount}</span>
              </div>
            </header>

            {/* Tier Tiles */}
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 mb-12">
              <button
                onClick={() => setSelectedTier('all')}
                className={`flex-shrink-0 px-6 py-4 border text-left transition-all duration-300 ${
                  selectedTier === 'all' 
                    ? 'border-white bg-white/5' 
                    : 'border-white/10 hover:border-white/30 bg-transparent'
                }`}
              >
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Global</div>
                <div className="text-lg font-medium text-white">All Tiers</div>
              </button>

              {TIERS.map((tier) => {
                const tierAchs = ACHIEVEMENTS.filter(a => a.tier === tier.level);
                const tierCompleted = tierAchs.filter(a => unlockedIds.includes(a.id)).length;
                const isMastered = tierCompleted === tierAchs.length;
                
                return (
                  <button
                    key={tier.level}
                    onClick={() => setSelectedTier(tier.level)}
                    className={`flex-shrink-0 w-48 p-4 border text-left transition-all duration-300 ${
                      selectedTier === tier.level 
                        ? 'border-white bg-white/5' 
                        : 'border-white/10 hover:border-white/30 bg-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-[10px] font-mono tracking-widest text-zinc-500">TIER {tier.level}</div>
                      {isMastered && <div className="text-[10px] px-1.5 py-0.5 bg-white text-black font-semibold">MASTERED</div>}
                    </div>
                    <div className="text-lg font-medium text-white mb-2">{tier.name}</div>
                    
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-zinc-900 overflow-hidden">
                        <div 
                          className="h-full bg-zinc-400" 
                          style={{ width: `${(tierCompleted / tierAchs.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{tierCompleted}/{tierAchs.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mastery Capstone (If a specific tier is selected) */}
            <AnimatePresence mode="wait">
              {selectedTier !== 'all' && (
                <motion.div
                  key={`capstone-${selectedTier}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-12 border border-white/20 p-6 bg-zinc-900/30 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                      Tier {selectedTier} Capstone Reward
                    </h3>
                    <p className="text-xl font-medium text-white mb-2">
                      Title: <span className="font-mono text-zinc-300">"{TIERS.find(t => t.level === selectedTier)?.capstoneTitle}"</span>
                    </p>
                    <p className="text-sm text-zinc-400">
                      Complete all 18 feats in this tier to unlock.
                    </p>
                  </div>
                  
                  {(() => {
                    const tierDef = TIERS.find(t => t.level === selectedTier);
                    const tierAchs = ACHIEVEMENTS.filter(a => a.tier === selectedTier);
                    const isMastered = tierAchs.every(a => unlockedIds.includes(a.id));
                    const isClaimed = claimedIds.includes(`tier-${selectedTier}-mastery`);

                    if (isClaimed) {
                      return (
                        <div className="px-6 py-3 border border-white/10 text-zinc-500 font-mono text-sm flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          MASTERED
                        </div>
                      );
                    }
                    if (isMastered) {
                      return (
                        <button 
                          onClick={() => handleClaimMastery(selectedTier)}
                          disabled={claiming === `mastery-${selectedTier}`}
                          className="px-6 py-3 bg-white text-black font-semibold tracking-widest text-sm hover:bg-zinc-200 transition-colors"
                        >
                          {claiming === `mastery-${selectedTier}` ? 'CLAIMING...' : `CLAIM +${tierDef?.capstoneReward} AP`}
                        </button>
                      );
                    }
                    return (
                      <div className="px-6 py-3 border border-white/5 text-zinc-600 font-mono text-sm bg-black/20">
                        LOCKED
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedAchievements.map((ach) => {
                const isUnlocked = unlockedIds.includes(ach.id);
                const isClaimed = claimedIds.includes(ach.id);
                
                // If not unlocked, calculate live progress
                let current = 0;
                let target = 1;
                
                if (!isUnlocked && profile) {
                  [current, target] = ach.progress(profile, sessions);
                } else {
                  current = 1;
                  target = 1;
                }

                const progressPercent = Math.min(100, (current / target) * 100);

                return (
                  <motion.div
                    key={ach.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative p-6 flex flex-col justify-between border transition-all duration-300 ${
                      isClaimed 
                        ? 'border-white/5 bg-transparent opacity-60' 
                        : isUnlocked 
                          ? 'border-white bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                          : 'border-white/10 bg-zinc-900/30'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-[10px] font-mono tracking-widest text-zinc-500">
                          TIER {ach.tier}
                        </div>
                        {isClaimed && (
                          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                            Claimed ✓
                          </div>
                        )}
                        {isUnlocked && !isClaimed && (
                          <div className="text-[10px] uppercase tracking-widest text-white px-2 py-0.5 border border-white">
                            Ready
                          </div>
                        )}
                      </div>
                      
                      <h3 className={`text-lg font-medium tracking-wide mb-2 ${isUnlocked && !isClaimed ? 'text-white' : 'text-zinc-300'}`}>
                        {ach.name}
                      </h3>
                      <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>

                    <div className="mt-auto">
                      {isClaimed ? (
                        <div className="h-[2px] w-full bg-white/10" />
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleClaim(ach.id)}
                          disabled={claiming === ach.id}
                          className="w-full py-3 bg-white text-black text-xs font-semibold tracking-widest hover:bg-zinc-200 transition-colors"
                        >
                          {claiming === ach.id ? '...' : `CLAIM +${ach.apReward} AP`}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                            <span>PROGRESS</span>
                            <span>{Math.floor(current)} / {target}</span>
                          </div>
                          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-zinc-700" 
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </main>
      </div>
    </PageTransition>
  );
}
