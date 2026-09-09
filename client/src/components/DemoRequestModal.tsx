import React, { useState } from 'react';
import { X, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { m } from '../paraglide/messages.js';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    tcName: '',
    phone: '',
    email: '',
    city: 'г. Алматы',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.tcName || !formData.phone) {
      setError(m.demo_required());
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.sendDemoRequest(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || m.demo_error());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm tracking-tight text-white">
              {m.demo_title()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">{m.demo_success_title()}</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {m.demo_success_text({ tc: formData.tcName, phone: formData.phone })}
            </p>
            <div className="pt-3">
              <button
                onClick={() => {
                  setSuccess(false);
                  onClose();
                }}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-semibold"
              >
                {m.demo_close()}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              {m.demo_lead()}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {m.demo_name()} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={m.demo_name_ph()}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {m.demo_tc()} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.tcName}
                  onChange={e => setFormData({ ...formData, tcName: e.target.value })}
                  placeholder="ТОО «УЦ ...»"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {m.demo_phone()} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (7XX) XXX-XX-XX"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {m.demo_email()}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="director@uc-safety.kz"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                {m.demo_city()}
              </label>
              <select
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              >
                <option value="г. Алматы">{m.city_almaty()}</option>
                <option value="г. Астана">{m.city_astana()}</option>
                <option value="г. Шымкент">{m.city_shymkent()}</option>
                <option value="г. Атырау">{m.city_atyrau()}</option>
                <option value="г. Актау">{m.city_aktau()}</option>
                <option value="г. Караганда">{m.city_karaganda()}</option>
                <option value="г. Павлодар">{m.city_pavlodar()}</option>
                <option value="Другой регион РК">{m.city_other()}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                {m.demo_comment()}
              </label>
              <textarea
                rows={2}
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder={m.demo_comment_ph()}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold tracking-wide uppercase transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>{m.demo_sending()}</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{m.demo_submit()}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
