import React from 'react';
import { Shield, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Platform Overview */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">SmartSafety РК</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Специализированная цифровая платформа для аккредитованных учебных центров Республики Казахстан по БиОТ, промышленной и пожарной безопасности.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1.5 rounded">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Соответствие ст. 79 ТК РК и Приказу № 1019</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
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
                  Контакты и карта
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/portal/login')} className="text-blue-400 hover:text-blue-300 transition">
                  Вход для курсантов и УЦ
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Features */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Нормативная база РК
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Трудовой Кодекс РК (ст. 79, 181, 182)</li>
              <li>• Закон РК «О гражданской защите» (ОПО)</li>
              <li>• Приказ МЗСР РК № 1019 от 25.12.2015 г.</li>
              <li>• Техрегламент пожарной безопасности РК</li>
              <li>• Неизменяемый цифровой реестр протоколов</li>
            </ul>
          </div>

          {/* Col 4: Contacts & Headquarters */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Связь с нами
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>г. Алматы, пр. Аль-Фараби 19, БЦ «Нурлы Тау», блок 4Б</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <a href="tel:+77273495510" className="hover:text-white transition">+7 (727) 349-55-10</a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <a href="mailto:info@smartsafety.kz" className="hover:text-white transition">info@smartsafety.kz</a>
              </li>
              <li className="pt-1">
                <div className="inline-block text-xs bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-400">
                  БИН 220940018932 • ТОО «SmartSafety Tech»
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SmartSafety. Цифровая экосистема проверки знаний по охране труда в РК.</p>
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
