import React from 'react';

interface HoverPopoverProps {
  title: string;
  text: string;
  children: React.ReactNode;
  className?: string;
}

export const HoverPopover: React.FC<HoverPopoverProps> = ({
  title,
  text,
  children,
  className = ''
}) => {
  return (
    <div className={`relative group/pop ${className}`}>
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-left shadow-lg opacity-0 translate-y-1 transition duration-150 group-hover/pop:opacity-100 group-hover/pop:translate-y-0"
      >
        <p className="text-sm font-semibold text-slate-900 mb-1">{title}</p>
        <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
      </div>
    </div>
  );
};
