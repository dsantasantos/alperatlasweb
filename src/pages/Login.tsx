import React, { useState } from 'react';
import logoUrl from '../assets/logoalper-trans.png';
import { I } from '../components/shared/Icons';
import type { Session } from '../types';
import { login } from '../api/auth';
import { ApiError } from '../api/client';

interface LoginProps {
  onAuthenticated: (session: Session) => void;
}

export default function Login({ onAuthenticated }: LoginProps) {
  const [user, setUser]         = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login(user.trim(), password);
      onAuthenticated(session);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Usuário ou senha inválidos.");
      } else {
        setError("Serviço indisponível. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="splash">
      <div className="splash-card">
        <img src={logoUrl} alt="Alper Atlas" className="splash-logo" />
        <div className="splash-sub">Alper Atlas</div>
        <p className="splash-desc">
          Plataforma de tradução de qualquer fonte para conferência humana e envio para
          operadoras / seguradoras.
        </p>
        <form className="login-form" onSubmit={submit}>
          <label className="login-field">
            <span>Usuário</span>
            <input value={user} onChange={e => setUser(e.target.value)} autoComplete="username" placeholder="usuário" disabled={loading} />
          </label>
          <label className="login-field">
            <span>Senha</span>
            <input value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" type="password" placeholder="senha" disabled={loading} />
          </label>
          {error && (
            <div className="login-error">
              <I n="alert" s={14} /> {error}
            </div>
          )}
          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? "Entrando…" : <><span>Entrar</span> <I n="arrowR" s={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
