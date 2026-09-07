import React from 'react';
import { Shield, Target, Scale, TrendingUp, CheckCircle2, FileCheck, Lock } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
  onRequestDemo: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onRequestDemo }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-app mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider bg-blue-950 px-3 py-1 rounded border border-blue-800">
            <Shield className="w-3.5 h-3.5" />
            <span>О платформе SmartSafety РК</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Цифровой стандарт легальности и качества в сфере охраны труда Казахстана
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            Наша цель — технологическая модернизация системы подготовки и проверки знаний работников промышленных предприятий Республики Казахстан.
          </p>
        </div>
      </section>

      {/* Main Content Body */}
      <section className="py-14 max-w-app mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Mission Statement */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Миссия проекта SmartSafety
            </h2>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Исторически сфера подготовки по безопасности и охране труда (БиОТ) и промышленной безопасности в РК сталкивалась с проблемой формализма: выдача квалификационных удостоверений («корочек») без реальной проверки знаний, уязвимость бумажных тестов к списыванию и подделкам, а также тяжелая бюрократическая нагрузка на методистов Учебных Центров.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            SmartSafety трансформирует эту отрасль. Мы предоставляем независимую цифровую инфраструктуру, которая делает процесс обучения кристально прозрачным, защищенным от списывания и юридически безупречным при проверках государственной инспекцией труда.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Легальность и соответствие НПА</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Платформа полностью построена на требованиях статьи 79 Трудового кодекса РК, Правил проверки знаний № 1019 и Закона «О гражданской защите». Каждый сданный экзамен формирует легитимный цифровой след.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Защита от списывания</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Встроенные алгоритмы запрета копирования, блокировки поисковых систем, пресечения смены вкладок браузера и серверного сличения ответов гарантируют персональную сдачу теста курсантом.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Масштабирование бизнеса УЦ</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Учебный центр может одновременно обучать и аттестовывать тысячи работников крупных промышленных холдингов Казахстана без расширения штата преподавателей и ручной возни с бумагами.
            </p>
          </div>
        </div>

        {/* Regulatory Basis Accordion/List */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Нормативно-правовая база внедрения в Казахстане
            </h2>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Статья 79 Трудового Кодекса Республики Казахстан</span>
              </div>
              <p className="text-slate-600 pl-6">
                Регламентирует учет рабочего времени, прохождение обязательных инструктажей и проверок знаний. Электронные протоколы SmartSafety с цифровым ID принимаются инспекцией труда в качестве надлежащего доказательства прохождения обучения.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Правила проверки знаний № 1019</span>
              </div>
              <p className="text-slate-600 pl-6">
                «Об утверждении Правил и сроков проведения обучения, инструктирования и проверок знаний по вопросам безопасности и охраны труда работников». Экзаменационный модуль платформы строго настроен на 80% порог прохождения и регламентированный хронометраж.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Закон Республики Казахстан «О гражданской защите»</span>
              </div>
              <p className="text-slate-600 pl-6">
                Аттестация персонала опасных производственных объектов (ОПО). Исключает допуск неподготовленных работников к горным, буровым и электроустановочным работам.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Data Sovereignty */}
        <div className="bg-slate-900 text-white p-8 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Безопасность данных и суверенитет в РК
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Все серверные мощности платформы расположены на территории Республики Казахстан в соответствии с Законом РК «О персональных данных и их защите». Персональные данные курсантов (ФИО, предприятия, результаты тестов) передаются по шифрованным каналам (SSL/TLS) и не передаются третьим лицам.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRequestDemo}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold uppercase tracking-wider transition"
            >
              Запросить демо для руководства
            </button>
            <button
              onClick={() => onNavigate('/contacts')}
              className="px-6 py-3 border border-slate-700 text-slate-300 rounded text-sm hover:bg-slate-800 transition"
            >
              Контакты офиса в Алматы
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
