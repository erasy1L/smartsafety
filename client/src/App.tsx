import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DemoRequestModal } from './components/DemoRequestModal';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ContactsPage } from './pages/ContactsPage';
import { LoginPage } from './pages/LoginPage';
import { CadetPortal } from './pages/CadetPortal';
import { TcAdminPortal } from './pages/TcAdminPortal';
import { SuperAdminPortal } from './pages/SuperAdminPortal';
import { api, getSavedSession } from './api/client';
import { UserSession } from './types';
import { useLocale } from './locale';

export const App: React.FC = () => {
  const { locale } = useLocale();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [user, setUser] = useState<UserSession | null>(() => getSavedSession());
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check auth session validity on launch
  useEffect(() => {
    api.checkAuth().then(verifiedUser => {
      if (verifiedUser) {
        setUser(verifiedUser);
      }
    });
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUser(session);
    if (session.role === 'cadet') {
      navigate('/portal/cadet');
    } else if (session.role === 'tc_admin') {
      navigate('/portal/tc-admin');
    } else if (session.role === 'company_admin') {
      navigate('/portal/company');
    } else if (session.role === 'super_admin') {
      navigate('/portal/super-admin');
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    navigate('/portal/login');
  };

  // Route Guarding & Page Renderer
  const renderPage = () => {
    // 1. Portal Cadet
    if (currentPath === '/portal/cadet') {
      if (!user || user.role !== 'cadet') {
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={navigate}
          />
        );
      }
      return (
        <CadetPortal
          user={user}
          onUpdateUser={setUser}
          onNavigate={navigate}
        />
      );
    }

    // 2. Portal TC Admin
    if (currentPath === '/portal/tc-admin') {
      if (!user || (user.role !== 'tc_admin' && user.role !== 'super_admin')) {
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={navigate}
          />
        );
      }
      return (
        <TcAdminPortal
          user={user}
          onNavigate={navigate}
        />
      );
    }

    // 2b. Portal Company Admin
    if (currentPath === '/portal/company') {
      if (!user || user.role !== 'company_admin') {
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={navigate}
          />
        );
      }
      return (
        <TcAdminPortal
          user={user}
          onNavigate={navigate}
        />
      );
    }

    // 3. Portal Super Admin
    if (currentPath === '/portal/super-admin') {
      if (!user || user.role !== 'super_admin') {
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={navigate}
          />
        );
      }
      return (
        <SuperAdminPortal
          user={user}
          onNavigate={navigate}
        />
      );
    }

    // 4. Portal Login
    if (currentPath === '/portal/login') {
      if (user) {
        if (user.role === 'cadet') return <CadetPortal user={user} onUpdateUser={setUser} onNavigate={navigate} />;
        if (user.role === 'tc_admin') return <TcAdminPortal user={user} onNavigate={navigate} />;
        if (user.role === 'company_admin') return <TcAdminPortal user={user} onNavigate={navigate} />;
        if (user.role === 'super_admin') return <SuperAdminPortal user={user} onNavigate={navigate} />;
      }
      return (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigate={navigate}
        />
      );
    }

    // 5. Public: About
    if (currentPath === '/about') {
      return (
        <AboutPage
          onNavigate={navigate}
          onRequestDemo={() => setDemoModalOpen(true)}
        />
      );
    }

    // 6. Public: Contacts
    if (currentPath === '/contacts') {
      return <ContactsPage />;
    }

    // 7. Public: Home (default)
    return (
      <HomePage
        onNavigate={navigate}
        onRequestDemo={() => setDemoModalOpen(true)}
      />
    );
  };

  const isPortalView = currentPath.startsWith('/portal/') && currentPath !== '/portal/login';

  return (
    <div key={locale} className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-900 selection:text-white">
      {/* Top Header Navigation */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        user={user}
        onLogout={handleLogout}
        onRequestDemo={() => setDemoModalOpen(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Footer on public pages and login page */}
      {!isPortalView && <Footer onNavigate={navigate} />}

      {/* Modal: Request Demo */}
      <DemoRequestModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
};
