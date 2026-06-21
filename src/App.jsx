import React, { useState } from 'react';
import './styles/app.css';
import Login from './pages/Login';
import AppShell from './components/layout/AppShell';

export default function App() {
  const [session, setSession] = useState(null);

  if (!session) return <Login onAuthenticated={setSession} />;
  return <AppShell session={session} onLogout={() => setSession(null)} />;
}
