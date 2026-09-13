import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createAmbienceEngine, type AmbienceType, type AmbienceEngine } from "../lib/ambience";

const AMBIENCE_OPTIONS: { id: AmbienceType; name: string; icon: string }[] = [
  { id: "rain", name: "Rain", icon: "🌧" },
  { id: "campfire", name: "Campfire", icon: "🔥" },
  { id: "ocean", name: "Ocean", icon: "🌊" },
  { id: "forest", name: "Forest", icon: "🌿" },
  { id: "brown-noise", name: "Brown Noise", icon: "🟤" },
  { id: "white-noise", name: "White Noise", icon: "⚪" },
];

interface AmbiencePlayerProps {
  isTimerRunning: boolean;
  onAmbienceChange?: (ambience: AmbienceType | null) => void;
}

export default function AmbiencePlayer({ isTimerRunning, onAmbienceChange }: AmbiencePlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAmbience, setActiveAmbience] = useState<AmbienceType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const engineRef = useRef<AmbienceEngine | null>(null);
  const wasPlayingRef = useRef<AmbienceType | null>(null);

  // Initialize engine lazily
  const getEngine = () => {
    if (!engineRef.current) {
      engineRef.current = createAmbienceEngine();
    }
    return engineRef.current;
  };

  // Sync volume
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolume(volume);
    }
  }, [volume]);

  // Pause/resume with timer
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (!isTimerRunning && activeAmbience) {
      wasPlayingRef.current = activeAmbience;
      engine.stop();
    } else if (isTimerRunning && wasPlayingRef.current) {
      engine.start(wasPlayingRef.current);
      engine.setVolume(volume);
      wasPlayingRef.current = null;
    }
  }, [isTimerRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const handleSelect = (type: AmbienceType) => {
    const engine = getEngine();

    if (activeAmbience === type) {
      // Toggle off
      engine.stop();
      setActiveAmbience(null);
      onAmbienceChange?.(null);
    } else {
      engine.start(type);
      engine.setVolume(volume);
      setActiveAmbience(type);
      onAmbienceChange?.(type);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 right-0 w-64 border p-4"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs uppercase tracking-widest font-semibold mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Ambience
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {AMBIENCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className="flex flex-col items-center gap-1 p-2.5 border transition-colors cursor-pointer"
                  style={{
                    backgroundColor:
                      activeAmbience === option.id
                        ? "var(--bg-tertiary)"
                        : "transparent",
                    borderColor:
                      activeAmbience === option.id
                        ? "var(--accent)"
                        : "var(--border)",
                  }}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span
                    className="text-[10px] font-mono"
                    style={{
                      color:
                        activeAmbience === option.id
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    {option.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-3">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 h-1 appearance-none rounded-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--accent) ${volume * 100}%, var(--border) ${volume * 100}%)`,
                }}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 flex items-center justify-center border transition-colors cursor-pointer"
        style={{
          backgroundColor: activeAmbience
            ? "var(--bg-tertiary)"
            : "var(--bg-secondary)",
          borderColor: activeAmbience ? "var(--accent)" : "var(--border)",
        }}
      >
        {activeAmbience ? (
          <span className="text-base">
            {AMBIENCE_OPTIONS.find((o) => o.id === activeAmbience)?.icon}
          </span>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--text-muted)" }}
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}
