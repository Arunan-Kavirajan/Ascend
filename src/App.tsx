import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { auth } from "./lib/firebase";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { SessionProvider } from "./context/SessionContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateSession from "./pages/CreateSession";
import ActiveSession from "./pages/ActiveSession";
import Sessions from "./pages/Sessions";
import Leaderboard from "./pages/Leaderboard";
import Achievements from "./pages/Achievements";
import Store from "./pages/Store";

function AppRoutes({ user }: { user: User | null }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/sessions" element={user ? <Sessions /> : <Navigate to="/login" />} />
        <Route path="/sessions/new" element={user ? <CreateSession /> : <Navigate to="/login" />} />
        <Route path="/sessions/:sessionId" element={user ? <ActiveSession /> : <Navigate to="/login" />} />
        
        {/* New Pages */}
        <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
        <Route path="/achievements" element={user ? <Achievements /> : <Navigate to="/login" />} />
        <Route path="/store" element={user ? <Store /> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }} />;
  }

  return (
    <ThemeProvider>
      <div className="noise-overlay"></div>
      <BrowserRouter>
        <UserProvider>
          <SessionProvider>
            <AppRoutes user={user} />
          </SessionProvider>
        </UserProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
