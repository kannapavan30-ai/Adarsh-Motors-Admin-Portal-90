import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Calculator,
  Wrench,
  Search,
  RefreshCw,
  Plus,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Users,
  Bike,
  MessageSquare,
  X,
  Check,
  LayoutList,
  Table as TableIcon,
  PackageOpen,
} from 'lucide-react';
import EditableSelect from './EditableSelect';
import OwnerSectionPhoneControl from './OwnerSectionPhoneControl';
import type { LeadRecord } from './LeadsCrmSection';
import {
  buildWhatsAppUrl,
  formatTelHref,
  type SpecializedLeadCategory,
} from '../utils/sectionVisibilitySync';

interface SpecializedLeadsSectionProps {
  variant: SpecializedLeadCategory;
  leads: LeadRecord[];
  isRefreshingLeads: boolean;
  onRefreshLeads: () => void;
  onUpdateLeadStatus: (
    leadId: number | string,
    newStatus: 'Contacted' | 'Closed' | 'New' | 'Follow-up' | (string & {})
  ) => void;
  onCreateLead: (payload: {
    name: string;
    phone: string;
    bike_model: string;
    notes: string;
    service_type: string;
  }) => Promise<void> | void;
  currentUserName: string;
  isOwner: boolean;
  sectionPhone: string;
  onSaveSectionPhone: (nextPhone: string) => Promise<boolean> | boolean;
  onLogAuditAction: (
    action_type: any,
    module: any,
    description: string,
    target_id?: any,
    target_name?: string,
    details?: any
  ) => void;
}

const VARIANT_CONFIG: Record<
  SpecializedLeadCategory,
  {
    badge: string;
    title: string;
    subtitle: string;
    defaultServiceType: string;
    phoneLabel: string;
    accentColor: 'emerald' | 'cyan' | 'amber';
    borderCls: string;
    badgeCls: string;
    buttonCls: string;
    bikePlaceholder: string;
    notesPlaceholder: string;
    emptyTitle: string;
    emptySubtitle: string;
    waTemplate: (name: string, bike: string) => string;
  }
