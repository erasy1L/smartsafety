import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { m } from "./paraglide/messages.js";
import { getLocale, setLocale, type Locale } from "./paraglide/runtime.js";

type LocaleContextValue = {
  locale: Locale;
  setAppLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = m.document_title();
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setAppLocale: (next) => {
        setLocale(next, { reload: false });
        setLocaleState(next);
      },
    }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
