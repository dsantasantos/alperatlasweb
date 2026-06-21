import React, { useState } from 'react';
import './styles/app.css';
import Login from './pages/Login';
import AppShell from './components/layout/AppShell';
import type { Session } from './types';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  if (!session) return <Login onAuthenticated={setSession} />;
  return <AppShell session={session} onLogout={() => setSession(null)} />;
}