> = {
  exchange_leads: {
    badge: 'Sell & Exchange Valuation Desk',
    title: 'Exchange / Sell Bike Leads',
    subtitle:
      'Dedicated leads inbox for customers wanting to sell, exchange, or extend their bike. Captures website valuation forms & walk-in trade-ins.',
    defaultServiceType: 'Sell / Exchange Valuation',
    phoneLabel: 'Sell / Exchange Call & WhatsApp',
    accentColor: 'emerald',
    borderCls: 'border-slate-200',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    buttonCls: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    bikePlaceholder: 'e.g. 2022 Royal Enfield Classic 350 (14,000 km)',
    notesPlaceholder: 'Expected price, RC condition, city, or exchange bike model...',
    emptyTitle: 'No Sell / Exchange Leads Yet',
    emptySubtitle:
      'When any customer submits the Sell / Exchange Your Bike form on the website, the lead appears here automatically.',
    waTemplate: (name, bike) =>
      `Hello ${name || 'Sir/Madam'}, thank you for contacting Adarsh Motors Sell & Exchange Desk regarding your ${bike || 'bike'}. Share bike photos & RC year so we can give you an instant valuation quote!`,
  },
  loan_leads: {
    badge: 'Two-Wheeler Finance & EMI Desk',
    title: 'Loan & Finance Leads',
    subtitle:
      'Dedicated leads inbox for customers applying for two-wheeler loans, EMI plans, or bank finance approvals from the website or showroom.',
    defaultServiceType: 'Loan & Finance Application',
    phoneLabel: 'Loan & Finance Call & WhatsApp',
    accentColor: 'cyan',
    borderCls: 'border-slate-200',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    buttonCls: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    bikePlaceholder: 'e.g. Kawasaki Ninja Z900 · Loan ₹6,50,000',
    notesPlaceholder: 'Down payment budget, tenure (months), salaried/business, preferred bank...',
    emptyTitle: 'No Loan & Finance Leads Yet',
    emptySubtitle:
      'When any customer submits the Loan / EMI application form on the website, the lead appears here automatically.',
    waTemplate: (name, bike) =>
      `Hello ${name || 'Sir/Madam'}, thank you for contacting Adarsh Motors Loan & Finance Desk for ${bike || 'your bike loan'}. Please share your PAN/Aadhar & down payment preference for instant EMI approval!`,
  },
  service_leads: {
    badge: 'Workshop, Repair & Dyno Desk',
    title: 'Service & Workshop Leads',
    subtitle:
      'Dedicated leads inbox for customers requesting bike servicing, oil flush, dyno tuning, or workshop repair appointments.',
    defaultServiceType: 'Workshop & Dyno Service',
    phoneLabel: 'Service & Workshop Call & WhatsApp',
    accentColor: 'cyan',
    borderCls: 'border-slate-200',
    badgeCls: 'bg-sky-50 text-sky-700 border-sky-200',
    buttonCls: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    bikePlaceholder: 'e.g. Ducati Panigale V2 / Honda Activa 6G',
    notesPlaceholder: 'Service needed (periodic service, Motul 300V oil, brake pads, dyno check, pickup)...',
    emptyTitle: 'No Service & Workshop Leads Yet',
    emptySubtitle:
      'When any customer submits the Service / Workshop Booking form on the website, the lead appears here automatically.',
    waTemplate: (name, bike) =>
      `Hello ${name || 'Sir/Madam'}, thank you for contacting Adarsh Motors Service & Dyno Hub for ${bike || 'your motorcycle'}. Let us know your preferred date & time slot to confirm your workshop bay!`,
  },
  accessories_leads: {
    badge: 'Riding Gear, Exhausts & Upgrades Desk',
    title: 'Accessories & Gear Leads',
    subtitle:
      'Dedicated leads inbox for customers enquiring about Akrapovič exhausts, Dainese riding gear, Brembo brakes, helmets, crash protection & workshop fitment.',
    defaultServiceType: 'Accessories & Gear Enquiry',
    phoneLabel: 'Accessories & Gear Call & WhatsApp',
    accentColor: 'amber',
    borderCls: 'border-slate-200',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
    buttonCls: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    bikePlaceholder: 'e.g. Akrapovič Titanium Exhaust / Dainese Suit (EU 52)',
    notesPlaceholder: 'Size/fitment bike model, showroom pickup or pan-India shipping, quantity...',
    emptyTitle: 'No Accessories & Gear Leads Yet',
    emptySubtitle:
      'When any customer requests riding gear, exhausts, or superbike accessories on the website, the lead appears here automatically.',
    waTemplate: (name, bike) =>
      `Hello ${name || 'Sir/Madam'}, thank you for contacting Adarsh Motors Accessories & Riding Gear Desk regarding ${bike || 'your gear enquiry'}. Stock is available — share your bike model or size for instant dispatch or bay fitment!`,
  },
};

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

