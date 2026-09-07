import React, { useState } from 'react';
import { Shield, Lock, LogOut, Menu, X, UserCheck, Building2, ShieldAlert } from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: UserSession | null;
  onLogout: () => void;
  onRequestDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  user,
  onLogout,
  onRequestDemo
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Главная' },
    { path: '/about', label: 'О компании' },
    { path: '/contacts', label: 'Контакты' },
  ];

  const getPortalPath = () => {
    if (!user) return '/portal/login';
    if (user.role === 'cadet') return '/portal/cadet';
    if (user.role === 'tc_admin') return '/portal/tc-admin';
    if (user.role === 'super_admin') return '/portal/super-admin';
    return '/portal/login';
  };

  const getRoleLabel = () => {
    if (!user) return null;
    if (user.role === 'cadet') {
      return {
        title: user.cadet_fio ? user.cadet_fio : `Курсант (${user.login})`,
        sub: user.group_name || 'Учебная группа',
        icon: UserCheck,
        badgeColor: 'bg-blue-900 text-blue-100 border-blue-700'
      };
    }
    if (user.role === 'tc_admin') {
      return {
        title: user.full_name,
        sub: user.tc_name || 'Учебный Центр',
        icon: Building2,
        badgeColor: 'bg-slate-800 text-slate-200 border-slate-700'
      };
    }
    return {
      title: 'Главный Администратор',
      sub: 'Владелец платформы CMS',
      icon: ShieldAlert,
      badgeColor: 'bg-amber-950 text-amber-200 border-amber-800'
    };
  };

  const roleInfo = getRoleLabel();

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner group-hover:bg-blue-500 transition-colors">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">SmartSafety</span>
              <p className="text-xs text-slate-400 hidden sm:block">
                Цифровая инфраструктура для аккредитованных УЦ
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`transition-colors py-1.5 ${
                  currentPath === link.path
                    ? 'text-white border-b-2 border-blue-500 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {roleInfo && (
                  <div
                    onClick={() => onNavigate(getPortalPath())}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md border text-sm cursor-pointer hover:opacity-90 transition ${roleInfo.badgeColor}`}
                  >
                    <roleInfo.icon className="w-4 h-4 shrink-0 text-white" />
                    <div className="text-left leading-tight">
                      <div className="font-medium truncate max-w-[160px]">{roleInfo.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{roleInfo.sub}</div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => onNavigate(getPortalPath())}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-semibold tracking-wide transition shadow-sm"
                >
                  В кабинет
                </button>
                <button
                  onClick={onLogout}
                  title="Выйти из системы"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={onRequestDemo}
                  className="px-4 py-2 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-200 rounded-md text-sm font-medium transition"
                >
                  Запросить демо
                </button>
                <button
                  onClick={() => onNavigate('/portal/login')}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-semibold tracking-wide transition shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Вход в систему</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <button
                onClick={() => onNavigate(getPortalPath())}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium"
              >
                Кабинет
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 sm:px-6 pt-2 pb-4 space-y-2">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => {
                onNavigate(link.path);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-800"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-slate-800 rounded text-xs">
                  <p className="font-semibold text-white">{user.cadet_fio || user.full_name}</p>
                  <p className="text-slate-400">{user.group_name || user.tc_name}</p>
                </div>
                <button
                  onClick={() => {
                    onNavigate(getPortalPath());
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-blue-600 text-white text-center rounded text-sm font-semibold"
                >
                  Перейти в кабинет
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-800 text-red-400 text-center rounded text-sm flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти из аккаунта</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onNavigate('/portal/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-blue-600 text-white text-center rounded text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Вход в систему</span>
                </button>
                <button
                  onClick={() => {
                    onRequestDemo();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 border border-slate-700 text-slate-300 text-center rounded text-sm"
                >
                  Запросить демо
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
