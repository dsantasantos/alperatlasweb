import React, { useEffect, useState } from 'react';
import './styles/app.css';
import Login from './pages/Login';
import AppShell from './components/layout/AppShell';
import { loginWithCredentials } from './api/auth';
import type { Session } from './types';

const CLIENT_ID     = import.meta.env.VITE_CLIENT_ID     as string | undefined;
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET as string | undefined;

export default function App() {
  const [session,    setSession]    = useState<Session | null>(null);
  const [authReady,  setAuthReady]  = useState(!CLIENT_ID || !CLIENT_SECRET);

  useEffect(() => {
    if (!CLIENT_ID || !CLIENT_SECRET) return;
    loginWithCredentials(CLIENT_ID, CLIENT_SECRET)
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

  if (!authReady) return null;
  if (!session)   return <Login onAuthenticated={setSession} />;
  return <AppShell session={session} onLogout={() => setSession(null)} />;
}
