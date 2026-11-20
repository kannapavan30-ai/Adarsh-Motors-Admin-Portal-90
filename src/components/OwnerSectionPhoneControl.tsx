import React, { useState, useEffect } from 'react';
import {
  Crown,
  Phone,
  MessageCircle,
  Pencil,
  Plus,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { buildWhatsAppUrl, formatTelHref } from '../utils/sectionVisibilitySync';

interface OwnerSectionPhoneControlProps {
  isOwner: boolean;
  sectionLabel: string;
  phoneValue: string;
  placeholder?: string;
  accentColor?: 'red' | 'teal' | 'amber' | 'cyan' | 'purple' | 'rose' | 'emerald';
  mandatory?: boolean;
  onSavePhone: (nextPhone: string) => Promise<boolean> | boolean;
}

const ACCENT_RING_MAP: Record<NonNullable<OwnerSectionPhoneControlProps['accentColor']>, string> = {
  red: 'border-slate-200',
  teal: 'border-slate-200',
  amber: 'border-slate-200',
  cyan: 'border-slate-200',
  purple: 'border-slate-200',
  rose: 'border-slate-200',
  emerald: 'border-slate-200',
};

export default function OwnerSectionPhoneControl({
  isOwner,
  sectionLabel,
  phoneValue,
  placeholder = '+91 9014540489',
  accentColor = 'red',
  mandatory = false,
  onSavePhone,
}: OwnerSectionPhoneControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(phoneValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(phoneValue || '');
    }
  }, [phoneValue, isEditing]);

  // Strictly Owner-Only: workers with access to this section must never see or edit the phone setting
  if (!isOwner) return null;

  const cleanDisplay = String(phoneValue || '').trim();
  const hasPhone = cleanDisplay.replace(/\D/g, '').length >= 10;
  const borderCls = ACCENT_RING_MAP[accentColor] || 'border-amber-200';

  const handleOpenEdit = () => {
    setDraft(cleanDisplay);
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(cleanDisplay);
    setErrorMsg(null);
    setIsEditing(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = draft.trim();
    const digits = trimmed.replace(/\D/g, '');

    if (mandatory && digits.length < 10) {
      setErrorMsg('Enter a valid 10-digit Call / WhatsApp number.');
      return;
    }
    if (trimmed && digits.length < 10) {
      setErrorMsg('Phone number must be at least 10 digits (or clear it to use main showroom).');
      return;
    }

    setErrorMsg(null);
    setIsSaving(true);
    try {
      const result = await onSavePhone(trimmed);
      if (result !== false) {
        setIsEditing(false);
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2600);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full pt-2.5 mt-2.5 sm:pt-3 sm:mt-3 border-t border-slate-200">
      <div
        className={`rounded-xl bg-slate-50 border ${borderCls} px-2.5 py-2 sm:px-3.5 sm:py-2.5`}
      >
        {!isEditing ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Owner Only</span>
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">
                {sectionLabel}:
              </span>
              {hasPhone ? (
                <span className="text-xs sm:text-sm font-black font-mono text-slate-900 tracking-tight tabular-nums">
                  {cleanDisplay}
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-800 italic">
                  No dedicated number added
                </span>
              )}
              {justSaved && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  <Check className="w-3 h-3" />
                  Saved &amp; Synced
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {hasPhone && (
                <>
                  <a
                    href={formatTelHref(cleanDisplay)}
                    className="min-h-[32px] px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition"
                    title={`Call ${sectionLabel}: ${cleanDisplay}`}
                  >
                    <Phone className="w-3 h-3 shrink-0" />
                    <span className="hidden sm:inline">Call</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(cleanDisplay, `Hello Adarsh Motors (${sectionLabel}), checking live helpline.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[32px] px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold inline-flex items-center gap-1 transition"
                    title={`WhatsApp ${sectionLabel}: ${cleanDisplay}`}
                  >
                    <MessageCircle className="w-3 h-3 shrink-0" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </>
              )}
              <button
                type="button"
                onClick={handleOpenEdit}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-[11px] sm:text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {hasPhone ? <Pencil className="w-3 h-3 shrink-0" /> : <Plus className="w-3.5 h-3.5 shrink-0" />}
                <span>{hasPhone ? 'Edit Phone' : 'Add Phone'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  <Crown className="w-2.5 h-2.5" />
                  <span>Owner</span>
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700">
                  {sectionLabel}:
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  type="tel"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={placeholder}
                  autoFocus
                  className="flex-1 min-w-0 min-h-[36px] px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-mono focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[36px] px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm transition shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Saving' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
              </div>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-red-700 font-semibold pl-1">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
