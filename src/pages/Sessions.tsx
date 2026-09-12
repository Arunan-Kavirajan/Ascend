import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { useSessions, type Session } from '../context/SessionContext';
import PageTransition from '../components/PageTransition';

export default function Sessions() {
  const navigate = useNavigate();
  const { sessions, updateSession, deleteSession } = useSessions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <PageTransition>
        <main className="ml-60 min-h-screen px-12 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end justify-between mb-16">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Workspace
                </p>
                <h1 className="text-4xl font-medium tracking-tight">
                  Sessions
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

            {sessions.length === 0 ? (
              <div className="py-20 text-center border-t border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No sessions yet</p>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Create your first session to start organizing your work.
                </p>
                <button
                  onClick={() => navigate("/sessions/new")}
                  className="px-6 py-2 text-sm font-medium border transition-colors hover:bg-gray-50/5"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  Create Session
                </button>
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
                  {sessions.map((session) => (
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
