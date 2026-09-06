import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, ExternalLink, Navigation } from 'lucide-react';
import { api } from '../api/client';

export const ContactsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    tcName: '',
    phone: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.tcName || !formData.phone) {
      setError('Пожалуйста, укажите имя, название УЦ и телефон для связи');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.sendDemoRequest(formData);
      setSuccess(true);
      setFormData({ name: '', tcName: '', phone: '', email: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-app mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider bg-blue-950 px-3 py-1 rounded border border-blue-800">
            <Mail className="w-3.5 h-3.5" />
            <span>Контакты и представительство</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Свяжитесь с командой SmartSafety в Казахстане
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Мы готовы провести выездную или онлайн-демонстрацию для руководства вашего учебного центра в любом регионе Республики Казахстан.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <section className="py-14 max-w-app mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left Column: Contact Form */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Форма обратной связи для Учебных Центров
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Заполните форму, и ведущий специалист по внедрению свяжется с вами в течение 15 минут в рабочее время.
              </p>
            </div>

            {success ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm">Ваше сообщение успешно отправлено!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Менеджер по работе с учебными центрами уже обрабатывает заявку. Мы подготовим индивидуальный расчет и перезвоним вам.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-sm font-semibold transition"
                >
                  Отправить еще одно сообщение
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Ваше ФИО <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Алиев Данияр"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Название УЦ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tcName}
                      onChange={e => setFormData({ ...formData, tcName: e.target.value })}
                      placeholder="ТОО «УЦ ПрофБезопасность»"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Телефон в Казахстане <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+7 (707) 123-45-67"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Электронная почта
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@safety-center.kz"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Сообщение или вопрос
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Опишите ваши потребности (число обучающихся курсантов, интеграции с предприятиями, запуск тестов...)"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  {loading ? (
                    <span>Отправка данных...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Отправить запрос на подключение УЦ</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Messengers Block */}
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Быстрая связь в мессенджерах:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://wa.me/77073495510?text=Здравствуйте!%20Хотим%20узнать%20подробнее%20о%20платформе%20SmartSafety%20для%20нашего%20Учебного%20Центра"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-900 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-xs leading-tight">
                    <span className="font-bold block">WhatsApp Business</span>
                    <span className="text-emerald-700 text-xs">+7 (707) 349-55-10</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600 ml-auto" />
                </a>

                <a
                  href="https://t.me/smartsafety_kz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-sky-900 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="text-xs leading-tight">
                    <span className="font-bold block">Telegram-канал</span>
                    <span className="text-sky-700 text-xs">@smartsafety_kz</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600 ml-auto" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Map & Requisites */}
          <div className="space-y-6">
            {/* Interactive Vector Map of Almaty Hub */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-xs">Главный офис: г. Алматы, Казахстан</span>
                </div>
                <span className="text-[11px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono">
                  43.2220° N, 76.9535° E
                </span>
              </div>

              {/* Styled Interactive SVG Map representation of Almaty Business District (Al-Farabi / Dostyk / Nurly Tau) */}
              <div className="relative bg-slate-950 p-4 h-[320px] flex items-center justify-center overflow-hidden">
                {/* SVG Visual Map */}
                <svg
                  viewBox="0 0 600 360"
                  className="w-full h-full text-slate-800 opacity-90 select-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Mountain backdrop hint */}
                  <path
                    d="M 0 60 L 90 20 L 170 50 L 260 10 L 350 45 L 430 15 L 520 40 L 600 20 L 600 360 L 0 360 Z"
                    fill="#0b1329"
                  />
                  {/* Grid lines (city streets) */}
                  <line x1="0" y1="120" x2="600" y2="120" stroke="#1e293b" strokeWidth="2" />
                  <line x1="0" y1="200" x2="600" y2="200" stroke="#334155" strokeWidth="4" /> {/* Al-Farabi Ave */}
                  <line x1="0" y1="270" x2="600" y2="270" stroke="#1e293b" strokeWidth="2" />
                  <line x1="140" y1="0" x2="140" y2="360" stroke="#1e293b" strokeWidth="2" />
                  <line x1="300" y1="0" x2="300" y2="360" stroke="#334155" strokeWidth="3" /> {/* Furmanov / Nazarbayev */}
                  <line x1="450" y1="0" x2="450" y2="360" stroke="#334155" strokeWidth="3" /> {/* Dostyk Ave */}

                  {/* Street Labels */}
                  <text x="30" y="192" fill="#64748b" fontSize="11" fontFamily="sans-serif">
                    пр. Аль-Фараби
                  </text>
                  <text x="455" y="80" fill="#64748b" fontSize="11" fontFamily="sans-serif">
                    пр. Достык
                  </text>
                  <text x="305" y="80" fill="#64748b" fontSize="11" fontFamily="sans-serif">
                    пр. Назарбаева
                  </text>

                  {/* Financial District Buildings */}
                  <rect x="230" y="145" width="55" height="45" rx="3" fill="#1e3a8a" opacity="0.6" />
                  <rect x="235" y="150" width="15" height="15" fill="#38bdf8" opacity="0.4" />
                  <rect x="260" y="150" width="15" height="15" fill="#38bdf8" opacity="0.4" />
                  
                  {/* Pin Circle Pulsing */}
                  <circle cx="260" cy="170" r="16" fill="#2563eb" opacity="0.3" className="animate-ping" />
                  <circle cx="260" cy="170" r="8" fill="#3b82f6" />
                  <circle cx="260" cy="170" r="3" fill="#ffffff" />
                </svg>

                {/* Floating Office Card over Map */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3.5 rounded-lg shadow-lg text-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-300">БЦ «Нурлы Тау», блок 4Б, 9 этаж</span>
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                      Открыто 09:00 - 18:00
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    проспект Аль-Фараби, 19, Бостандыкский район, г. Алматы, 050059
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <a
                      href="https://yandex.kz/maps/-/CDa1IUZG"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Открыть в Яндекс Картах / 2GIS</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Requisites Box */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Официальные реквизиты компании
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Юридическое наименование:</span>
                  <span className="font-semibold text-slate-900">ТОО «SmartSafety Technologies»</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">БИН организации:</span>
                  <span className="font-mono font-bold text-slate-900">220940018932</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Головной офис:</span>
                  <span className="font-semibold text-slate-900">Республика Казахстан, г. Алматы</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Горячая линия:</span>
                  <a href="tel:+77273495510" className="font-semibold text-blue-700 hover:underline">
                    +7 (727) 349-55-10
                  </a>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Отдел по работе с УЦ:</span>
                  <a href="mailto:director@smartsafety.kz" className="font-semibold text-blue-700 hover:underline">
                    director@smartsafety.kz
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
