'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  UploadCloud,
  ClipboardList,
  AlertTriangle,
  LayoutDashboard,
  Activity,
  BarChart3,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/upload', label: 'Upload Claim', icon: UploadCloud, roles: ['user', 'officer'] },
  { href: '/claims', label: 'All Claims', icon: LayoutDashboard, roles: ['user', 'officer'] },
  { href: '/manual-review', label: 'Manual Review', icon: AlertTriangle, roles: ['officer'] },
  { href: '/analytics', label: 'AI Analytics', icon: BarChart3, roles: ['officer'] },
  { href: '/admin', label: 'Policy Admin', icon: Settings, roles: ['officer'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<'user' | 'officer'>('user');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('claimpilot_role');
    if (saved === 'officer' || saved === 'user') {
      setRole(saved);
    } else {
      localStorage.setItem('claimpilot_role', 'user');
    }
  }, []);

  const toggleRole = () => {
    const newRole = role === 'user' ? 'officer' : 'user';
    setRole(newRole);
    localStorage.setItem('claimpilot_role', newRole);
    window.location.reload();
  };

  if (!isMounted) return <aside style={{ width: '240px', background: 'var(--surface)' }} />;

  return (
    <aside
      style={{
        width: '240px',
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.3px' }}>
              ClaimPilot
            </div>
            <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '1px' }}>
              AI Operations
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 12px', flex: 1 }}>
        <div style={{ marginBottom: '6px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--foreground-subtle)',
              padding: '0 8px',
              marginBottom: '8px',
            }}
          >
            Operations
          </div>
          {NAV_ITEMS.filter(item => item.roles.includes(role)).map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'var(--foreground-muted)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))'
                    : 'transparent',
                  borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} style={{ opacity: isActive ? 1 : 0.6 }} />
                {label}
                {href === '/manual-review' && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'var(--review)',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 7px',
                    }}
                  >
                    2
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer / Role Toggle */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--foreground-subtle)',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={toggleRole}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: role === 'officer' ? 'rgba(167,139,250,0.1)' : 'transparent',
              color: role === 'officer' ? '#a78bfa' : 'var(--foreground)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
            }}
          >
            <span>Viewing as:</span>
            <span style={{ 
              background: role === 'officer' ? '#a78bfa' : 'var(--foreground-muted)', 
              color: role === 'officer' ? '#fff' : '#fff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {role}
            </span>
          </button>
        </div>
        <div style={{ marginBottom: '2px', fontWeight: 600 }}>v1.0.0</div>
        <div>Plum Assignment · 2024</div>
      </div>
    </aside>
  );
}
