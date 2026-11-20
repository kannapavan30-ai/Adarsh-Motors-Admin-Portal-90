import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PublicVisibilityToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  label?: string;
  compact?: boolean;
  disabled?: boolean;
  title?: string;
}

export default function PublicVisibilityToggle({
  isVisible,
  onToggle,
  label = 'Public Website',
  compact = false,
  disabled = false,
  title,
}: PublicVisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isVisible}
      title={
        title ||
        (isVisible
          ? `Visible on customer storefront. Click to hide ${label}.`
          : `Hidden from customer storefront. Click to publish ${label}.`)
      }
      className={`inline-flex items-center justify-between gap-1.5 sm:gap-2.5 rounded-xl border transition-colors cursor-pointer select-none disabled:opacity-60 min-w-0 ${
        compact ? 'min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs' : 'min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm'
      } font-semibold ${
        isVisible
          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
          : 'bg-white hover:bg-rose-50 border-red-200 text-red-700'
      }`}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {isVisible ? (
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
        ) : (
          <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </span>

      <span
        className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 px-1.5 sm:px-2 py-0.5 rounded-md border ${
          isVisible
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}
      >
        {isVisible ? 'Live' : 'Hidden'}
      </span>
    </button>
  );
}
