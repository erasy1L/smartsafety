import React, { useState, useEffect } from 'react';
import { CourseSlide } from '../types';
import { ChevronLeft, ChevronRight, BookOpen, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';

interface PresentationViewerProps {
  slides: CourseSlide[];
  courseTitle: string;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ slides, courseTitle }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!slides || slides.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        Учебная презентация для данного курса находится в процессе актуализации методическим отделом.
      </div>
    );
  }

  const slide = slides[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, slides.length]);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* Top Slide Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between text-xs border-b border-slate-800">
        <div className="flex items-center space-x-2 truncate">
          <span className="font-semibold text-blue-400">Презентация:</span>
          <span className="text-slate-300 truncate font-medium">{courseTitle}</span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 font-mono text-xs">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Свернуть' : 'Во весь экран'}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Slide Body */}
      <div className="p-6 md:p-10 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-slate-50 min-h-[380px] select-none anti-cheat-protected">
        <div className="space-y-4">
          {/* Header of the slide */}
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
              Раздел {currentSlideIndex + 1}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                {slide.subtitle}
              </p>
            )}
          </div>

          {/* Bullet Content */}
          <div className="space-y-3 py-2">
            {slide.content.map((point, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>

          {/* Law Reference */}
          {slide.law_reference && (
            <div className="mt-4 p-3 bg-blue-50/70 border-l-4 border-blue-600 rounded-r text-xs text-blue-950 flex items-start space-x-2.5">
              <BookOpen className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-blue-900">Нормативная основа Республики Казахстан:</span>
                <span>{slide.law_reference}</span>
              </div>
            </div>
          )}

          {/* Warning notice */}
          {slide.warning && (
            <div className="p-3 bg-amber-50/70 border-l-4 border-amber-500 rounded-r text-xs text-amber-950 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-amber-900">Внимание / Требование инспекции:</span>
                <span>{slide.warning}</span>
              </div>
            </div>
          )}
        </div>

        {/* Protection watermark */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <span>SmartSafety LMS • Защита авторских материалов РК</span>
          <span>Навигация: клавиши ← / →</span>
        </div>
      </div>

      {/* Slide Navigation Controls Footer */}
      <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          className="flex items-center space-x-1.5 px-4 py-2 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 hover:bg-slate-50 text-sm font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Назад</span>
        </button>

        <div className="flex space-x-1.5 overflow-x-auto max-w-[200px] sm:max-w-none px-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`w-7 h-7 rounded text-sm font-semibold transition ${
                currentSlideIndex === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex === slides.length - 1}
          className="flex items-center space-x-1.5 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 text-sm font-semibold transition shadow-sm"
        >
          <span>Вперед</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
