import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import { useSessions, type TimerMode } from "../context/SessionContext";
import PageTransition from "../components/PageTransition";

type PomodoroPreset = "standard" | "custom";

export default function CreateSession() {
  const navigate = useNavigate();
  const { createSession } = useSessions();
  const [sessionName, setSessionName] = useState("");
  const [timerMode, setTimerMode] = useState<TimerMode>("pomodoro");
  const [isStrict, setIsStrict] = useState(false);
  const [pomodoroPreset, setPomodoroPreset] = useState<PomodoroPreset>("standard");
  const [customFocusMin, setCustomFocusMin] = useState(25);
  const [customBreakMin, setCustomBreakMin] = useState(5);

  const handleCreate = async () => {
    const name = sessionName.trim();
    if (!name) return;

    const focusDuration = timerMode === "pomodoro" && pomodoroPreset === "custom"
      ? customFocusMin * 60
      : undefined;
    const breakDuration = timerMode === "pomodoro" && pomodoroPreset === "custom"
      ? customBreakMin * 60
      : undefined;

    const session = await createSession(name, timerMode, isStrict, focusDuration, breakDuration);
    navigate(`/sessions/${session.id}`);
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)]" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <PageTransition>
        <main className="ml-60 min-h-screen px-12 py-16">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => navigate("/sessions")}
              className="text-xs uppercase tracking-widest font-semibold hover:underline mb-12"
              style={{ color: 'var(--text-muted)' }}
            >
              &larr; Back to Sessions
            </button>

            <div className="mb-16">
              <h1 className="text-4xl font-medium tracking-tight mb-3">
                Create a session
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Set the structure. Add your tasks once you're inside.
              </p>
            </div>

            <div className="space-y-12">
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
                  Session Name
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  placeholder="e.g. Deep Work Sprint"
                  className="w-full bg-transparent border-b py-3 text-lg outline-none transition-colors focus:border-[var(--text-primary)]"
                  style={{ 
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
                  Timer Mode
                </label>

                <div className="grid grid-cols-2 gap-6">
                  {[
                    { id: 'pomodoro', name: 'Pomodoro', desc: 'Focus and break cycles' },
                    { id: 'regular', name: 'Regular Timer', desc: 'Continuous focus tracking' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setTimerMode(mode.id as TimerMode)}
                      className="p-6 text-left border transition-colors outline-none cursor-pointer"
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: timerMode === mode.id ? 'var(--accent)' : 'var(--border)'
                      }}
                    >
                      <h3 className="font-medium text-base mb-1" style={{ color: timerMode === mode.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {mode.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Pomodoro Configuration */}
              <AnimatePresence>
                {timerMode === "pomodoro" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
                      Pomodoro Preset
                    </label>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <button
                        onClick={() => setPomodoroPreset("standard")}
                        className="p-5 text-left border transition-colors outline-none cursor-pointer"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: pomodoroPreset === "standard" ? 'var(--accent)' : 'var(--border)'
                        }}
                      >
                        <h3 className="font-medium text-base mb-1" style={{ color: pomodoroPreset === "standard" ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          Standard
                        </h3>
                        <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>25 min focus / 5 min break</p>
                      </button>

                      <button
                        onClick={() => setPomodoroPreset("custom")}
                        className="p-5 text-left border transition-colors outline-none cursor-pointer"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: pomodoroPreset === "custom" ? 'var(--accent)' : 'var(--border)'
                        }}
                      >
                        <h3 className="font-medium text-base mb-1" style={{ color: pomodoroPreset === "custom" ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          Custom
                        </h3>
                        <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Set your own durations</p>
                      </button>
                    </div>

                    <AnimatePresence>
                      {pomodoroPreset === "custom" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-6 pt-2">
                            <div>
                              <label className="block text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                                Focus Duration
                              </label>
                              <div className="flex items-baseline gap-2">
                                <input
                                  type="number"
                                  min={5}
                                  max={90}
                                  value={customFocusMin}
                                  onChange={(e) => setCustomFocusMin(Math.min(90, Math.max(5, Number(e.target.value))))}
                                  className="w-20 bg-transparent border-b py-2 text-2xl font-mono outline-none transition-colors focus:border-[var(--text-primary)] text-center"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                />
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>minutes</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                                Break Duration
                              </label>
                              <div className="flex items-baseline gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={customBreakMin}
                                  onChange={(e) => setCustomBreakMin(Math.min(30, Math.max(1, Number(e.target.value))))}
                                  className="w-20 bg-transparent border-b py-2 text-2xl font-mono outline-none transition-colors focus:border-[var(--text-primary)] text-center"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                />
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>minutes</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="flex items-center space-x-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isStrict}
                    onChange={(e) => setIsStrict(e.target.checked)}
                    className="w-5 h-5 accent-[var(--accent)] cursor-pointer bg-transparent border-[var(--border)] rounded"
                  />
                  <div>
                    <h3 className="font-medium text-base" style={{ color: 'var(--text-primary)' }}>Strict Mode</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Timer will pause if you switch tabs or applications.</p>
                  </div>
                </label>
              </div>

              <div className="pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  disabled={!sessionName.trim()}
                  onClick={handleCreate}
                  className="w-full py-4 text-sm font-semibold text-[var(--bg-primary)] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--accent)'
                  }}
                >
                  Create Session
                </button>
                <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Note: Periodic AFK checks will appear during your session to verify focus activity.
                </p>
              </div>
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
