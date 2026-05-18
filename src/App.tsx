import Dashboard from './pages/Dashboard';
import LoginScreen from './pages/LoginScreen';
import { useAuth } from './context/AuthContext';

export default function App() {
  // Read the global state from Context
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0e] flex items-center justify-center">
        <div className="text-[#6b6864] animate-pulse font-mono text-[11px] uppercase tracking-widest">
          Verifying secure session...
        </div>
      </div>
    );
  }

  // If a user is logged, he enters. Otherwise, access denied
  return (
    <>
      {isAuthenticated ? <Dashboard /> : <LoginScreen />}
    </>
  );
}

