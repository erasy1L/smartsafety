import React from 'react';
import { Shield, Target, Scale, TrendingUp, CheckCircle2, FileCheck, Lock } from 'lucide-react';
import { m } from '../paraglide/messages.js';

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
            <span>{m.about_badge()}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {m.about_title()}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            {m.about_lead()}
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
              {m.about_mission()}
            </h2>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {m.about_mission_p1()}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {m.about_mission_p2()}
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">{m.about_pillar1_title()}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.about_pillar1_text()}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">{m.about_pillar2_title()}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.about_pillar2_text()}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">{m.about_pillar3_title()}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {m.about_pillar3_text()}
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
              {m.about_npa_title()}
            </h2>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{m.about_npa1_title()}</span>
              </div>
              <p className="text-slate-600 pl-6">
                {m.about_npa1_text()}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{m.about_npa2_title()}</span>
              </div>
              <p className="text-slate-600 pl-6">
                {m.about_npa2_text()}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{m.about_npa3_title()}</span>
              </div>
              <p className="text-slate-600 pl-6">
                {m.about_npa3_text()}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Data Sovereignty */}
        <div className="bg-slate-900 text-white p-8 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {m.about_data_title()}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {m.about_data_text()}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRequestDemo}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold uppercase tracking-wider transition"
            >
              {m.about_cta_demo()}
            </button>
            <button
              onClick={() => onNavigate('/contacts')}
              className="px-6 py-3 border border-slate-700 text-slate-300 rounded text-sm hover:bg-slate-800 transition"
            >
              {m.about_cta_office()}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
