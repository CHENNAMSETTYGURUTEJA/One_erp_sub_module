import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-500 text-emerald-950',
    error: 'bg-rose-50 border-rose-500 text-rose-950',
    warning: 'bg-amber-50 border-amber-500 text-amber-950',
    info: 'bg-sky-50 border-sky-500 text-sky-950',
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-xl border-l-4 shadow-xl bg-white flex items-start gap-3 transition-all duration-300 animate-slide-in ${bgStyles[t.type] || bgStyles.info}`}
        >
          {icons[t.type] || icons.info}
          <div className="flex-1 text-xs">
            {t.title && <div className="font-bold text-sm mb-0.5">{t.title}</div>}
            <div className="leading-relaxed opacity-90">{t.message}</div>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

