import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Check } from 'lucide-react';
import { api } from '../api/client';
import { m } from '../paraglide/messages.js';

interface CadetFioModalProps {
  isOpen: boolean;
  groupName: string;
  enterpriseName?: string;
  onFioSaved: (fio: string) => void;
}

export const CadetFioModal: React.FC<CadetFioModalProps> = ({
  isOpen,
  groupName,
  enterpriseName,
  onFioSaved
}) => {
  const [fio, setFio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFio = fio.trim();
    if (!cleanFio || cleanFio.length < 5 || cleanFio.split(' ').length < 2) {
      setError(m.fio_invalid());
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const savedFio = await api.setCadetFio(cleanFio);
      onFioSaved(savedFio);
    } catch (err: any) {
      setError(err.message || m.fio_error());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {m.fio_title()}
              </h3>
              <p className="text-xs text-blue-200">
                {m.fio_sub()}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">{m.fio_group()}</span>
              <span className="font-semibold text-slate-900">{groupName}</span>
            </div>
            {enterpriseName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{m.fio_enterprise()}</span>
                <span className="font-semibold text-slate-900">{enterpriseName}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              {m.fio_label()} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={fio}
              onChange={e => {
                setFio(e.target.value);
                if (error) setError(null);
              }}
              placeholder={m.fio_ph()}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
            <p className="text-xs text-slate-500">
              {m.fio_hint()}
            </p>
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !fio.trim()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm"
            >
              {loading ? (
                <span>{m.fio_saving()}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{m.fio_confirm()}</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 leading-tight">
            {m.fio_trace()}
          </p>
        </form>
      </div>
    </div>
  );
};
