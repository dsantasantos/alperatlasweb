import React, { useState } from 'react';
import logoUrl from '../assets/logoalper-trans.png';
import { I } from '../components/shared/Icons';
import type { Session } from '../types';

interface LoginProps {
  onAuthenticated: (session: Session) => void;
}

export default function Login({ onAuthenticated }: LoginProps) {
  const [user, setUser]         = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() === "admin" && password === "123@456") {
      setError("");
      onAuthenticated({ name: "Administrador", role: "admin" });
      return;
    }
    setError("Usuário ou senha inválidos.");
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
            <input value={user} onChange={e => setUser(e.target.value)} autoComplete="username" placeholder="admin" />
          </label>
          <label className="login-field">
            <span>Senha</span>
            <input value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" type="password" placeholder="123@456" />
          </label>
          {error && (
            <div className="login-error">
              <I n="alert" s={14} /> {error}
            </div>
          )}
          <button className="btn btn-primary login-submit" type="submit">
            Entrar <I n="arrowR" s={16} />
          </button>
          <div className="login-hint">Acesso simulado para protótipo corporativo.</div>
        </form>
        <div className="splash-foot">Protótipo · dados simulados para validação</div>
      </div>
    </div>
  );
}
