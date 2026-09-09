import React from "react";
import { m } from "../paraglide/messages.js";
import { locales, type Locale } from "../paraglide/runtime.js";
import { useLocale } from "../locale";

const LABELS: Record<Locale, () => string> = {
  kk: () => m.lang_kk(),
  ru: () => m.lang_ru(),
  en: () => m.lang_en(),
};

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const { locale, setAppLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label={m.lang_switcher_label()}
      className={`flex items-center rounded-md border border-slate-700 bg-slate-800/80 p-0.5 ${
        compact ? "w-full" : ""
      }`}
    >
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setAppLocale(code)}
          className={`px-2 py-1 text-[11px] font-semibold tracking-wide rounded transition ${
            compact ? "flex-1" : ""
          } ${
            locale === code
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:text-white hover:bg-slate-700/80"
          }`}
        >
          {LABELS[code]()}
        </button>
      ))}
    </div>
  );
};
