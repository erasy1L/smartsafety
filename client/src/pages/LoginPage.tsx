import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { UserSession } from '../types';
import { m } from '../paraglide/messages.js';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) {
      setError(m.login_required());
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const session = await api.login(login.trim(), password.trim());
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || m.login_auth_error());
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoLogin: string, demoPass: string) => {
    setLogin(demoLogin);
    setPassword(demoPass);
    setError(null);
    try {
      setLoading(true);
      const session = await api.login(demoLogin, demoPass);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-3 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/40">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {m.login_title()}
        </h1>
        <p className="text-xs text-slate-400">
          {m.login_sub()}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-xl border border-slate-800 space-y-6">
          {/* Strict Auth Notice */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-slate-300 block">{m.login_no_reg()}</span>
              {m.login_no_reg_text()}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                {m.login_login()} <span className="text-slate-500">{m.login_login_hint()}</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="kursant_biot или admin_qorgau"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                {m.login_password()}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/70 border border-red-800/80 rounded text-xs text-red-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-md text-sm font-bold uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-sm"
            >
              {loading ? (
                <span>{m.login_checking()}</span>
              ) : (
                <>
                  <span>{m.login_enter()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel for Evaluators / Reviewers */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {m.login_quick()}
              </span>
              <span className="text-[11px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-900">
                Demo
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-left">
              {/* Cadet 1 */}
              <button
                type="button"
                onClick={() => handleQuickDemo('kursant_biot', '123')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-sm flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded bg-blue-900/60 text-blue-400 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block group-hover:text-blue-300">
                      {m.login_level1()}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.login_level1_sub({ login: 'kursant_biot' })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
              </button>

              {/* TC Admin */}
              <button
                type="button"
                onClick={() => handleQuickDemo('admin_qorgau', 'qorgau123')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-sm flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded bg-emerald-900/60 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block group-hover:text-emerald-300">
                      {m.login_level2()}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.login_level2_sub({ login: 'admin_qorgau' })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
              </button>

              {/* Company Admin */}
              <button
                type="button"
                onClick={() => handleQuickDemo('admin_kazmunay', 'company123')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-sm flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded bg-indigo-900/60 text-indigo-400 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block group-hover:text-indigo-300">
                      {m.login_level3()}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.login_level3_kaz({ login: 'admin_kazmunay' })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin_samruk', 'samruk123')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-sm flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded bg-indigo-900/60 text-indigo-400 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block group-hover:text-indigo-300">
                      {m.login_level3()}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.login_level3_samruk({ login: 'admin_samruk' })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
              </button>

              {/* Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickDemo('superadmin', 'admin2026')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-sm flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded bg-amber-900/60 text-amber-400 flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block group-hover:text-amber-300">
                      {m.login_level4()}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.login_level4_sub({ login: 'superadmin' })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('/')}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            {m.login_back()}
          </button>
        </div>
      </div>
    </div>
  );
};
