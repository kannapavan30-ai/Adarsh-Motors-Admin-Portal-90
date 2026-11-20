import React, { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  UserPlus,
  Globe,
  Phone,
  MessageCircle,
  CheckCircle,
  Check,
  Clock,
  Sparkles,
  Bike,
  LayoutList,
  Table as TableIcon,
  MessageSquare,
  Users,
  AlertCircle,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import PublicVisibilityToggle from './PublicVisibilityToggle';
import EditableSelect from './EditableSelect';
import OwnerSectionPhoneControl from './OwnerSectionPhoneControl';
import type { SiteSettings } from '../App';
import type { WebsiteSectionKey } from '../utils/sectionVisibilitySync';

export interface LeadRecord {
  id: number | string;
  customer_name: string;
  name?: string;
  phone: string;
  email?: string;
  bike_interested: string;
  bike_model?: string;
  service_type?: string;
  notes?: string;
  type?: string;
  message: string;
  status: 'New' | 'Contacted' | 'Closed' | 'Follow-up' | (string & {});
  registration_number?: string;
  preferred_date?: string;
  branch?: string;
  license_status?: string;
  year?: string;
  km?: string;
  expected_price?: string;
  condition?: string;
  loan_amount?: string;
  tenure?: string;
  employment_type?: string;
  employment?: string;
  created_at: string;
}

interface LeadsCrmSectionProps {
  leads: LeadRecord[];
  filteredLeads: LeadRecord[];
  leadsSearch: string;
  onSearchChange: (val: string) => void;
  leadsStatusFilter: string;
  onStatusFilterChange: (val: string) => void;
  isRefreshingLeads: boolean;
  onRefreshLeads: () => void;
  onOpenWalkInModal: () => void;
  settings: SiteSettings;
  onToggleWebsiteSection: (key: WebsiteSectionKey, label: string, explicitVal?: boolean) => void;
  onUpdateLeadStatus: (leadId: number | string, newStatus: 'Contacted' | 'Closed' | 'New' | 'Follow-up' | (string & {})) => void;
  currentUserName: string;
  isOwner?: boolean;
  onSaveSectionPhone?: (field: 'salesPhone' | 'whatsapp', nextPhone: string, label: string) => Promise<boolean> | boolean;
  onLogAuditAction: (
    action_type: any,
    module: any,
    description: string,
    target_id?: any,
    target_name?: string,
    details?: any
  ) => void;
  getWhatsAppLink: (phone: string, name: string, bike: string) => string;
}

function getLeadStatusVisuals(status: string) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'new' || normalized === 'new lead') {
    return {
      borderAccent: 'border-slate-200',
      badgeCls: 'bg-red-50 text-red-700 border-red-200',
      dotCls: 'bg-red-500',
      label: status || 'New',
    };
  }
  if (normalized === 'contacted') {
    return {
      borderAccent: 'border-slate-200',
      badgeCls: 'bg-sky-50 text-sky-700 border-sky-200',
      dotCls: 'bg-sky-500',
      label: status,
    };
  }
  if (normalized === 'follow-up' || normalized === 'followup') {
    return {
      borderAccent: 'border-slate-200',
      badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
      dotCls: 'bg-amber-500',
      label: status,
    };
  }
  if (normalized === 'closed') {
    return {
      borderAccent: 'border-slate-200',
      badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotCls: 'bg-emerald-500',
      label: status,
    };
  }
  return {
    borderAccent: 'border-slate-200',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    dotCls: 'bg-purple-500',
    label: status || 'Custom',
  };
}

function formatLeadDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getLeadStructuredSpecs(l: LeadRecord) {
  const chips: Array<{ label: string; value: string; tone: string }> = [];
  if (l.loan_amount) {
    chips.push({ label: 'Loan', value: l.loan_amount, tone: 'bg-blue-50 border-blue-200 text-blue-700' });
  }
  if (l.tenure) {
    chips.push({ label: 'Tenure', value: l.tenure, tone: 'bg-indigo-50 border-indigo-200 text-indigo-700' });
  }
  const emp = l.employment_type || l.employment;
  if (emp) {
    chips.push({ label: 'Profile', value: emp, tone: 'bg-slate-50 border-slate-200 text-slate-700' });
  }
  if (l.registration_number) {
    chips.push({ label: 'Reg No', value: l.registration_number, tone: 'bg-sky-50 border-sky-200 text-sky-700 font-mono' });
  }
  if (l.preferred_date) {
    chips.push({ label: 'Slot', value: l.preferred_date, tone: 'bg-amber-50 border-amber-200 text-amber-800' });
  }
  if (l.branch) {
    chips.push({ label: 'Branch', value: l.branch, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' });
  }
  if (l.year) {
    chips.push({ label: 'Year', value: l.year, tone: 'bg-slate-50 border-slate-200 text-slate-700' });
  }
  if (l.km) {
    chips.push({ label: 'KM', value: l.km, tone: 'bg-slate-50 border-slate-200 text-slate-700' });
  }
  if (l.expected_price) {
    chips.push({ label: 'Expected', value: l.expected_price, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' });
  }
  if (l.condition) {
    chips.push({ label: 'Spec', value: l.condition, tone: 'bg-amber-50 border-amber-200 text-amber-800' });
  }
  return chips;
}

export default function LeadsCrmSection({
  leads,
  filteredLeads,
  leadsSearch,
  onSearchChange,
  leadsStatusFilter,
  onStatusFilterChange,
  isRefreshingLeads,
  onRefreshLeads,
  onOpenWalkInModal,
  settings,
  onToggleWebsiteSection,
  onUpdateLeadStatus,
  currentUserName,
  isOwner = false,
  onSaveSectionPhone,
  onLogAuditAction,
  getWhatsAppLink,
}: LeadsCrmSectionProps) {
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');

  const stats = useMemo(() => {
    let newCount = 0;
    let contactedCount = 0;
    let followUpCount = 0;
    let closedCount = 0;
    for (const l of leads) {
      const s = String(l?.status || '').toLowerCase();
      if (s === 'new' || s === 'new lead') newCount++;
      else if (s === 'contacted') contactedCount++;
      else if (s === 'follow-up' || s === 'followup') followUpCount++;
      else if (s === 'closed') closedCount++;
    }
    return {
      total: leads.length,
      newCount,
      contactedCount,
      followUpCount,
      closedCount,
    };
  }, [leads]);

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn pb-6">
      {/* Top Executive Header */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="sm:hidden">Live Customer Pipeline</span>
                <span className="hidden sm:inline">Real-Time Customer Pipeline</span>
              </span>
              <span className="hidden sm:inline text-xs text-slate-600 font-mono">Test Rides • Sell/Trade-In • Walk-ins</span>
            </div>
            <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0" />
              <span className="truncate">Leads &amp; Enquiries CRM</span>
            </h2>
            <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-2xl">
              Manage website test-ride requests, sell-your-bike valuations, and showroom walk-ins with instant Call &amp; WhatsApp follow-ups.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefreshLeads}
              disabled={isRefreshingLeads}
              className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
              title="Refresh leads dynamically from Supabase database"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshingLeads ? 'animate-spin' : ''}`} />
              <span className="sm:hidden">{isRefreshingLeads ? 'Syncing...' : 'Sync Leads'}</span>
              <span className="hidden sm:inline">{isRefreshingLeads ? 'Syncing...' : 'Refresh Supabase'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenWalkInModal}
              className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sm:hidden">+ Walk-in Lead</span>
              <span className="hidden sm:inline">Log Walk-in Lead</span>
            </button>
          </div>
        </div>

        {/* Owner-Only Inline Call & WhatsApp Helpline Bar (Hidden from Workers) */}
        {isOwner && onSaveSectionPhone && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <OwnerSectionPhoneControl
              isOwner={isOwner}
              sectionLabel="Showroom Call Hotline"
              phoneValue={settings.salesPhone || ''}
              accentColor="cyan"
              onSavePhone={(val) => onSaveSectionPhone('salesPhone', val, 'Main Showroom Sales Hotline')}
            />
            <OwnerSectionPhoneControl
              isOwner={isOwner}
              sectionLabel="Official WhatsApp"
              phoneValue={settings.whatsapp || ''}
              accentColor="emerald"
              onSavePhone={(val) => onSaveSectionPhone('whatsapp', val, 'Official WhatsApp Helpline')}
            />
          </div>
        )}
      </div>

      {/* 4 KPI Summary Cards (2x2 on Mobile, 4-Across on Tablet/Laptop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
            <span className="truncate">Total Leads</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 sm:mt-1.5 tabular-nums leading-tight">{stats.total}</div>
          <div className="text-[11px] sm:text-xs text-slate-600 mt-1 truncate">All recorded enquiries</div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-700">
            <span className="truncate">New Enquiries</span>
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-700 font-mono mt-1 sm:mt-1.5 tabular-nums leading-tight">{stats.newCount}</div>
          <div className="text-[11px] sm:text-xs text-slate-600 mt-1 truncate">Needs immediate call</div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-700">
            <span className="truncate">Active Follow-Up</span>
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700 font-mono mt-1 sm:mt-1.5 tabular-nums leading-tight">
            {stats.contactedCount + stats.followUpCount}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-600 mt-1 truncate">
            {stats.contactedCount} contacted · {stats.followUpCount} follow-up
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
            <span className="truncate">Closed Deals</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 sm:mt-1.5 tabular-nums leading-tight">{stats.closedCount}</div>
          <div className="text-[11px] sm:text-xs text-slate-600 mt-1 truncate">Completed &amp; resolved</div>
        </div>
      </div>

      {/* Public Website Intake Forms (ON / OFF) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 shadow-sm">
        <div>
          <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>Public Website Intake Forms</span>
          </div>
          <p className="hidden sm:block text-xs text-slate-600 mt-0.5">
            Toggle public lead forms on the customer site ON or OFF instantly.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
          <PublicVisibilityToggle
            compact
            label="Test Rides"
            isVisible={Boolean(settings.enableTestRide)}
            onToggle={() => onToggleWebsiteSection('enableTestRide', 'Test Ride Booking')}
          />
          <PublicVisibilityToggle
            compact
            label="Workshop"
            isVisible={Boolean(settings.enableWorkshopBooking)}
            onToggle={() => onToggleWebsiteSection('enableWorkshopBooking', 'Workshop & Dyno Booking')}
          />
          <PublicVisibilityToggle
            compact
            label="Sell Bike"
            isVisible={Boolean(settings.enableSellBike)}
            onToggle={() => onToggleWebsiteSection('enableSellBike', 'Exchange / Sell Bike')}
          />
        </div>
      </div>

      {/* Quick Status Tabs + Search + EditableSelect + View Switcher */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2.5 sm:space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 lg:pb-0">
            {[
              { id: 'ALL', label: 'All', count: stats.total, activeCls: 'bg-red-600 text-white border-red-600 shadow-sm' },
              { id: 'New', label: 'New', count: stats.newCount, activeCls: 'bg-red-600 text-white border-red-600 shadow-sm' },
              { id: 'Contacted', label: 'Contacted', count: stats.contactedCount, activeCls: 'bg-sky-600 text-white border-sky-600 shadow-sm' },
              { id: 'Follow-up', label: 'Follow-up', count: stats.followUpCount, activeCls: 'bg-amber-600 text-white border-amber-600 shadow-sm' },
              { id: 'Closed', label: 'Closed', count: stats.closedCount, activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
            ].map((pill) => {
              const active = leadsStatusFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => onStatusFilterChange(pill.id)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                    active
                      ? pill.activeCls
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] sm:text-[11px] ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop Layout Switcher */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 self-end lg:self-auto shrink-0">
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

        {/* Search + Custom EditableSelect Status Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center pt-2 border-t border-slate-200">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={leadsSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search customer, phone or bike..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
            />
          </div>
          <EditableSelect
            compact
            value={leadsStatusFilter}
            onChange={(val) => onStatusFilterChange(val || 'ALL')}
            containerClassName="w-full sm:w-52"
            manualPlaceholder="Filter status manually..."
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'New', label: 'New' },
              { value: 'Contacted', label: 'Contacted' },
              { value: 'Follow-up', label: 'Follow-up' },
              { value: 'Closed', label: 'Closed' },
            ]}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {/* MAIN CONTENT: DETAILED CARDS OR OPTIONAL LAPTOP TABLE */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-base font-bold text-slate-900">No customer leads found</div>
          <p className="text-xs sm:text-sm text-slate-600">
            Try switching the status tab above, clearing your search text, or logging a new walk-in lead.
          </p>
        </div>
      ) : layoutMode === 'cards' ? (
        <div className="space-y-2.5 sm:space-y-3.5">
          {filteredLeads.map((l) => {
            const vis = getLeadStatusVisuals(l.status);
            const dateLabel = formatLeadDate(l.created_at);
            return (
              <div
                key={l.id}
                className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition hover:border-slate-300 ${vis.borderAccent}`}
              >
                <div className="p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
                  {/* LEFT ZONE: Customer Identity & Status */}
                  <div className="lg:col-span-4 space-y-2 sm:space-y-3 lg:border-r lg:border-slate-200 lg:pr-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                          {String(l.customer_name || 'C').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                            {l.customer_name}
                          </div>
                          <div className="text-xs sm:text-sm font-mono text-sky-700 font-semibold">
                            +91 {l.phone}
                          </div>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider border shrink-0 ${vis.badgeCls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${vis.dotCls}`} />
                        <span>{vis.label}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-600">
                        Lead #{l.id}
                      </span>
                      {l.type && (
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-semibold">
                          {l.type}
                        </span>
                      )}
                    </div>

                    {dateLabel && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{dateLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT ZONE: Vehicle Interest, Message & One-Tap Actions */}
                  <div className="lg:col-span-8 space-y-3 min-w-0">
                    {/* Interested Vehicle Banner */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bike className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 shrink-0">
                          Interest:
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 truncate">
                          {l.bike_interested || 'Showroom Enquiry'}
                        </span>
                      </div>
                      {l.service_type && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 self-start sm:self-auto shrink-0">
                          {l.service_type}
                        </span>
                      )}
                    </div>

                    {/* Structured Specs (Loan Amount, Tenure, Service Slot, Reg No, Branch, KM, etc.) */}
                    {getLeadStructuredSpecs(l).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {getLeadStructuredSpecs(l).map((chip, idx) => (
                          <span
                            key={`${l.id}-chip-${idx}`}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 ${chip.tone}`}
                          >
                            <span className="opacity-75 uppercase tracking-wide text-[10px]">{chip.label}:</span>
                            <span className="font-bold">{chip.value}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Full Customer Message (Readable, no truncation) */}
                    {l.message && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 leading-relaxed flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <span className="break-words">&ldquo;{l.message}&rdquo;</span>
                      </div>
                    )}

                    {/* Action Controls: Quick Status Buttons + EditableSelect + Call/WhatsApp */}
                    <div className="pt-1 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateLeadStatus(l.id, 'Contacted')}
                          disabled={l.status === 'Contacted'}
                          className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            l.status === 'Contacted'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200 cursor-default'
                              : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 active:scale-95'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-sky-700" />
                          <span>{l.status === 'Contacted' ? 'Contacted ✓' : 'Mark Contacted'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateLeadStatus(l.id, 'Closed')}
                          disabled={l.status === 'Closed'}
                          className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            l.status === 'Closed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 active:scale-95'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{l.status === 'Closed' ? 'Closed ✓' : 'Mark Closed'}</span>
                        </button>

                        <EditableSelect
                          compact
                          commitManualOnConfirm
                          value={l.status}
                          onChange={(val) => onUpdateLeadStatus(l.id, val as any)}
                          containerClassName="w-40"
                          manualPlaceholder="Custom status..."
                          options={[
                            { value: 'New', label: 'New' },
                            { value: 'Contacted', label: 'Contacted' },
                            { value: 'Follow-up', label: 'Follow-up' },
                            { value: 'Closed', label: 'Closed' },
                          ]}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                        <a
                          href={`tel:${l.phone}`}
                          onClick={() => {
                            onLogAuditAction(
                              'lead_view',
                              'Leads CRM',
                              `${currentUserName || 'Staff'} called ${l.customer_name} (+91 ${l.phone})`,
                              l.id,
                              l.customer_name,
                              { notes: `Direct voice call initiated for ${l.bike_interested}` }
                            );
                          }}
                          className="min-h-[38px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Client</span>
                        </a>
                        <a
                          href={getWhatsAppLink(l.phone, l.customer_name, l.bike_interested)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            onLogAuditAction(
                              'lead_view',
                              'Leads CRM',
                              `${currentUserName || 'Staff'} opened WhatsApp conversation with ${l.customer_name} (+91 ${l.phone})`,
                              l.id,
                              l.customer_name,
                              { notes: `WhatsApp chat opened for ${l.bike_interested}` }
                            );
                          }}
                          className="min-h-[38px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* OPTIONAL LAPTOP TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-600 bg-slate-50 border-b border-slate-200 font-bold uppercase text-xs">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Vehicle Interest</th>
                  <th className="py-3.5 px-4">Customer Note</th>
                  <th className="py-3.5 px-4">Status &amp; Action</th>
                  <th className="py-3.5 px-4 text-right">Connect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition align-top">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{l.customer_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">#{String(l.id).slice(0, 8)}</div>
                      {l.service_type && (
                        <div className="mt-1 inline-block px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600">
                          {l.service_type}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sky-700 whitespace-nowrap">+91 {l.phone}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{l.bike_interested}</div>
                      {getLeadStructuredSpecs(l).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {getLeadStructuredSpecs(l).map((chip, idx) => (
                            <span
                              key={`${l.id}-tchip-${idx}`}
                              className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${chip.tone}`}
                            >
                              {chip.label}: {chip.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-sm leading-relaxed">{l.message || '—'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateLeadStatus(l.id, 'Contacted')}
                          disabled={l.status === 'Contacted'}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            l.status === 'Contacted'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200 cursor-default'
                              : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-sky-700" />
                          <span>Contacted</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateLeadStatus(l.id, 'Closed')}
                          disabled={l.status === 'Closed'}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            l.status === 'Closed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Closed</span>
                        </button>
                        <EditableSelect
                          compact
                          commitManualOnConfirm
                          value={l.status}
                          onChange={(val) => onUpdateLeadStatus(l.id, val as any)}
                          containerClassName="w-32"
                          manualPlaceholder="Custom status..."
                          options={[
                            { value: 'New', label: 'New' },
                            { value: 'Contacted', label: 'Contacted' },
                            { value: 'Follow-up', label: 'Follow-up' },
                            { value: 'Closed', label: 'Closed' },
                          ]}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${l.phone}`}
                          onClick={() => {
                            onLogAuditAction(
                              'lead_view',
                              'Leads CRM',
                              `${currentUserName || 'Staff'} called ${l.customer_name} (+91 ${l.phone})`,
                              l.id,
                              l.customer_name,
                              { notes: `Voice call initiated for ${l.bike_interested}` }
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                        <a
                          href={getWhatsAppLink(l.phone, l.customer_name, l.bike_interested)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            onLogAuditAction(
                              'lead_view',
                              'Leads CRM',
                              `${currentUserName || 'Staff'} opened WhatsApp chat with ${l.customer_name} (+91 ${l.phone})`,
                              l.id,
                              l.customer_name,
                              { notes: `WhatsApp conversation opened for ${l.bike_interested}` }
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
