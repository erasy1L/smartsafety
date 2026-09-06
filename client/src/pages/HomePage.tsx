import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  Languages,
  FileSpreadsheet,
  Users,
  Award,
  ArrowRight,
  Calculator,
  Lock,
  CheckCircle,
  Building,
  BarChart3,
  Cpu
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onRequestDemo: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onRequestDemo }) => {
  // Calculator State
  const [cadetsPerMonth, setCadetsPerMonth] = useState(250);
  const [testChecksPerHour, setTestChecksPerHour] = useState(8);

  const hoursSavedPerMonth = Math.round(cadetsPerMonth / testChecksPerHour * 1.5);
  const paperSheetsSaved = cadetsPerMonth * 12; // protocols, answer sheets, tests
  const moneySavedTenge = hoursSavedPerMonth * 4500; // estimated specialist wage in KZ

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* Regulatory compliance pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-300 text-xs font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Соответствие ст. 79 ТК РК и Приказу МЗСР РК № 1019</span>
          </div>

          {/* Main Title & Subtitle */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Цифровая инфраструктура для аккредитованных учебных центров
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Автоматизация проверок знаний, защита от списывания и прозрачные цифровые следы обучения в соответствии с требованиями законодательства РК
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onRequestDemo}
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition shadow-lg shadow-blue-900/30 flex items-center justify-center space-x-2"
            >
              <span>Запросить презентацию</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/portal/login')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg font-medium text-sm transition flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Вход в закрытый портал</span>
            </button>
          </div>

          {/* Trust stats bar */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-800/80 text-left">
            <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">100%</div>
              <div className="text-xs text-slate-400">Легитимность в РК (ст. 79 ТК РК)</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">10x</div>
              <div className="text-xs text-slate-400">Ускорение выдачи протоколов</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">0 бумаг</div>
              <div className="text-xs text-slate-400">Автоматическая выгрузка в Excel</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">2 языка</div>
              <div className="text-xs text-slate-400">Интерфейс и тесты на каз / рус</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KEY ADVANTAGES SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-app mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded">
            Преимущества платформы
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Разработано специально под регуляторные реалии Казахстана
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            SmartSafety берет на себя рутину проверки знаний, защищает репутацию аккредитованного УЦ и обеспечивает доказательную базу при проверках инспекцией труда.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Anti-cheat & Proctoring */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Интеллектуальный античит и прокторинг
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Блокировка копирования текста, запрет вызова контекстного меню, блокировка горячих клавиш и постоянный мониторинг потери фокуса вкладки. Замечания фиксируются в цифровом следе.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Защита от списывания со смартфона и ПК</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Серверная сверка ответов без утечек</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Multilinguality (KZ/RU) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800">
              <Languages className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Двуязычие и национальные стандарты РК
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Полная поддержка казахского и русского языков. Тестовые базы составлены строго по нормам Трудового Кодекса РК, Закона «О гражданской защите» и правил МЗСР РК.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Қазақ тілінде тестілеу және конспектілер</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Официальные формулировки НПА РК</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Seamless Integrations & Excel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Цифровые протоколы и Excel выгрузка
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Автоматическое присвоение уникального цифрового номера протокола проверки знаний каждому курсанту. Мгновенная выгрузка всей ведомости учебной группы в Excel в 1 клик.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Настоящий формат .xlsx для отчетов</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Фиксация времени сдачи с точностью до секунды</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Group Credential Access */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Групповой доступ без рутины
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Не нужно вручную регистрировать сотни рабочих. Выдается один групповой логин на предприятие. При входе курсант вводит свое ФИО, после чего система привязывает результат.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Быстрый старт обучения за 1 минуту</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Изоляция курсов чужих предприятий</span>
              </li>
            </ul>
          </div>

          {/* Card 5: Mobile First */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Удобно на любых смартфонах
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Рабочие на заводах и строительных площадках проходят подготовку и сдают экзамен прямо со своего мобильного телефона без установки сторонних приложений.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Адаптивный интерфейс слайдов и тестов</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Минимальный трафик даже при слабом 3G/4G</span>
              </li>
            </ul>
          </div>

          {/* Card 6: Complete Independent Integrity */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Защищенная независимость УЦ
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Учебный центр защищен от обвинений в фальсификации: платформа ведет неизменяемый электронный аудит-лог каждого ответа, предотвращая «дорисовку» результатов задним числом.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% доверие инспекторов труда РК</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Защита лицензии и аккредитации центра</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE ROI CALCULATOR FOR TRAINING CENTERS */}
      <section id="calc-section" className="py-16 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider bg-blue-950 px-3 py-1 rounded border border-blue-800">
              <Calculator className="w-3.5 h-3.5" />
              <span>Калькулятор окупаемости для Учебного Центра</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Оцените экономию ресурсов вашего УЦ в месяц
            </h2>
            <p className="text-xs text-slate-400">
              Рассчитайте, сколько времени методистов и средств экономит SmartSafety при переходе от бумажного тестирования к цифровой платформе.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800">
            {/* Sliders */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Количество курсантов в месяц:</span>
                  <span className="font-bold text-blue-400 text-sm font-mono">{cadetsPerMonth} чел.</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={cadetsPerMonth}
                  onChange={e => setCadetsPerMonth(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>50 чел.</span>
                  <span>500 чел.</span>
                  <span>1 000 чел.</span>
                  <span>2 000 чел.</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Скорость ручной проверки (тестов в час):</span>
                  <span className="font-bold text-blue-400 text-sm font-mono">{testChecksPerHour} тестов/час</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="2"
                  value={testChecksPerHour}
                  onChange={e => setTestChecksPerHour(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Тщательно (4)</span>
                  <span>Стандартно (8)</span>
                  <span>Быстро (20)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">Что автоматизирует платформа:</p>
                <p>• Мгновенная проверка тестов без участия методиста</p>
                <p>• Генерация ведомости в Excel за 3 секунды</p>
                <p>• Нулевой риск человеческой ошибки при подсчете баллов</p>
              </div>
            </div>

            {/* Calculated Results */}
            <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 p-6 rounded-xl border border-blue-900/50 space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">
                  Экономия времени методистов
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1">
                  {hoursSavedPerMonth} <span className="text-lg font-normal text-slate-400">часов/мес</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Эквивалентно {Math.round(hoursSavedPerMonth / 8)} полноценным рабочим дням сотрудников
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">Бумажных бланков:</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">
                    {paperSheetsSaved.toLocaleString()} шт.
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Оценочная экономия:</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">
                    {moneySavedTenge.toLocaleString()} ₸
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onRequestDemo}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold uppercase tracking-wider transition text-center"
                >
                  Внедрить в наш Учебный Центр
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTORS & CLIENT ENTERPRISES */}
      <section className="py-14 max-w-app mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Отрасли применения платформы в Республике Казахстан
          </h3>
          <p className="text-lg font-bold text-slate-800">
            Для корпоративных клиентов любого масштаба
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <Building className="w-6 h-6 text-blue-700 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-900">Нефть и Газ</div>
            <div className="text-xs text-slate-500">ОПО, скважины, НПЗ, трубопроводы</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <BarChart3 className="w-6 h-6 text-emerald-700 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-900">Горно-Металлургия</div>
            <div className="text-xs text-slate-500">Шахты, ГОК, металлургические цеха</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <Cpu className="w-6 h-6 text-amber-700 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-900">Энергетика и ТЭЦ</div>
            <div className="text-xs text-slate-500">Электробезопасность, высоковольтные сети</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <Award className="w-6 h-6 text-indigo-700 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-900">Строительство</div>
            <div className="text-xs text-slate-500">Высотные работы, краны, земляные работы</div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Готовы оцифровать проверки знаний вашего УЦ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Подключите ваш учебный центр к платформе SmartSafety уже сегодня. Мы предоставим настроенный контур с готовыми курсами БиОТ и ПромБезопасности.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onRequestDemo}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-semibold uppercase tracking-wider transition"
            >
              Запросить демонстрацию платформы
            </button>
            <button
              onClick={() => onNavigate('/contacts')}
              className="w-full sm:w-auto px-6 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-md text-sm font-medium transition"
            >
              Связаться с нами
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
