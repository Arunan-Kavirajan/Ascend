import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/auth';
import PageTransition from '../components/PageTransition';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Failed to log in', error);
    }
  };

  return (
    <PageTransition>
      <div 
        className="relative min-h-screen flex items-center justify-center overflow-hidden" 
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Soft radial gradient */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, var(--bg-tertiary) 0%, transparent 60%)',
            opacity: 0.8
          }}
        />
        
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <main className="relative z-10 w-full max-w-md px-6">
          <div className="flex flex-col items-center mb-12 text-center">
            <h1 
              className="font-mono uppercase text-3xl font-bold tracking-[0.3em] mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Ascend
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Focus. Progress. Grow.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-xl border p-10 flex flex-col items-center text-center shadow-2xl" 
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)'
            }}
          >
            <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
            <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to continue your journey.</p>
            
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded font-medium transition-colors hover:bg-gray-100 text-gray-900 bg-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </motion.div>
          
          <div className="mt-8 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
            &copy; {new Date().getFullYear()} Ascend. All rights reserved.
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
