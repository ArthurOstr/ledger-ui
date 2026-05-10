import React from 'react';
import Dashboard from './pages/Dashboard';
import LoginScreen from './pages/LoginScreen';
import { useAuth } from './context/AuthContext';

function App() {
  // Read the global state from COntext 
  const { isAuthenticated } = useAuth();

  // If a user is logged, he enters. Otherwise access denied 
  return (
    <>
      {isAuthenticated ? <Dashboard /> : <LoginScreen />}
    </>
  );
}

export default App;
