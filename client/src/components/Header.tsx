import React, { useState } from 'react';
import { Shield, Lock, LogOut, Menu, X, UserCheck, Building2, ShieldAlert, Briefcase } from 'lucide-react';
import { UserSession } from '../types';
import { m } from '../paraglide/messages.js';
import { LanguageSwitcher } from './LanguageSwitcher';

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
    { path: '/', label: m.nav_home() },
    { path: '/about', label: m.nav_about() },
    { path: '/contacts', label: m.nav_contacts() },
  ];

  const getPortalPath = () => {
    if (!user) return '/portal/login';
    if (user.role === 'cadet') return '/portal/cadet';
    if (user.role === 'tc_admin') return '/portal/tc-admin';
    if (user.role === 'company_admin') return '/portal/company';
    if (user.role === 'super_admin') return '/portal/super-admin';
    return '/portal/login';
  };

  const getRoleLabel = () => {
    if (!user) return null;
    if (user.role === 'cadet') {
      return {
        title: user.cadet_fio ? user.cadet_fio : m.header_cadet_fallback({ login: user.login }),
        sub: user.group_name || m.header_group_fallback(),
        icon: UserCheck,
        badgeColor: 'bg-blue-900 text-blue-100 border-blue-700'
      };
    }
    if (user.role === 'tc_admin') {
      return {
        title: user.full_name,
        sub: user.tc_name || m.header_tc_fallback(),
        icon: Building2,
        badgeColor: 'bg-slate-800 text-slate-200 border-slate-700'
      };
    }
    if (user.role === 'company_admin') {
      return {
        title: user.full_name,
        sub: user.enterprise_name || m.header_company_fallback(),
        icon: Briefcase,
        badgeColor: 'bg-indigo-950 text-indigo-100 border-indigo-800'
      };
    }
    return {
      title: m.header_super_title(),
      sub: m.header_super_sub(),
      icon: ShieldAlert,
      badgeColor: 'bg-amber-950 text-amber-200 border-amber-800'
    };
  };

  const roleInfo = getRoleLabel();

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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
                {m.header_tagline()}
              </p>
            </div>
          </div>

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

          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher />
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
                  {m.header_to_cabinet()}
                </button>
                <button
                  onClick={onLogout}
                  title={m.header_logout()}
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
                  {m.header_request_demo()}
                </button>
                <button
                  onClick={() => onNavigate('/portal/login')}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-semibold tracking-wide transition shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{m.header_login()}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <button
                onClick={() => onNavigate(getPortalPath())}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium"
              >
                {m.header_cabinet()}
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

      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 sm:px-6 pt-2 pb-4 space-y-2">
          <LanguageSwitcher compact />
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
                  {m.header_go_cabinet()}
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-800 text-red-400 text-center rounded text-sm flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{m.header_logout_account()}</span>
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
                  <span>{m.header_login()}</span>
                </button>
                <button
                  onClick={() => {
                    onRequestDemo();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 border border-slate-700 text-slate-300 text-center rounded text-sm"
                >
                  {m.header_request_demo()}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
