import React from 'react';
import {
  Share2,
  ExternalLink,
  Copy,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { SiteSettings } from '../App';

type SocialFieldKey = 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'telegram' | 'threads';

interface SocialChannelsPanelProps {
  settings: SiteSettings;
  onChangeField: (field: SocialFieldKey, value: string) => void;
  onSaveAll: () => void;
  isSaving: boolean;
  onCopyLink: (text: string, label: string) => void;
}

interface ChannelMeta {
  field: SocialFieldKey;
  title: string;
  subtitle: string;
  shortCode: string;
  label: string;
  placeholder: string;
  borderAccent: string;
  iconBg: string;
  linkTextCls: string;
  prefixAt?: boolean;
  buildHref: (raw: string) => string;
}

function normalizeSocialUrl(raw: string, baseUrl: string, stripAt = false): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return baseUrl;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?(instagram\.com|youtube\.com|youtu\.be|facebook\.com|fb\.com|x\.com|twitter\.com|t\.me|telegram\.me|threads\.net)/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }
  const handle = stripAt ? trimmed.replace(/^@+/, '') : trimmed;
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/${handle.replace(/^\/+/, '')}`;
}

const SOCIAL_CHANNELS: ChannelMeta[] = [
  {
    field: 'instagram',
    title: 'Instagram',
    subtitle: 'Reels & Delivery Handover Photos',
    shortCode: 'IG',
    label: 'Instagram Handle or URL',
    placeholder: 'adarshmotors.in',
    borderAccent: 'border-slate-200',
    iconBg: 'bg-pink-50 text-pink-700 border-pink-200',
    linkTextCls: 'text-pink-700 hover:text-pink-800',
    prefixAt: true,
    buildHref: (val) => normalizeSocialUrl(val || 'adarshmotors.in', 'https://instagram.com', true),
  },
  {
    field: 'youtube',
    title: 'YouTube Channel',
    subtitle: 'Dyno Runs & Exhaust Acoustics',
    shortCode: 'YT',
    label: 'YouTube URL',
    placeholder: 'https://youtube.com/@adarshmotors',
    borderAccent: 'border-slate-200',
    iconBg: 'bg-red-50 text-red-700 border-red-200',
    linkTextCls: 'text-red-700 hover:text-red-800',
    buildHref: (val) => normalizeSocialUrl(val || 'https://youtube.com/@adarshmotors', 'https://youtube.com'),
  },
  {
    field: 'facebook',
    title: 'Facebook Page',
    subtitle: 'Community & Showroom Announcements',
    shortCode: 'FB',
    label: 'Facebook URL',
    placeholder: 'https://facebook.com/adarshmotorshyderabad',
    borderAccent: 'border-slate-200',
    iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
    linkTextCls: 'text-blue-700 hover:text-blue-800',
    buildHref: (val) => normalizeSocialUrl(val || 'https://facebook.com/adarshmotorshyderabad', 'https://facebook.com', true),
  },
  {
    field: 'twitter',
    title: 'X (Twitter)',
    subtitle: 'Official Dealership Handle',
    shortCode: '𝕏',
    label: 'Twitter / X URL',
    placeholder: 'https://x.com/adarshmotors',
    borderAccent: 'border-slate-200',
    iconBg: 'bg-slate-100 text-slate-900 border-slate-200',
    linkTextCls: 'text-slate-800 hover:text-slate-950',
    buildHref: (val) => normalizeSocialUrl(val || 'https://x.com/adarshmotors', 'https://x.com', true),
  },
  {
    field: 'telegram',
    title: 'Telegram VIP Riders Club',
    subtitle: 'Sunday Superbike Tour Coordination',
    shortCode: 'TG',
    label: 'Telegram Channel Link',
    placeholder: 'https://t.me/adarshmotorsvip',
    borderAccent: 'border-slate-200',
    iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
    linkTextCls: 'text-sky-700 hover:text-sky-800',
    buildHref: (val) => normalizeSocialUrl(val || 'https://t.me/adarshmotorsvip', 'https://t.me', true),
  },
  {
    field: 'threads',
    title: 'Threads',
    subtitle: 'Micro-updates & Superbike banter',
    shortCode: '@',
    label: 'Threads URL',
    placeholder: 'https://threads.net/@adarshmotors.in',
    borderAccent: 'border-slate-200',
    iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
    linkTextCls: 'text-purple-700 hover:text-purple-800',
    buildHref: (val) => normalizeSocialUrl(val || 'https://threads.net/@adarshmotors.in', 'https://threads.net'),
  },
];

export default function SocialChannelsPanel({
  settings,
  onChangeField,
  onSaveAll,
  isSaving,
  onCopyLink,
}: SocialChannelsPanelProps) {
  const configuredCount = SOCIAL_CHANNELS.filter(
    (ch) => String(settings[ch.field] || '').trim().length > 0
  ).length;

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Summary Header Card */}
      <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                Public Social Channels
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono tabular-nums">
                {configuredCount} / {SOCIAL_CHANNELS.length} Active
              </span>
            </div>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
              These links power the customer website footer, floating social dock, and mobile navigation menu.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSaveAll}
          disabled={isSaving}
          className="min-h-[38px] sm:min-h-[40px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer disabled:opacity-60"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : 'Save Social Links'}</span>
        </button>
      </div>

      {/* 6 Structured Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {SOCIAL_CHANNELS.map((ch) => {
          const rawValue = String(settings[ch.field] || '');
          const isFullUrl = /^https?:\/\//i.test(rawValue.trim());
          const cleanDisplay = ch.prefixAt && !isFullUrl ? rawValue.replace(/^@/, '') : rawValue;
          const isConfigured = cleanDisplay.trim().length > 0;
          const externalHref = ch.buildHref(cleanDisplay);

          return (
            <div
              key={ch.field}
              className={`p-3 sm:p-5 rounded-2xl bg-white border shadow-sm transition hover:border-slate-300 flex flex-col justify-between gap-3 sm:gap-4 ${ch.borderAccent}`}
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 ${ch.iconBg}`}>
                      {ch.shortCode}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{ch.title}</h4>
                      <p className="text-xs text-slate-600 truncate">{ch.subtitle}</p>
                    </div>
                  </div>

                  {isConfigured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Set</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold shrink-0">
                      <AlertCircle className="w-3 h-3" />
                      <span>Default</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    {ch.label}
                  </label>
                  <div className="relative">
                    {ch.prefixAt && !isFullUrl && (
                      <span className="absolute left-3 top-2.5 text-sm text-slate-600 font-mono">@</span>
                    )}
                    <input
                      type="text"
                      value={cleanDisplay}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextIsUrl = /^https?:\/\//i.test(val.trim());
                        onChangeField(
                          ch.field,
                          ch.prefixAt && !nextIsUrl ? val.replace(/^@/, '') : val
                        );
                      }}
                      placeholder={ch.placeholder}
                      className={`w-full ${ch.prefixAt && !isFullUrl ? 'pl-8 pr-3' : 'px-3'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <a
                  href={externalHref}
                  target="_blank"
                  rel="noreferrer"
                  className={`min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition ${ch.linkTextCls}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Channel</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onCopyLink(externalHref, ch.title)}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title={`Copy ${ch.title} URL`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSaveAll}
                    disabled={isSaving}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Saving' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