function getSpecializedLeadChips(l: LeadRecord) {
  const chips: Array<{ label: string; value: string; tone: string }> = [];
  if (l.loan_amount) {
    chips.push({ label: 'Loan Amt', value: l.loan_amount, tone: 'bg-blue-50 border-blue-200 text-blue-700' });
  }
  if (l.tenure) {
    chips.push({ label: 'Tenure', value: l.tenure, tone: 'bg-indigo-50 border-indigo-200 text-indigo-700' });
  }
  const emp = l.employment_type || l.employment;
  if (emp) {
    chips.push({ label: 'Employment', value: emp, tone: 'bg-slate-50 border-slate-200 text-slate-700' });
  }
  if (l.registration_number) {
    chips.push({ label: 'Reg No', value: l.registration_number, tone: 'bg-sky-50 border-sky-200 text-sky-700 font-mono' });
  }
  if (l.preferred_date) {
    chips.push({ label: 'Slot / Date', value: l.preferred_date, tone: 'bg-amber-50 border-amber-200 text-amber-800' });
  }
  if (l.branch) {
    chips.push({ label: 'Branch', value: l.branch, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' });
  }
  if (l.year) {
    chips.push({ label: 'Year', value: l.year, tone: 'bg-slate-50 border-slate-200 text-slate-700' });
  }
  if (l.km) {
    chips.push({ label: 'Odometer', value: l.km, tone: 'bg-slate-50 border-slate-200 text-slate-700' });
  }
  if (l.expected_price) {
    chips.push({ label: 'Budget / Quote', value: l.expected_price, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' });
  }
  if (l.condition) {
    chips.push({ label: 'Spec / Size', value: l.condition, tone: 'bg-amber-50 border-amber-200 text-amber-800' });
  }
  return chips;
}

export default function SpecializedLeadsSection({
  variant,
  leads,
  isRefreshingLeads,
  onRefreshLeads,
  onUpdateLeadStatus,
  onCreateLead,
  currentUserName,
  isOwner,
  sectionPhone,
  onSaveSectionPhone,
  onLogAuditAction,
}: SpecializedLeadsSectionProps) {
  const cfg = VARIANT_CONFIG[variant];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');
  const [showCaptureForm, setShowCaptureForm] = useState(false);

  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadBike, setLeadBike] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [isSavingLead, setIsSavingLead] = useState(false);

  const Icon =
    variant === 'exchange_leads'
      ? ArrowRightLeft
      : variant === 'loan_leads'
      ? Calculator
      : variant === 'accessories_leads'
      ? PackageOpen
      : Wrench;

  const stats = useMemo(() => {
    let newCount = 0;
    let activeCount = 0;
    let closedCount = 0;
    for (const l of leads) {
      const s = String(l?.status || '').toLowerCase();
      if (s === 'new' || s === 'new lead') newCount++;
      else if (s === 'contacted' || s === 'follow-up' || s === 'followup') activeCount++;
      else if (s === 'closed') closedCount++;
    }
    return {
      total: leads.length,
      newCount,
      activeCount,
      closedCount,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    const st = statusFilter.trim().toLowerCase();
    return leads.filter((l) => {
      if (!l) return false;
      const cName = String(l.customer_name || l.name || '').toLowerCase();
      const ph = String(l.phone || '').toLowerCase();
      const bike = String(l.bike_interested || l.bike_model || '').toLowerCase();
      const msg = String(l.message || l.notes || '').toLowerCase();
      const matchesSearch = !q || cName.includes(q) || ph.includes(q) || bike.includes(q) || msg.includes(q);
      const matchesStatus =
        !st ||
        st === 'all' ||
        String(l.status || '').toLowerCase() === st ||
        (st === 'new' && String(l.status || '').toLowerCase().includes('new'));
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;
    setIsSavingLead(true);
    try {
      await onCreateLead({
        name: leadName.trim(),
        phone: leadPhone.trim(),
        bike_model: leadBike.trim() || cfg.defaultServiceType,
        notes: leadNotes.trim(),
        service_type: cfg.defaultServiceType,
      });
      setLeadName('');
      setLeadPhone('');
      setLeadBike('');
      setLeadNotes('');
      setShowCaptureForm(false);
    } finally {
      setIsSavingLead(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn pb-6">
      {/* Top Executive Header */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <span
                className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border flex items-center gap-1 ${cfg.badgeCls}`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{cfg.badge}</span>
              </span>
              <span className="hidden sm:inline text-xs text-slate-600 font-mono">
                Leads Capturing Only • Dedicated Staff Access
              </span>
            </div>

            <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 shrink-0" />
              <span className="truncate">{cfg.title}</span>
            </h2>
            <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-2xl">
              {cfg.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefreshLeads}
              disabled={isRefreshingLeads}
              className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshingLeads ? 'animate-spin' : ''}`} />
              <span className="sm:hidden">{isRefreshingLeads ? 'Syncing...' : 'Sync Leads'}</span>
              <span className="hidden sm:inline">{isRefreshingLeads ? 'Syncing...' : 'Refresh Leads'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCaptureForm((prev) => !prev)}
              className={`min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${cfg.buttonCls}`}
            >
              {showCaptureForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showCaptureForm ? 'Close Form' : 'Capture Lead'}</span>
            </button>
          </div>
        </div>

        {/* Owner-Only Inline Call & WhatsApp Helpline Bar (Hidden from Workers) */}
        {isOwner && (
          <OwnerSectionPhoneControl
            isOwner={isOwner}
            sectionLabel={cfg.phoneLabel}
            phoneValue={sectionPhone}
            accentColor={cfg.accentColor}
            onSavePhone={onSaveSectionPhone}
          />
        )}
      </div>

      {/* Inline Quick Lead Capture Form (Leads Capturing Only) */}
      {showCaptureForm && (
        <form
          onSubmit={handleCaptureSubmit}
          className={`bg-white p-3.5 sm:p-5 rounded-2xl border ${cfg.borderCls} shadow-sm space-y-3 animate-fadeIn`}
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Icon className="w-4 h-4 text-emerald-600" />
              <span>Capture New {cfg.title.replace(' Leads', '')} Lead</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-600">Auto-tagged: {cfg.defaultServiceType}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. Karthik Reddy"
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Bike / Requirement *</label>
              <input
                type="text"
                required
                value={leadBike}
                onChange={(e) => setLeadBike(e.target.value)}
                placeholder={cfg.bikePlaceholder}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Customer Form / Notes</label>
            <textarea
              rows={2}
              value={leadNotes}
              onChange={(e) => setLeadNotes(e.target.value)}
              placeholder={cfg.notesPlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCaptureForm(false)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingLead}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${cfg.buttonCls}`}
            >
              <Check className="w-4 h-4" />
              <span>{isSavingLead ? 'Saving Lead...' : 'Save Lead'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4 KPI Summary Cards (Sleek 4-Across Row on Mobile) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-slate-600">
            <span className="truncate sm:hidden">Total</span>
            <span className="truncate hidden sm:inline">Total Leads</span>
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">
            {stats.total}
          </div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Captured in this desk</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-red-700">
            <span className="truncate sm:hidden">New</span>
            <span className="truncate hidden sm:inline">New Enquiries</span>
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-red-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">
            {stats.newCount}
          </div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Needs immediate callback</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-sky-700">
            <span className="truncate sm:hidden">Active</span>
            <span className="truncate hidden sm:inline">Contacted / Follow-Up</span>
            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-sky-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">
            {stats.activeCount}
          </div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">In process with staff</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-emerald-700">
            <span className="truncate sm:hidden">Closed</span>
            <span className="truncate hidden sm:inline">Completed / Closed</span>
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-emerald-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">
            {stats.closedCount}
          </div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Resolved requests</div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, phone, bike model..."
            className="w-full min-h-[40px] pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] sm:flex items-center gap-2">
          <EditableSelect
            compact
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || 'ALL')}
            containerClassName="min-w-0 sm:w-44"
            manualPlaceholder="Status..."
            options={[
              { value: 'ALL', label: `All (${leads.length})` },
              { value: 'New', label: `New (${stats.newCount})` },
              { value: 'Contacted', label: 'Contacted' },
              { value: 'Follow-up', label: 'Follow-up' },
              { value: 'Closed', label: `Closed (${stats.closedCount})` },
            ]}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
          />

          <div className="flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setLayoutMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                layoutMode === 'cards' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                layoutMode === 'table' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State or Leads Feed */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
          <Icon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">{cfg.emptyTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'No leads matched your search or status filter.'
              : cfg.emptySubtitle}
          </p>
        </div>
      ) : layoutMode === 'cards' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {filteredLeads.map((l) => {
            const visuals = getLeadStatusVisuals(l.status);
            const custName = l.customer_name || l.name || 'Valued Customer';
            const bikeName = l.bike_interested || l.bike_model || cfg.defaultServiceType;
            const noteText = l.message || l.notes || '';
            const createdStr = formatLeadDate(l.created_at);
            const waUrl = buildWhatsAppUrl(l.phone, cfg.waTemplate(custName, bikeName));

            return (
              <div
                key={l.id}
                className={`rounded-2xl bg-white border ${visuals.borderAccent} p-3.5 sm:p-5 shadow-sm flex flex-col justify-between gap-3 hover:border-slate-300 transition`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-slate-900 truncate">{custName}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                        <a
                          href={formatTelHref(l.phone)}
                          className="font-mono font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{l.phone}</span>
                        </a>
                        {createdStr && (
                          <span className="text-slate-500 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{createdStr}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 ${visuals.badgeCls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${visuals.dotCls}`} />
                      <span>{visuals.label}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                      <Bike className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>{bikeName}</span>
                    </span>
                    <span className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${cfg.badgeCls}`}>
                      {l.service_type || l.type || cfg.defaultServiceType}
                    </span>
                  </div>

                  {getSpecializedLeadChips(l).length > 0 && (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
                      {getSpecializedLeadChips(l).map((chip, idx) => (
                        <div
                          key={`${l.id}-schip-${idx}`}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 min-w-0 ${chip.tone}`}
                        >
                          <span className="opacity-75 uppercase tracking-wide text-[10px] shrink-0">{chip.label}:</span>
                          <span className="font-bold truncate">{chip.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {noteText && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{noteText}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={formatTelHref(l.phone)}
                      onClick={() =>
                        onLogAuditAction(
                          'lead_call',
                          'Leads CRM',
                          `${currentUserName} initiated phone call to ${custName} (${l.phone}) from ${cfg.title}`,
                          l.id,
                          custName
                        )
                      }
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        onLogAuditAction(
                          'lead_whatsapp',
                          'Leads CRM',
                          `${currentUserName} opened WhatsApp with ${custName} from ${cfg.title}`,
                          l.id,
                          custName
                        )
                      }
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <EditableSelect
                    compact
                    value={l.status || 'New'}
                    onChange={(nextVal) => onUpdateLeadStatus(l.id, nextVal)}
                    containerClassName="w-36"
                    manualPlaceholder="Status..."
                    options={[
                      { value: 'New', label: 'New' },
                      { value: 'Contacted', label: 'Contacted' },
                      { value: 'Follow-up', label: 'Follow-up' },
                      { value: 'Closed', label: 'Closed' },
                    ]}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase text-[11px] bg-slate-50">
                <th className="p-3">Customer</th>
                <th className="p-3">Bike / Requirement</th>
                <th className="p-3">Details &amp; Specs</th>
                <th className="p-3">Customer Form / Notes</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Follow-Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeads.map((l) => {
                const custName = l.customer_name || l.name || 'Valued Customer';
                const bikeName = l.bike_interested || l.bike_model || cfg.defaultServiceType;
                const waUrl = buildWhatsAppUrl(l.phone, cfg.waTemplate(custName, bikeName));
                const chips = getSpecializedLeadChips(l);
                const createdStr = formatLeadDate(l.created_at);
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition align-top">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{custName}</div>
                      <div className="font-mono text-xs text-sky-700">{l.phone}</div>
                      {createdStr && <div className="text-[10px] text-slate-500 mt-0.5">{createdStr}</div>}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{bikeName}</div>
                      <div className="text-[11px] text-slate-500">{l.service_type || l.type || cfg.defaultServiceType}</div>
                    </td>
                    <td className="p-3">
                      {chips.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {chips.map((chip, idx) => (
                            <span
                              key={`${l.id}-tabchip-${idx}`}
                              className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${chip.tone}`}
                            >
                              {chip.label}: {chip.value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs text-xs text-slate-600">
                      {l.message || l.notes || '—'}
                    </td>
                    <td className="p-3">
                      <EditableSelect
                        compact
                        value={l.status || 'New'}
                        onChange={(nextVal) => onUpdateLeadStatus(l.id, nextVal)}
                        containerClassName="w-32"
                        manualPlaceholder="Status..."
                        options={[
                          { value: 'New', label: 'New' },
                          { value: 'Contacted', label: 'Contacted' },
                          { value: 'Follow-up', label: 'Follow-up' },
                          { value: 'Closed', label: 'Closed' },
                        ]}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={formatTelHref(l.phone)}
                          className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
