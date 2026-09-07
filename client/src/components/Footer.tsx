import React from 'react';
import { Shield, Mail, Phone } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">SmartSafety РК</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Специализированная цифровая платформа для аккредитованных учебных центров Республики Казахстан.
            </p>
          </div>

          {/* Nav + contacts as a tight pair */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                Разделы портала
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => onNavigate('/')} className="hover:text-white transition">
                    Главная страница
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/about')} className="hover:text-white transition">
                    О компании и миссии
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/contacts')} className="hover:text-white transition">
                    Контакты
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/portal/login')} className="text-blue-400 hover:text-blue-300 transition">
                    Вход для курсантов и УЦ
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                Связь с нами
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <a href="tel:+77273495510" className="hover:text-white transition">+7 (727) 349-55-10</a>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <a href="mailto:info@smartsafety.kz" className="hover:text-white transition">info@smartsafety.kz</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SmartSafety. Цифровая экосистема проверки знаний.</p>
          <div className="flex space-x-4 mt-3 sm:mt-0">
            <span>Защита от копирования активна</span>
            <span>•</span>
            <span>Серверная верификация тестов</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
