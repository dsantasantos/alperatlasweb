import React, { useEffect, useState } from 'react';
import './styles/app.css';
import Login from './pages/Login';
import AppShell from './components/layout/AppShell';
import { clearAuthToken } from './api/client';
import type { Session } from './types';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const handler = () => { clearAuthToken(); setSession(null); };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  if (!session) return <Login onAuthenticated={setSession} />;
  return <AppShell session={session} onLogout={() => { clearAuthToken(); setSession(null); }} />;
}
