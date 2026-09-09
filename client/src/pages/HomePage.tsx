import React from 'react';
import {
  ShieldCheck,
  Eye,
  Languages,
  FileSpreadsheet,
  Users,
  Award,
  ArrowRight,
  Lock,
  CheckCircle,
  Building,
  BarChart3,
  Cpu
} from 'lucide-react';
import { m } from '../paraglide/messages.js';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onRequestDemo: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onRequestDemo }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* Main Title & Subtitle */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {m.home_hero_title()}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            {m.home_hero_sub()}
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onRequestDemo}
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition shadow-lg shadow-blue-900/30 flex items-center justify-center space-x-2"
            >
              <span>{m.home_cta_demo()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/portal/login')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg font-medium text-sm transition flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4 text-blue-400" />
              <span>{m.home_cta_login()}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. KEY ADVANTAGES SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-app mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded">
            {m.home_adv_badge()}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {m.home_adv_title()}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {m.home_adv_sub()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Anti-cheat & Proctoring */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {m.home_card1_title()}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.home_card1_text()}
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card1_li1()}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card1_li2()}</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Multilinguality (KZ/RU) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800">
              <Languages className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {m.home_card2_title()}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.home_card2_text()}
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card2_li1()}</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Seamless Integrations & Excel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {m.home_card3_title()}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.home_card3_text()}
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card3_li1()}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card3_li2()}</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Group Credential Access */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {m.home_card4_title()}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.home_card4_text()}
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card4_li1()}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card4_li2()}</span>
              </li>
            </ul>
          </div>

          {/* Card 5: Mobile First */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {m.home_card5_title()}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.home_card5_text()}
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card5_li1()}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card5_li2()}</span>
              </li>
            </ul>
          </div>

          {/* Card 6: Complete Independent Integrity */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {m.home_card6_title()}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.home_card6_text()}
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{m.home_card6_li1()}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. SECTORS & CLIENT ENTERPRISES */}
      <section className="py-14 max-w-app mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {m.home_sectors_label()}
          </h3>
          <p className="text-lg font-bold text-slate-800">
            {m.home_sectors_title()}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <Building className="w-6 h-6 text-blue-700 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-900">{m.home_oil()}</div>
            <div className="text-xs text-slate-500">{m.home_oil_sub()}</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <BarChart3 className="w-6 h-6 text-emerald-700 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-900">{m.home_mining()}</div>
            <div className="text-xs text-slate-500">{m.home_mining_sub()}</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <Cpu className="w-6 h-6 text-amber-700 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-900">{m.home_energy()}</div>
            <div className="text-xs text-slate-500">{m.home_energy_sub()}</div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <Award className="w-6 h-6 text-indigo-700 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-900">{m.home_build()}</div>
            <div className="text-xs text-slate-500">{m.home_build_sub()}</div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {m.home_bottom_title()}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {m.home_bottom_sub()}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onRequestDemo}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-semibold uppercase tracking-wider transition"
            >
              {m.home_cta_demo()}
            </button>
            <button
              onClick={() => onNavigate('/contacts')}
              className="w-full sm:w-auto px-6 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-md text-sm font-medium transition"
            >
              {m.home_contact_us()}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
