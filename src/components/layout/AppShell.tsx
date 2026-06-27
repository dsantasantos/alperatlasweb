import { useState } from 'react';
import { I } from '../shared/Icons';
import type { IconName } from '../shared/Icons';
import logoUrl from '../../assets/logoalper-trans.png';
import CadastralMoviment from '../../pages/moviment/CadastralMoviment';
import CadastralMovimentDefaut from '../../pages/moviment/CadastralMovimentDefaut';
import Documentation from '../../pages/admin/Documentation';
import type { Session } from '../../types';

// ===== Navigation structure =====
interface NavItem  { id: string; label: string; icon: IconName }
interface NavGroup { group: string; icon: IconName; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    group: 'Movimentação',
    icon: 'swap',
    items: [
      { id: 'cadastral-moviment', label: 'Movimentação Cadastral', icon: 'package' },
      { id: 'cadastral-moviment-default', label: 'Movimentação Cadastral (API)', icon: 'package' }
    ]
  },
  {
    group: 'Admin',
    icon: 'shield',
    items: [
      { id: 'documentation', label: 'Documentação', icon: 'book' }
    ]
  }
];

function getPageMeta(pageId: string): { group: string; label: string } {
  for (const g of NAV) {
    const item = g.items.find(i => i.id === pageId);
    if (item) return { group: g.group, label: item.label };
  }
  return { group: '', label: '' };
}

// ===== Component =====
interface AppShellProps {
  session: Session;
  onLogout: () => void;
}

export default function AppShell({ session, onLogout }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage]   = useState('cadastral-moviment');

  const { group, label } = getPageMeta(activePage);

  const navigate = (pageId: string) => {
    setActivePage(pageId);
    setSidebarOpen(false);
  };

  return (
    <div className="shell">
      {/* ===== Topbar ===== */}
      <header className="topbar">
        <button className="topbar-ham" onClick={() => setSidebarOpen(s => !s)} aria-label="Menu">
          <I n="menu" s={20} />
        </button>

        <div className="topbar-brand">
          <span className="topbar-brand-mark"><I n="compass" s={16} /></span>
          alper atlas
        </div>

        {label && (
          <>
            <span className="topbar-sep">/</span>
            <span className="topbar-group">{group}</span>
            <span className="topbar-sep">/</span>
            <span className="topbar-page">{label}</span>
          </>
        )}

        <div className="topbar-user">
          <div className="topbar-avatar">{session.name.slice(0, 2).toUpperCase()}</div>
          <span className="topbar-username">{session.name}</span>
        </div>
      </header>

      {/* ===== Nav sidebar ===== */}
      {sidebarOpen && <div className="nav-overlay" onClick={() => setSidebarOpen(false)} />}

      <nav className={"nav-sidebar" + (sidebarOpen ? " open" : "")}>
        <div className="nav-sidebar-head">
          <div className="nav-sidebar-brand">
            <img src={logoUrl} alt="Alper Atlas" className="nav-logo" />
          </div>
          <button className="nav-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <I n="x" s={18} />
          </button>
        </div>

        <div className="nav-body">
          {NAV.map(g => (
            <div key={g.group} className="nav-group">
              <div className="nav-group-label">
                <I n={g.icon} s={12} /> {g.group}
              </div>
              {g.items.map(item => (
                <button
                  key={item.id}
                  className={"nav-item" + (activePage === item.id ? " active" : "")}
                  onClick={() => navigate(item.id)}
                >
                  <I n={item.icon} s={15} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="nav-foot">
          <div className="nav-foot-user">
            <div className="nav-foot-avatar">{session.name.slice(0, 2).toUpperCase()}</div>
            <div className="nav-foot-info">
              <div className="nav-foot-name">{session.name}</div>
              <div className="nav-foot-role">{session.role}</div>
            </div>
          </div>
          <button className="nav-logout" onClick={onLogout}>
            <I n="logOut" s={15} /> Sair
          </button>
        </div>
      </nav>

      {/* ===== Page content ===== */}
      <div className="shell-content">
        {activePage === 'cadastral-moviment' && <CadastralMoviment />}
        {activePage === 'cadastral-moviment-default' && <CadastralMovimentDefaut />}
        {activePage === 'documentation' && <Documentation />}
      </div>
    </div>
  );
}
