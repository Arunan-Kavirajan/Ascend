import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { useSessions, type Session } from '../context/SessionContext';
import PageTransition from '../components/PageTransition';
import { ConsistencyMatrix } from '../components/ConsistencyMatrix';
import { CircadianHorizon } from '../components/CircadianHorizon';
import { generateMatrix, calculateCircadian, calculateVelocity } from '../lib/telemetry';
import type { DayData } from '../lib/telemetry';

export default function Sessions() {
  const navigate = useNavigate();
  const { sessions, updateSession, deleteSession } = useSessions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const startEditing = (session: Session) => {
    setEditingId(session.id);
    setEditName(session.name);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateSession(editingId, { name: editName.trim() });
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this session?")) return;
    deleteSession(id);
  };

  const [selectedYear, setSelectedYear] = useState<number | 'last-365'>('last-365');

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

  // Telemetry Calculations
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
      setSelectedDate(null);
    } else {
      setSelectedDate(day.date);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <PageTransition>
        <main className="md:ml-60 min-h-screen px-4 py-8 md:px-12 md:py-16 pt-24 md:pt-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end justify-between mb-16">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Workspace
                </p>
                <h1 className="text-4xl font-medium tracking-tight">
                  Telemetry & Sessions
                </h1>
              </div>

              <button
                onClick={() => navigate("/sessions/new")}
                className="px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-indigo)' }}
              >
                + New Session
              </button>
            </div>

            {/* Telemetry Suite */}
            {sessions.length > 0 && (
              <div className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              </div>
            )}

            {/* Session History List */}
            <div className="flex justify-between items-end mb-6 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-medium text-white">
                {selectedDate ? `Sessions on ${selectedDate.toLocaleDateString()}` : 'Session History'}
              </h2>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                >
                  Clear Filter &times;
                </button>
              )}
            </div>

            {filteredSessions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No sessions found</p>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {selectedDate ? "No activity recorded on this day." : "Create your first session to start organizing your work."}
                </p>
                {!selectedDate && (
                  <button
                    onClick={() => navigate("/sessions/new")}
                    className="px-6 py-2 text-sm font-medium border transition-colors hover:bg-gray-50/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    Create Session
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-4 border-b text-xs uppercase tracking-widest font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Mode</div>
                  <div className="col-span-2">Tasks</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="flex flex-col">
                  {filteredSessions.map((session) => (
                    <motion.div 
                      key={session.id} 
                      layoutId={`session-${session.id}`}
                      className="grid grid-cols-12 gap-4 py-5 border-b items-center transition-colors hover:bg-white/5"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="col-span-5 flex items-center gap-3 pr-4">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: session.status === "completed" ? 'var(--text-muted)' : '#69db7c' }} 
                        />
                        {editingId === session.id ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            onBlur={saveEdit}
                            className="bg-transparent border-b outline-none text-sm w-full font-medium"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          />
                        ) : (
                          <span className="font-medium text-base truncate" style={{ color: session.status === "completed" ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {session.name}
                          </span>
                        )}
                      </div>
                      
                      <div className="col-span-2 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {session.timerMode === "pomodoro" ? "POMO" : "REG"}
                      </div>
                      
                      <div className="col-span-2 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {session.tasks.length}
                      </div>
                      
                      <div className="col-span-3 flex items-center justify-end gap-4 text-sm font-medium">
                        {session.status === 'completed' ? (
                          <button
                            onClick={() => navigate(`/sessions/${session.id}`)}
                            className="hover:underline transition-colors"
                            style={{ color: 'var(--accent)' }}
                          >
                            View Report
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => navigate(`/sessions/${session.id}`)}
                              className="hover:underline transition-colors"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              Open
                            </button>
                            <button
                              onClick={() => startEditing(session)}
                              className="hover:underline transition-colors"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="hover:underline transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
