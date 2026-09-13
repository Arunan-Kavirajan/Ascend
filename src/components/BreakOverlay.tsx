import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreakOverlayProps {
  isVisible: boolean;
  isLongBreak: boolean;
  totalFocusMinutes: number;
  onDismiss: () => void;
}

type Exercise = 'none' | 'breathing' | 'eyes' | 'stretch';

// --- Icons ---
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

const SquareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const StretchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"></circle><path d="m9 20 3-6 3 6"></path><path d="m6 8 6 2 6-2"></path><path d="M12 10v4"></path></svg>
);

// --- Exercises ---

const BoxBreathing = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'In' | 'Hold' | 'Out' | 'Hold (Empty)'>('In');
  const [cycle, setCycle] = useState(1);
  const maxCycles = 4;
  const phaseDuration = 4000;

  useEffect(() => {
    let currentPhase = 0;
    const phases = ['In', 'Hold', 'Out', 'Hold (Empty)'] as const;
    
    const interval = setInterval(() => {
      currentPhase = (currentPhase + 1) % 4;
      setPhase(phases[currentPhase]);
      
      if (currentPhase === 0) {
        setCycle(c => {
          if (c === maxCycles) {
            clearInterval(interval);
            onComplete();
            return c;
          }
          return c + 1;
        });
      }
    }, phaseDuration);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-[var(--text-secondary)] mb-8 font-mono">
        Cycle {Math.min(cycle, maxCycles)} / {maxCycles}
      </div>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <motion.div
          className="absolute border-2 border-[var(--accent)] rounded-lg w-full h-full"
          animate={{
            scale: phase === 'In' || phase === 'Hold' ? 1.2 : 0.8,
            opacity: phase === 'In' || phase === 'Hold' ? 1 : 0.5
          }}
          transition={{ duration: 4, ease: "linear" }}
        />
        <div className="text-2xl font-bold text-[var(--text-primary)] z-10">
          {phase === 'In' && 'Breathe In'}
          {phase === 'Hold' && 'Hold'}
          {phase === 'Out' && 'Breathe Out'}
          {phase === 'Hold (Empty)' && 'Hold'}
        </div>
      </div>
    </div>
  );
};

const EyeRest = ({ onComplete }: { onComplete: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 20) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <div className="text-xl text-[var(--text-primary)] text-center max-w-xs">
        Look at something 20 feet away to rest your eyes.
      </div>
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-40 h-40">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="var(--border)"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="var(--accent)"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute text-4xl font-mono text-[var(--text-primary)]">
          {timeLeft}
        </div>
      </div>
    </div>
  );
};

const QuickStretch = ({ onComplete }: { onComplete: () => void }) => {
  const stretches = [
    { name: 'Neck Roll', desc: 'Slowly roll your neck in circles.' },
    { name: 'Shoulder Shrugs', desc: 'Raise shoulders to ears, then release.' },
    { name: 'Wrist Circles', desc: 'Roll your wrists in gentle circles.' },
    { name: 'Stand & Reach Up', desc: 'Stand up and reach for the ceiling.' }
  ];
  const poseDuration = 20;

  const [currentStretch, setCurrentStretch] = useState(0);
  const [timeLeft, setTimeLeft] = useState(poseDuration);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (currentStretch < stretches.length - 1) {
        setCurrentStretch(s => s + 1);
        setTimeLeft(poseDuration);
      } else {
        onComplete();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentStretch, stretches.length, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="text-sm text-[var(--text-secondary)] uppercase tracking-widest font-mono">
        Stretch {currentStretch + 1} / {stretches.length}
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)] text-center">
        {stretches[currentStretch].name}
      </div>
      <div className="text-lg text-[var(--text-secondary)] text-center max-w-sm">
        {stretches[currentStretch].desc}
      </div>
      <div className="text-5xl font-mono text-[var(--accent)] mt-8">
        {timeLeft}s
      </div>
    </div>
  );
};


export const BreakOverlay: React.FC<BreakOverlayProps> = ({
  isVisible,
  isLongBreak,
  totalFocusMinutes,
  onDismiss
}) => {
  const [activeExercise, setActiveExercise] = useState<Exercise>('none');
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset state when hiding
  useEffect(() => {
    if (!isVisible) {
      setTimeout(() => {
        setActiveExercise('none');
        setShowSuccess(false);
      }, 300);
    }
  }, [isVisible]);

  const handleComplete = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onDismiss();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="absolute inset-0 bg-black/40 pointer-events-auto cursor-pointer"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full h-[60vh] bg-[var(--bg-secondary)] border-t border-[var(--border)] rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              {activeExercise !== 'none' && !showSuccess ? (
                <button
                  onClick={() => setActiveExercise('none')}
                  className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-primary)]"
                  aria-label="Back to exercises"
                >
                  <ArrowLeftIcon />
                </button>
              ) : (
                <div className="font-semibold text-lg text-[var(--text-primary)]">
                  Break Time
                </div>
              )}

              <button
                onClick={onDismiss}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
              >
                Skip <XIcon />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center"
                  >
                    <div className="text-4xl mb-4">🎉</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">Nice work!</div>
                  </motion.div>
                ) : activeExercise === 'none' ? (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-full"
                  >
                    {isLongBreak && (
                      <div className="mb-8 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-center text-[var(--text-primary)]">
                        <span className="text-xl mr-2">💧</span>
                        You've been focusing for {totalFocusMinutes} minutes. Time to hydrate!
                      </div>
                    )}
                    
                    <div className="text-center mb-6 text-[var(--text-secondary)]">
                      Choose an optional quick break activity:
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <button
                        onClick={() => setActiveExercise('breathing')}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--accent)] transition-all group"
                      >
                        <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mb-4">
                          <SquareIcon />
                        </div>
                        <div className="font-semibold text-[var(--text-primary)] mb-2">Box Breathing</div>
                        <div className="text-sm text-[var(--text-muted)] text-center">~1 minute breathing guide</div>
                      </button>

                      <button
                        onClick={() => setActiveExercise('eyes')}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--accent)] transition-all group"
                      >
                        <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mb-4">
                          <EyeIcon />
                        </div>
                        <div className="font-semibold text-[var(--text-primary)] mb-2">20-20-20 Rule</div>
                        <div className="text-sm text-[var(--text-muted)] text-center">20s eye rest</div>
                      </button>

                      <button
                        onClick={() => setActiveExercise('stretch')}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--accent)] transition-all group"
                      >
                        <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mb-4">
                          <StretchIcon />
                        </div>
                        <div className="font-semibold text-[var(--text-primary)] mb-2">Quick Stretch</div>
                        <div className="text-sm text-[var(--text-muted)] text-center">4 simple stretches (80s)</div>
                      </button>
                    </div>
                  </motion.div>
                ) : activeExercise === 'breathing' ? (
                  <motion.div key="breathing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full">
                    <BoxBreathing onComplete={handleComplete} />
                  </motion.div>
                ) : activeExercise === 'eyes' ? (
                  <motion.div key="eyes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full">
                    <EyeRest onComplete={handleComplete} />
                  </motion.div>
                ) : (
                  <motion.div key="stretch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full">
                    <QuickStretch onComplete={handleComplete} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
