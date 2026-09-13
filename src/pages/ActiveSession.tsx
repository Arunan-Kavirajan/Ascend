import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSessions, type Task } from "../context/SessionContext";
import { useUser } from "../context/UserContext";
import AmbiencePlayer from "../components/AmbiencePlayer";
import { AmbienceBackground } from "../components/AmbienceBackground";
import { BreakOverlay } from "../components/BreakOverlay";
import type { AmbienceType } from "../lib/ambience";

const LONG_BREAK_INTERVAL = 4; // Every 4th pomodoro triggers a long break
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes in seconds

export default function ActiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { getSession, updateSession, sessions } = useSessions();
  const { awardSession } = useUser();
  const session = sessionId ? getSession(sessionId) : undefined;

  // Derive durations from session (custom or default)
  const focusDuration = session?.focusDuration ?? 25 * 60;
  const breakDuration = session?.breakDuration ?? 5 * 60;

  const [seconds, setSeconds] = useState(session?.timerMode === "pomodoro" ? focusDuration : 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [activeTask, setActiveTask] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(session?.tasks ?? []);
  const [taskInput, setTaskInput] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [completedPomodoros, setCompletedPomodoros] = useState(session?.completedPomodoros ?? 0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Ambience
  const [activeAmbience, setActiveAmbience] = useState<AmbienceType | null>(null);

  // Break Overlay
  const [showBreakOverlay, setShowBreakOverlay] = useState(false);
  const prevIsBreakRef = useRef(false);

  // Anti-Cheat: Random AFK Prompt
  const [showAfkPrompt, setShowAfkPrompt] = useState(false);
  const [afkPosition, setAfkPosition] = useState({ top: 50, left: 50 });
  const [showStrictWarning, setShowStrictWarning] = useState(false);
  const afkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notifications permission
  const notifRequested = useRef(false);

  const [sessionFocusTime, setSessionFocusTime] = useState(session?.totalFocusTime ?? 0);

  useEffect(() => {
    if (!session) return;
    setTasks(session.tasks);
    setCompletedPomodoros(session.completedPomodoros);
  }, [session?.id]);

  const { updateFocusStatus } = useUser();
  
  useEffect(() => {
    // Only mark as focusing if the timer is actually running AND we are not on a break.
    // If we want breaks to count as "in a session", we can just use `isRunning`.
    // Let's use `isRunning` so friends know they are in a session.
    updateFocusStatus(isRunning);
    
    return () => {
      // Cleanup: if they leave the page entirely, mark as false.
      updateFocusStatus(false);
    }
  }, [isRunning, updateFocusStatus]);

  // Request notification permission on first start
  useEffect(() => {
    if (isRunning && !notifRequested.current && "Notification" in window) {
      notifRequested.current = true;
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [isRunning]);

  // Show break overlay when break starts
  useEffect(() => {
    if (isBreak && !prevIsBreakRef.current && session?.timerMode === "pomodoro") {
      setShowBreakOverlay(true);
    }
    prevIsBreakRef.current = isBreak;
  }, [isBreak, session?.timerMode]);

  // Send notification helper
  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.svg" });
    }
  };

  useEffect(() => {
    if (!isRunning || !session || sessionCompleted) return;

    const interval = setInterval(() => {
      if (!isBreak) {
        setSessionFocusTime((prev) => prev + 1);
        if (tasks[activeTask]) {
          setTasks((prev) =>
            prev.map((task, index) =>
              index === activeTask ? { ...task, focusTime: task.focusTime + 1 } : task
            )
          );
        }
      }

      setSeconds((prev) => {
        if (prev <= 1 && session.timerMode === "pomodoro") {
          setIsRunning(false);

          if (isBreak) {
            // Break ended → back to focus
            setIsBreak(false);
            setIsLongBreak(false);
            sendNotification("Break's over!", "Let's get back to it! 🔥");
            return focusDuration;
          }
          // Focus ended → start break
          const newPomoCount = completedPomodoros + 1;
          setCompletedPomodoros(newPomoCount);
          setIsBreak(true);

          // Check for long break
          if (newPomoCount > 0 && newPomoCount % LONG_BREAK_INTERVAL === 0) {
            setIsLongBreak(true);
            sendNotification("Long break time! 🧘", "You've earned a 15 minute rest. Grab some water!");
            return LONG_BREAK_DURATION;
          }
          sendNotification("Time for a break! 🧘", "Take a moment to rest.");
          return breakDuration;
        }
        return session.timerMode === "pomodoro" ? prev - 1 : prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak, activeTask, tasks, session, sessionCompleted, focusDuration, breakDuration, completedPomodoros]);

  // Anti-Cheat: Passive Strict Mode
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && session?.isStrict) {
        setIsRunning(false);
        setShowStrictWarning(true);
        if (session) {
          updateSession(session.id, { tasks, totalFocusTime: sessionFocusTime, completedPomodoros });
        }
      }
    };

    const handleBlur = () => {
      if (isRunning && session?.isStrict) {
        setIsRunning(false);
        setShowStrictWarning(true);
        if (session) {
          updateSession(session.id, { tasks, totalFocusTime: sessionFocusTime, completedPomodoros });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isRunning, session, tasks, sessionFocusTime, completedPomodoros]);

  // Anti-Cheat: Random AFK Prompt
  useEffect(() => {
    if (isRunning && !showAfkPrompt) {
      const delay = Math.random() * (30 * 60 * 1000 - 20 * 60 * 1000) + 20 * 60 * 1000;
      afkTimeoutRef.current = setTimeout(() => {
        setAfkPosition({ top: Math.random() * 60 + 20, left: Math.random() * 60 + 20 });
        setShowAfkPrompt(true);
      }, delay);
    } else {
      if (afkTimeoutRef.current) clearTimeout(afkTimeoutRef.current);
    }
    return () => {
      if (afkTimeoutRef.current) clearTimeout(afkTimeoutRef.current);
    };
  }, [isRunning, showAfkPrompt]);

  useEffect(() => {
    if (showAfkPrompt) {
      const timer = setTimeout(() => {
        setShowAfkPrompt(false);
        setIsRunning(false);
        if (session) {
          updateSession(session.id, { tasks, totalFocusTime: sessionFocusTime, completedPomodoros });
        }
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [showAfkPrompt, session, tasks, sessionFocusTime, completedPomodoros]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="text-center">
          <h1 className="text-xl font-medium">Session not found</h1>
          <button onClick={() => navigate("/sessions")} className="mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const completedTaskCount = tasks.filter((task) => task.completed).length;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

  const addTask = async () => {
    const title = taskInput.trim();
    if (!title) return;
    const task: Task = { id: crypto.randomUUID(), title, completed: false, focusTime: 0 };
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    setTaskInput("");
    await updateSession(session.id, { tasks: updatedTasks });
  };

  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
    if (activeTask >= updatedTasks.length) setActiveTask(Math.max(0, updatedTasks.length - 1));
    await updateSession(session.id, { tasks: updatedTasks });
  };

  const toggleTask = async (id: string) => {
    const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updatedTasks);
    await updateSession(session.id, { tasks: updatedTasks });
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const saveTaskEdit = async () => {
    if (!editingTaskId || !editingTaskTitle.trim()) return;
    const updatedTasks = tasks.map((t) => (t.id === editingTaskId ? { ...t, title: editingTaskTitle.trim() } : t));
    setTasks(updatedTasks);
    setEditingTaskId(null);
    setEditingTaskTitle("");
    await updateSession(session.id, { tasks: updatedTasks });
  };

  const toggleTimer = async () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (!nextRunning) {
      await updateSession(session.id, { tasks, totalFocusTime: sessionFocusTime, completedPomodoros });
    }
  };

  const resetTimer = async () => {
    setIsRunning(false);
    setIsBreak(false);
    setIsLongBreak(false);
    setSeconds(session.timerMode === "pomodoro" ? focusDuration : 0);
    await updateSession(session.id, { tasks, totalFocusTime: sessionFocusTime, completedPomodoros });
  };

  const endSession = async () => {
    setIsRunning(false);

    let report;
    try {
      if (session.status !== "completed") {
        const totalFocusMinutes = Math.floor(sessionFocusTime / 60);
        const completedTasksCount = tasks.filter((task) => task.completed).length;
        report = await awardSession(totalFocusMinutes, completedTasksCount, sessions);
      }

      await updateSession(session.id, {
        tasks,
        status: "completed",
        totalFocusTime: sessionFocusTime,
        completedPomodoros,
        ...(report && { report })
      });
    } catch (e) {
      console.error("Failed to end session properly", e);
      await updateSession(session.id, { status: "completed", totalFocusTime: sessionFocusTime }).catch(console.error);
    }

    if (report) {
      sendNotification("Session complete! 🎉", `You earned +${report.earnedAP} AP and +${report.earnedXP} XP`);
    }

    setSessionCompleted(true);
  };

  // Progress calculation using dynamic durations
  const currentPhaseDuration = isBreak
    ? (isLongBreak ? LONG_BREAK_DURATION : breakDuration)
    : focusDuration;

  const progressPercentage = session.timerMode === "pomodoro"
    ? (currentPhaseDuration - seconds) / currentPhaseDuration * 100
    : 100;

  const circleRadius = 160;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = session.timerMode === "pomodoro"
    ? circleCircumference - (progressPercentage / 100) * circleCircumference
    : 0;

  if (sessionCompleted || session.status === "completed") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-6"
      >
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-3xl font-normal tracking-wide mb-2">Session Report</h1>
          <p className="text-lg text-[var(--text-secondary)] mb-12">{session.name}</p>

          <div className="flex flex-row justify-center gap-12 mb-16 border-y border-[var(--border)] py-8">
            <div className="text-center">
              <p className="text-xs font-mono uppercase text-[var(--text-muted)] mb-2">Focus Time</p>
              <p className="text-3xl font-light">{Math.floor(sessionFocusTime / 60)}m {sessionFocusTime % 60}s</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-mono uppercase text-[var(--text-muted)] mb-2">Tasks Completed</p>
              <p className="text-3xl font-light">{completedTaskCount} <span className="text-lg text-[var(--text-muted)]">/ {tasks.length}</span></p>
            </div>
            {session.report && (
              <>
                <div className="text-center">
                  <p className="text-xs font-mono uppercase text-[var(--accent)] mb-2">AP Earned</p>
                  <p className="text-3xl font-light text-[var(--accent)]">+{session.report.earnedAP}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-mono uppercase text-[var(--accent)] mb-2">XP Earned</p>
                  <p className="text-3xl font-light text-[var(--accent)]">+{session.report.earnedXP}</p>
                </div>
              </>
            )}
          </div>

          <div className="text-left mb-16 max-w-md mx-auto">
            <h2 className="text-sm font-mono uppercase text-[var(--text-muted)] mb-6 tracking-widest text-center">Task Breakdown</h2>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <div>
                    <p className={`text-base ${task.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs font-mono text-[var(--text-secondary)]">
                      {Math.floor(task.focusTime / 60)}m {task.focusTime % 60}s
                    </p>
                  </div>
                  <span className={`text-xs font-mono uppercase ${task.completed ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {task.completed ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/sessions")}
            className="border border-[var(--border)] px-8 py-3 text-sm font-medium hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Return to Sessions
          </button>
        </div>
      </motion.div>
    );
  }

  const phaseLabel = session.timerMode === "pomodoro"
    ? (isBreak ? (isLongBreak ? "Long Break" : "Break Phase") : "Focus Phase")
    : "Session Timer";
  const timerColor = "var(--text-primary)";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans relative"
    >
      {/* Animated Ambience Background */}
      <AmbienceBackground activeAmbience={activeAmbience} />

      {/* Break Wellness Overlay */}
      {session.timerMode === "pomodoro" && (
        <BreakOverlay
          isVisible={showBreakOverlay && isBreak}
          isLongBreak={isLongBreak}
          totalFocusMinutes={Math.floor(sessionFocusTime / 60)}
          onDismiss={() => setShowBreakOverlay(false)}
        />
      )}

      {/* Modals */}
      <AnimatePresence>
        {showStrictWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--bg-primary)] p-8 max-w-sm w-full border border-[var(--border)] text-center shadow-2xl">
              <h3 className="text-xl mb-4 font-medium" style={{ color: 'var(--text-primary)' }}>Strict Mode Paused</h3>
              <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your timer was automatically paused because you switched tabs or applications while in Strict Mode.
              </p>
              <button
                onClick={() => setShowStrictWarning(false)}
                className="px-6 py-3 text-sm uppercase tracking-widest border transition-colors w-full cursor-pointer hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                I Understand
              </button>
            </div>
          </div>
        )}

        {showAfkPrompt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          >
            <div
              className="absolute bg-[var(--bg-secondary)] border border-[var(--border)] p-6 rounded-lg shadow-xl"
              style={{ top: `${afkPosition.top}%`, left: `${afkPosition.left}%`, transform: 'translate(-50%, -50%)' }}
            >
              <p className="text-[var(--text-primary)] mb-4 text-center font-medium">Are you still focusing?</p>
              <button
                onClick={() => setShowAfkPrompt(false)}
                className="w-full py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium rounded hover:bg-[var(--text-secondary)] transition-colors"
              >
                I'm still focusing
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between p-8 relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/sessions")} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <h1 className="text-xl font-normal tracking-wide">{session.name}</h1>
        </div>

        {/* Pomodoro counter */}
        {session.timerMode === "pomodoro" && (
          <div className="flex items-center gap-2">
            {Array.from({ length: LONG_BREAK_INTERVAL }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full transition-colors"
                style={{
                  backgroundColor: i < (completedPomodoros % LONG_BREAK_INTERVAL)
                    ? 'var(--accent)'
                    : 'var(--border)'
                }}
              />
            ))}
            <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {completedPomodoros} done
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 pb-12 relative z-10">
        {/* Left Column: Timer */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="relative flex items-center justify-center w-full max-w-[400px] aspect-square">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 400 400">
              <circle cx="200" cy="200" r={circleRadius} fill="none" strokeWidth="2" stroke="var(--border)" />
              <motion.circle
                cx="200" cy="200" r={circleRadius} fill="none" strokeWidth="2" strokeLinecap="round"
                stroke={timerColor}
                initial={{ strokeDasharray: circleCircumference, strokeDashoffset: circleCircumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-6">{phaseLabel}</p>
              <div className="font-mono text-8xl font-light tracking-tighter text-[var(--text-primary)]">
                {timeString}
              </div>
              <div className="mt-8 h-12 flex flex-col items-center justify-center">
                {tasks[activeTask] && !isBreak && (
                  <>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1">Working On</p>
                    <p className="truncate max-w-[200px] text-sm text-[var(--text-secondary)]">{tasks[activeTask].title}</p>
                  </>
                )}
                {isBreak && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {isLongBreak ? "💧 Take a long break & hydrate" : "☕ Short break"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6">
            <button
              onClick={toggleTimer}
              className="w-32 py-3 text-sm font-medium transition-colors border border-[var(--text-primary)] text-[var(--bg-primary)] bg-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={resetTimer}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Reset
            </button>
          </div>

          <button onClick={endSession} className="mt-16 text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border-b border-transparent hover:border-[var(--text-primary)] pb-1">
            End session
          </button>
        </div>

        {/* Right Column: Tasks */}
        <div className="flex flex-col h-full lg:px-12 py-8 border-l border-[var(--border)]">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-xl font-normal tracking-wide">Tasks</h2>
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Focus</p>
              <p className="font-mono text-sm text-[var(--text-primary)]">{Math.floor(sessionFocusTime / 60)}m {sessionFocusTime % 60}s</p>
            </div>
          </div>

          <div className="relative mb-8">
            <input
              value={taskInput} onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              placeholder="Add a new task..."
              className="w-full bg-transparent border-b border-[var(--border)] py-3 text-sm outline-none transition-colors focus:border-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-4">
            <AnimatePresence>
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={`group flex items-start gap-4 p-3 transition-colors ${activeTask === index ? "bg-[var(--bg-secondary)]" : "hover:bg-[var(--bg-secondary)]/50"}`}
                >
                  {editingTaskId === task.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        autoFocus value={editingTaskTitle} onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveTaskEdit(); if (e.key === "Escape") setEditingTaskId(null); }}
                        className="flex-1 bg-transparent border-b border-[var(--text-primary)] py-1 text-sm outline-none"
                      />
                      <button onClick={saveTaskEdit} className="text-xs font-medium">Save</button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 w-4 h-4 appearance-none border border-[var(--border)] checked:bg-[var(--text-primary)] checked:border-[var(--text-primary)] cursor-pointer transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[5px] after:w-[4px] after:h-[8px] after:border-r-[1.5px] after:border-b-[1.5px] after:border-white after:rotate-45 after:opacity-0 checked:after:opacity-100"
                      />
                      <div className="flex-1 cursor-pointer" onClick={() => setActiveTask(index)}>
                        <p className={`text-sm transition-colors ${task.completed ? "text-[var(--text-muted)] line-through" : activeTask === index ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"}`}>
                          {task.title}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                          {Math.floor(task.focusTime / 60)}m {task.focusTime % 60}s
                        </p>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditing(task)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Ambience Player (floating bottom-right) */}
      <AmbiencePlayer
        isTimerRunning={isRunning}
        onAmbienceChange={setActiveAmbience}
      />
    </motion.div>
  );
}