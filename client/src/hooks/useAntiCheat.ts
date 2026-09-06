import { useState, useEffect, useCallback } from 'react';

interface UseAntiCheatOptions {
  enabled: boolean;
  onCheatDetected?: (reason: string, totalFlags: number) => void;
}

export function useAntiCheat({ enabled, onCheatDetected }: UseAntiCheatOptions) {
  const [cheatFlags, setCheatFlags] = useState<number>(0);
  const [lastWarning, setLastWarning] = useState<string | null>(null);

  const registerViolation = useCallback((reason: string) => {
    setCheatFlags(prev => {
      const next = prev + 1;
      setLastWarning(`⚠️ Внимание! ${reason} (Замечание №${next})`);
      if (onCheatDetected) {
        onCheatDetected(reason, next);
      }
      return next;
    });
  }, [onCheatDetected]);

  useEffect(() => {
    if (!enabled) return;

    // 1. Блокировка контекстного меню (правый клик мыши)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      registerViolation('Попытка вызова контекстного меню заблокирована');
    };

    // 2. Блокировка копирования и вставки
    const handleCopyCutPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      registerViolation('Копирование и вставка учебных материалов запрещены');
    };

    // 3. Блокировка системных горячих клавиш (Ctrl+C, Ctrl+V, Ctrl+U, F12 и т.д.)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'с' || e.key === 'С')) ||
        (e.ctrlKey && (e.key === 'v' || e.key === 'V' || e.key === 'м' || e.key === 'М')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'г' || e.key === 'Г')) ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З')) ||
        (e.ctrlKey && (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        registerViolation(`Использование горячих клавиш (${e.ctrlKey ? 'Ctrl+' : ''}${e.key}) заблокировано`);
      }
    };

    // 4. Запрет выделения мышью
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // 5. Детекция смены вкладки или сворачивания окна
    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation('Зафиксирована потеря фокуса (переключение вкладки или свертывание браузера)');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Добавляем класс ко всему документу для отключения выделения текста
    document.body.classList.add('anti-cheat-protected');

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.classList.remove('anti-cheat-protected');
    };
  }, [enabled, registerViolation]);

  return {
    cheatFlags,
    lastWarning,
    clearWarning: () => setLastWarning(null),
    resetCheatFlags: () => setCheatFlags(0)
  };
}
