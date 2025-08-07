import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface TradingLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const TradingLayout: React.FC<TradingLayoutProps> = ({ children, showSidebar = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Trading', href: '/trading', icon: '📈' },
    { name: 'Strategies', href: '/strategies', icon: '🧠' },
    { name: 'Backtesting', href: '/backtesting', icon: '⚡' },
    { name: 'Portfolio', href: '/portfolio', icon: '💼' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#0c1015',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      {showSidebar && (
        <div style={{
          width: sidebarOpen ? '240px' : '60px',
          backgroundColor: '#111827',
          borderRight: '1px solid #374151',
          transition: 'width 0.2s ease',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Logo */}
          <div style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            borderBottom: '1px solid #374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Q</span>
              </div>
              {sidebarOpen && (
                <span style={{
                  marginLeft: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>QuantFlow</span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              ≡
            </button>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '12px 8px' }}>
            {navigationItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link key={item.name} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    color: isActive ? '#60a5fa' : '#d1d5db',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}>
                    <span style={{ fontSize: '16px', minWidth: '20px' }}>{item.icon}</span>
                    {sidebarOpen && <span style={{ marginLeft: '10px' }}>{item.name}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Connection Status */}
          <div style={{
            borderTop: '1px solid #374151',
            padding: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 10px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%'
              }}></div>
              {sidebarOpen && (
                <span style={{
                  marginLeft: '8px',
                  color: '#9ca3af',
                  fontSize: '11px'
                }}>Live</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <header style={{
          height: '48px',
          backgroundColor: '#111827',
          borderBottom: '1px solid #374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              margin: 0
            }}>
              {navigationItems.find(item => item.href === router.pathname)?.name || 'QuantFlow'}
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Market Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#10b981',
                borderRadius: '50%'
              }}></div>
              <span style={{
                color: '#9ca3af',
                fontSize: '12px'
              }}>Markets Open</span>
            </div>
            
            {/* User Menu */}
            <div style={{
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                color: 'white',
                fontSize: '11px',
                fontWeight: '500'
              }}>U</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#0c1015'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default TradingLayout;
