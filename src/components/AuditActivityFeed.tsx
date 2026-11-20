import React, { useState, useMemo } from 'react';
import {
  Crown,
  UserCheck,
  Eye,
  Clock,
  Layers,
  ArrowRight,
  FileText,
  Sliders,
  LayoutList,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { AuditLogItem } from '../App';

const FIELD_LABEL_MAP: Record<string, string> = {
  status: 'Status',
  lead_status: 'Lead Status',
  kyc_status: 'KYC Status',
  rto_office: 'RTO Office',
  payment_mode: 'Payment Mode',
  price: 'Display Price',
  price_raw: 'Selling Price (INR)',
  purchase_cost: 'Purchase Cost',
  repair_cost: 'Repair Cost',
  stock_count: 'Remaining Stock',
  sold_count: 'Sold Out Qty',
  initial_stock: 'Total Stocked',
  is_visible_on_portal: 'Website Visibility',
  enableAccessoriesSection: 'Accessories Section',
  enableSuperbikesSection: 'Superbikes Section',
  enableBudgetBikesSection: 'Budget Bikes Section',
  enableEmiCalculator: 'EMI Calculator',
  enableWorkshopBooking: 'Workshop Booking',
  enableTradeInSection: 'Sell / Trade-In Section',
  name: 'Name',
  title: 'Title',
  brand: 'Brand',
  category: 'Category',
  year: 'Model Year',
  km: 'Stock / Kilometers',
  location: 'Showroom Branch / Location',
  phone: 'Phone Number',
  permissions: 'Staff Permissions',
  bannerText: 'Website Banner Text',
  bannerCtaText: 'Banner Button Text',
  bannerCtaLink: 'Banner Button Link',
  specifications: 'Technical Specifications',
  accessory_edit: 'Accessory Details Updated',
  accessory_create: 'New Accessory Created',
  bike_edit: 'Vehicle Details Updated',
  bike_create: 'New Vehicle Added',
  under_5_whatsapp_alert: 'Under-5 WhatsApp Alert',
  warranty_badge: 'Warranty Badge',
  sku: 'SKU Code',
  description: 'Description',
  compatibility_models: 'Compatible Models',
  gallery_urls: 'Carousel Photos',
  image_url: 'Cover Photo',
  notes: 'Notes',
};

const IGNORED_DIFF_KEYS = new Set([
  'id',
  'created_at',
  'updated_at',
]);

export function formatFieldLabel(rawKey: string): string {
  if (!rawKey) return 'Details';
  if (FIELD_LABEL_MAP[rawKey]) return FIELD_LABEL_MAP[rawKey];
  return rawKey
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function formatReadableAuditValue(key: string, val: any): string {
  if (val === null || val === undefined || val === '') return 'Empty';
  if (typeof val === 'boolean') {
    if (key.toLowerCase().includes('visible') || key.toLowerCase().includes('enable')) {
      return val ? 'Visible (ON)' : 'Hidden (OFF)';
    }
    return val ? 'Yes' : 'No';
  }
  if (typeof val === 'number') {
    if (/price|cost|amount|advance|total|fee/i.test(key)) {
      return `₹${val.toLocaleString('en-IN')}`;
    }
    return String(val);
  }
  if (typeof val === 'string') {
    if (val.startsWith('data:image/') || val.length > 160) {
      if (val.startsWith('data:image/')) return 'Uploaded Image';
      return `${val.slice(0, 120)}...`;
    }
    return val;
  }
  if (Array.isArray(val)) {
    if (key === 'gallery_urls' || key.includes('image')) {
      return `${val.length} photo${val.length === 1 ? '' : 's'}`;
    }
    if (val.length === 0) return 'None';
    if (val.every((x) => typeof x === 'string' || typeof x === 'number')) {
      return val.slice(0, 6).join(', ') + (val.length > 6 ? ` (+${val.length - 6} more)` : '');
    }
    return `${val.length} item${val.length === 1 ? '' : 's'}`;
  }
  if (typeof val === 'object') {
    if (val.label && val.phone) return `${val.label} (${val.phone})`;
    const keys = Object.keys(val).filter((k) => !IGNORED_DIFF_KEYS.has(k));
    if (keys.length === 0) return 'Updated';
    return keys
      .slice(0, 3)
      .map((k) => `${formatFieldLabel(k)}: ${formatReadableAuditValue(k, val[k])}`)
      .join(' · ');
  }
  return String(val);
}

export interface ReadableAuditChange {
  label: string;
  before: string;
  after: string;
}

export interface ReadableAuditExtraction {
  fieldLabel: string;
  changes: ReadableAuditChange[];
  createdSummary: Array<{ label: string; value: string }>;
  notes?: string;
}

export function extractReadableAuditChanges(log: AuditLogItem): ReadableAuditExtraction {
  const details = log.details;
  if (!details) {
    return { fieldLabel: '', changes: [], createdSummary: [] };
  }

  const fieldLabel = details.field ? formatFieldLabel(details.field) : '';
  const changes: ReadableAuditChange[] = [];
  const createdSummary: Array<{ label: string; value: string }> = [];

  const before = details.before;
  const after = details.after;

  if (before !== undefined && after !== undefined) {
    const bothPlainObjects =
      typeof before === 'object' &&
      before !== null &&
      !Array.isArray(before) &&
      typeof after === 'object' &&
      after !== null &&
      !Array.isArray(after);

    if (bothPlainObjects) {
      const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter(
        (k) => !IGNORED_DIFF_KEYS.has(k)
      );
      for (const k of allKeys) {
        const bVal = before[k];
        const aVal = after[k];
        if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
          changes.push({
            label: formatFieldLabel(k),
            before: formatReadableAuditValue(k, bVal),
            after: formatReadableAuditValue(k, aVal),
          });
        }
      }
      if (changes.length === 0) {
        changes.push({
          label: fieldLabel || 'Record',
          before: formatReadableAuditValue(details.field || '', before),
          after: formatReadableAuditValue(details.field || '', after),
        });
      }
    } else {
      changes.push({
        label: fieldLabel || 'Value',
        before: formatReadableAuditValue(details.field || '', before),
        after: formatReadableAuditValue(details.field || '', after),
      });
    }
  } else if (after !== undefined && typeof after === 'object' && after !== null && !Array.isArray(after)) {
    const priorityKeys = [
      'title',
      'name',
      'brand',
      'category',
      'price',
      'price_raw',
      'stock_count',
      'sold_count',
      'status',
      'is_visible_on_portal',
      'permissions',
      'location',
    ];
    const allKeys = [
      ...priorityKeys.filter((k) => after[k] !== undefined),
      ...Object.keys(after).filter((k) => !priorityKeys.includes(k) && !IGNORED_DIFF_KEYS.has(k) && k !== 'gallery_urls' && k !== 'image_url'),
    ];
    for (const k of allKeys.slice(0, 6)) {
      createdSummary.push({
        label: formatFieldLabel(k),
        value: formatReadableAuditValue(k, after[k]),
      });
    }
  }

  // Also include extra scalar metadata in details if not already covered (like stock_count / handler)
  const extraKeys = Object.keys(details).filter(
    (k) => !['field', 'before', 'after', 'notes'].includes(k)
  );
  if (changes.length === 0 && createdSummary.length === 0 && extraKeys.length > 0) {
    for (const k of extraKeys) {
      createdSummary.push({
        label: formatFieldLabel(k),
        value: formatReadableAuditValue(k, (details as any)[k]),
      });
    }
  }

  return {
    fieldLabel,
    changes,
    createdSummary,
    notes: details.notes ? String(details.notes) : undefined,
  };
}

export function formatRelativeTimeShort(iso: string): string {
  const ts = new Date(iso).getTime();
  if (isNaN(ts)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function formatActionBadge(actionType: string): { label: string; cls: string } {
  switch (actionType) {
    case 'login':
      return { label: 'Login Session', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'lead_status':
      return { label: 'Lead Status Changed', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'lead_view':
      return { label: 'Lead Viewed', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'inventory_add':
      return { label: 'Item Added', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'inventory_edit':
      return { label: 'Item Edited', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'inventory_delete':
      return { label: 'Item Deleted', cls: 'bg-red-50 text-red-700 border-red-200' };
    case 'billing_create':
      return { label: 'Invoice / Note Created', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'settings_edit':
      return { label: 'Website / Settings Edited', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'staff_edit':
      return { label: 'Staff Access Changed', cls: 'bg-pink-50 text-pink-700 border-pink-200' };
    case 'branch_edit':
      return { label: 'Branch Updated', cls: 'bg-teal-50 text-teal-700 border-teal-200' };
    default:
      return { label: actionType.replace(/_/g, ' '), cls: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

interface FeedProps {
  logs: AuditLogItem[];
  allLogsCount: number;
  roleFilter: 'ALL' | 'staff' | 'owner';
  onChangeRoleFilter: (role: 'ALL' | 'staff' | 'owner') => void;
  workerCount: number;
  ownerCount: number;
  onInspectLog: (log: AuditLogItem) => void;
}

export function AuditActivityFeed({
  logs,
  allLogsCount,
  roleFilter,
  onChangeRoleFilter,
  workerCount,
  ownerCount,
  onInspectLog,
}: FeedProps) {
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Worker vs Owner Filter Tabs + Layout Switcher */}
      <div className="bg-white p-2 sm:p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onChangeRoleFilter('ALL')}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border ${
              roleFilter === 'ALL'
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
          >
            <span className="truncate">All</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] sm:text-[11px] ${
                roleFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {allLogsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeRoleFilter('staff')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
              roleFilter === 'staff'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-slate-50 text-sky-700 hover:text-slate-900 border-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
            <span>Workers</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                roleFilter === 'staff' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {workerCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeRoleFilter('owner')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
              roleFilter === 'owner'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-slate-50 text-amber-800 hover:text-slate-900 border-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
            <span>Owner</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                roleFilter === 'owner' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {ownerCount}
            </span>
          </button>
        </div>

        {/* View Toggle (Readable Cards vs Table on Laptop) */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setLayoutMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              layoutMode === 'cards' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Detailed Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              layoutMode === 'table' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-base font-bold text-slate-900">No activity found for this filter</div>
          <p className="text-sm text-slate-600">
            Try switching between All Activity, Workers, or Owner tabs, or clear your search text.
          </p>
        </div>
      ) : layoutMode === 'cards' ? (
        /* USER-FRIENDLY RESPONSIVE CARD FEED (MOBILE + LAPTOP) */
        <div className="space-y-3.5">
          {logs.map((log) => {
            const isOwner = log.role === 'owner';
            const badge = formatActionBadge(log.action_type);
            const extracted = extractReadableAuditChanges(log);
            const isExpanded = Boolean(expandedIds[log.id]);
            const visibleChanges = isExpanded ? extracted.changes : extracted.changes.slice(0, 4);
            const hasMoreChanges = extracted.changes.length > 4;

            const timeStr = new Date(log.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            const dateStr = new Date(log.timestamp).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const relStr = formatRelativeTimeShort(log.timestamp);

            return (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:border-slate-300"
              >
                <div className="p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
                  {/* LEFT COLUMN (WHO, WHICH SECTION, WHEN) */}
                  <div className="lg:col-span-4 space-y-2 sm:space-y-3 lg:border-r lg:border-slate-200 lg:pr-4">
                    {/* Actor + Role */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            isOwner
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {isOwner ? <Crown className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                            {log.staff_name}
                          </div>
                          <div className="text-xs text-slate-600 font-mono">
                            +91 {log.staff_phone}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border shrink-0 ${
                          isOwner
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {isOwner ? 'Owner Edit' : 'Worker Edit'}
                      </span>
                    </div>

                    {/* Section & Action Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900">
                        <Layers className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Section: {log.module}</span>
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Readable Date & Time */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {dateStr} · <strong className="text-slate-900">{timeStr}</strong>
                      </span>
                      {relStr && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                          {relStr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN (WHAT WAS CHANGED + READABLE DIFF + INSPECT) */}
                  <div className="lg:col-span-8 space-y-3 min-w-0">
                    {/* Target Reference + Summary Description */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        {log.target_name && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                            <span>Edited Item:</span>
                            <span className="text-slate-900">{log.target_name}</span>
                          </div>
                        )}
                        <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed break-words">
                          {log.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onInspectLog(log)}
                        className="self-start px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-600" />
                        <span>Full Details</span>
                      </button>
                    </div>

                    {/* Clear Field-by-Field Changes (Before -> After) */}
                    {visibleChanges.length > 0 && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                        <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-700" />
                          <span>What Changed (Before ➔ After)</span>
                        </div>
                        <div className="divide-y divide-slate-200">
                          {visibleChanges.map((ch, idx) => (
                            <div
                              key={idx}
                              className="py-1.5 sm:py-2 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs sm:text-sm"
                            >
                              <span className="font-bold text-sky-700 shrink-0 sm:min-w-[140px]">
                                {ch.label}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium break-words">
                                  Old: {ch.before}
                                </span>
                                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold break-words">
                                  New: {ch.after}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {hasMoreChanges && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(log.id)}
                            className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 pt-1 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>Show fewer changes</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                <span>Show all {extracted.changes.length} changed fields</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Newly Added / Logged Item Summary */}
                    {visibleChanges.length === 0 && extracted.createdSummary.length > 0 && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Details Saved</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {extracted.createdSummary.map((entry, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                            >
                              <div className="text-[10px] uppercase font-bold text-slate-500">
                                {entry.label}
                              </div>
                              <div className="font-semibold text-slate-900 truncate" title={entry.value}>
                                {entry.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Plain Context Note */}
                    {extracted.notes && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <span className="font-bold text-amber-800">Note: </span>
                        <span>{extracted.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* OPTIONAL COMPACT TABLE VIEW FOR LAPTOP */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-600 bg-slate-50 border-b border-slate-200 font-bold uppercase text-xs">
                  <th className="py-3.5 px-4">When</th>
                  <th className="py-3.5 px-4">Who (Worker / Owner)</th>
                  <th className="py-3.5 px-4">Section &amp; Action</th>
                  <th className="py-3.5 px-4">Activity &amp; What Changed</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => {
                  const isOwner = log.role === 'owner';
                  const badge = formatActionBadge(log.action_type);
                  const extracted = extractReadableAuditChanges(log);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition align-top">
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                        <div className="font-bold text-slate-900">
                          {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </div>
                        <div className="text-slate-600">
                          {new Date(log.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {isOwner ? (
                            <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
                          )}
                          <span>{log.staff_name}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-mono">+91 {log.staff_phone}</div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            isOwner
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {isOwner ? 'Owner' : 'Worker'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{log.module}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded border text-[11px] font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[280px] space-y-2">
                        <div className="text-slate-900 text-sm font-medium leading-relaxed">
                          {log.description}
                        </div>
                        {log.target_name && (
                          <div className="text-xs font-bold text-red-700">
                            Item: <span className="text-slate-900">{log.target_name}</span>
                          </div>
                        )}
                        {extracted.changes.slice(0, 3).map((ch, idx) => (
                          <div key={idx} className="text-xs flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-sky-700">{ch.label}:</span>
                            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">{ch.before}</span>
                            <span className="text-slate-500">➔</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">{ch.after}</span>
                          </div>
                        ))}
                        {extracted.notes && (
                          <div className="text-xs text-slate-600">Note: {extracted.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onInspectLog(log)}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-sky-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Full Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
