import React from 'react';
import {
  Crown,
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Pencil,
  Trash2,
  Mail,
  MapPin,
  Phone,
  Lock,
  Sparkles,
} from 'lucide-react';
import EditableSelect from './EditableSelect';
import type { OtpOperatorConfig, OtpOperatorMode } from '../utils/otpService';

export interface OwnerAccount {
  id: number | string;
  name: string;
  phone: string;
  relation: string;
  email?: string;
  altPhone?: string;
  address?: string;
  personalNotes?: string;
  status: 'Active' | 'Inactive';
  isPrimary?: boolean;
}

export interface StaffAccount {
  id: number;
  name: string;
  phone: string;
  pin: string;
  role: string;
  permissions: string[];
  status: string;
}

const MODULE_LABELS: Record<string, string> = {
  overview: 'Overview',
  inventory: 'Superbikes Inventory',
  budget_bikes: 'Budget Bikes Inventory',
  accessories: 'Superbike Accessories',
  leads: 'Leads CRM',
  exchange_leads: 'Exchange / Sell Bike Leads',
  loan_leads: 'Loan & Finance Leads',
  service_leads: 'Service & Workshop Leads',
  accessories_leads: 'Accessories & Gear Leads',
  billing: 'Digital Billing',
  customers: 'Paper Transfer (RTO)',
  branches: 'Branches',
  settings: 'CMS & Social',
  section_controls: 'Website Sections ON/OFF',
  pnl: 'P&L Financials',
};

interface OwnerAndStaffAccessSectionProps {
  ownerAccounts: OwnerAccount[];
  currentUserPhone: string;
  staff: StaffAccount[];
  otpOperatorConfig: OtpOperatorConfig;
  onChangeOtpOperatorConfig: (next: OtpOperatorConfig, toastMsg?: string) => void;
  onSendTestOtp: (phone: string, recipientName: string) => Promise<void>;
  onAddOwner: () => void;
  onEditOwner: (owner: OwnerAccount) => void;
  onDeleteOwner: (owner: OwnerAccount) => void;
  onAddWorker: () => void;
  onEditWorker: (worker: StaffAccount) => void;
  onDeleteWorker: (worker: StaffAccount) => void;
}

export default function OwnerAndStaffAccessSection({
  ownerAccounts,
  currentUserPhone,
  staff,
  otpOperatorConfig,
  onChangeOtpOperatorConfig,
  onSendTestOtp,
  onAddOwner,
  onEditOwner,
  onDeleteOwner,
  onAddWorker,
  onEditWorker,
  onDeleteWorker,
}: OwnerAndStaffAccessSectionProps) {
  const clean10 = (raw?: string) => {
    const d = String(raw || '').replace(/\D/g, '');
    return d.length >= 10 ? d.slice(-10) : d;
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-6 sm:pb-10">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Owner Only</span>
            </span>
            <span className="hidden sm:inline text-xs text-slate-600 font-mono">
              Multi-Owner Family Access + Worker Module Control
            </span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0" />
            <span className="truncate">Owner &amp; Workers Access</span>
          </h2>
          <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-2xl">
            Manage primary &amp; family co-owner accounts (Father, Brother, Partners) with editable personal/contact details, and separately assign Superbikes or Budget Bikes access to showroom workers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAddOwner}
            className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Add Owner</span>
          </button>
          <button
            type="button"
            onClick={onAddWorker}
            className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Add Worker</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: OWNER & FAMILY CO-OWNER ACCESS (OWNER ONLY) */}
      <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 sm:space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
              <h3 className="text-sm sm:text-lg font-black text-slate-900">
                Owner Access &amp; Details
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs font-bold font-mono">
                {ownerAccounts.length} {ownerAccounts.length === 1 ? 'Owner' : 'Owners'}
              </span>
            </div>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-600 mt-1">
              Edit owner personal &amp; contact details or grant full Owner OTP login access to Father, Brother, or Co-Owners. Hidden completely from all worker logins.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddOwner}
            className="px-3 py-1.5 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer transition"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>+ Father / Brother / Co-Owner</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {ownerAccounts.map((owner) => {
            const isCurrent = clean10(owner.phone) === clean10(currentUserPhone);
            return (
              <div
                key={owner.id}
                className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-5 shadow-sm flex flex-col justify-between gap-3 transition hover:border-slate-300"
              >
                <div className="space-y-3">
                  {/* Top Identity Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black shrink-0">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-base truncate">
                            {owner.name}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                              Logged In
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-amber-800 font-bold mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{owner.relation || 'Owner / Super Admin'}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-slate-700">+91 {owner.phone}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 ${
                        owner.status === 'Inactive'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          owner.status === 'Inactive' ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span>{owner.status || 'Active'}</span>
                    </span>
                  </div>

                  {/* Personal & Contact Details Well */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>OTP Mobile: <strong className="text-slate-900 font-mono">+91 {owner.phone}</strong></span>
                      </span>
                      {owner.altPhone && (
                        <span className="text-slate-600 font-mono">Alt: {owner.altPhone}</span>
                      )}
                    </div>

                    {owner.email && (
                      <div className="text-slate-700 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{owner.email}</span>
                      </div>
                    )}

                    {owner.address && (
                      <div className="text-slate-600 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{owner.address}</span>
                      </div>
                    )}

                    {owner.personalNotes && (
                      <div className="text-amber-800 text-[11px] bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        {owner.personalNotes}
                      </div>
                    )}
                  </div>

                  {/* Full Authority Pill + OTP Test */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                    <span className="text-amber-800 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Full Owner Privileges (All Modules, P&amp;L, Audit &amp; Access)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onSendTestOtp(owner.phone, owner.name)}
                      className="text-amber-800 hover:text-slate-900 text-xs font-bold py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer transition"
                    >
                      Send Test OTP
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEditOwner(owner)}
                    className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-700" />
                    <span>Edit Owner Details</span>
                  </button>
                  {ownerAccounts.length > 1 && !isCurrent && (
                    <button
                      type="button"
                      onClick={() => onDeleteOwner(owner)}
                      className="min-h-[38px] px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OTP Operator Connection Bar */}
      <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 sm:space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Connected OTP Operator</h3>
              <p className="hidden sm:block text-xs text-slate-600">
                Controls how login OTPs are dispatched for Owners, Workers, and Customer Website
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            {otpOperatorConfig.mode === 'supabase_sms'
              ? 'Supabase Phone Auth'
              : otpOperatorConfig.mode === 'webhook'
              ? 'Custom SMS Webhook'
              : 'Adarsh OTP Operator (Active)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-bold uppercase mb-1">Operator Mode</label>
            <EditableSelect
              commitManualOnConfirm
              value={otpOperatorConfig.mode}
              onChange={(val) =>
                onChangeOtpOperatorConfig(
                  { ...otpOperatorConfig, mode: val as OtpOperatorMode },
                  `Switched OTP Operator mode to ${val}`
                )
              }
              manualPlaceholder="Write custom operator mode..."
              options={[
                { value: 'builtin', label: 'Adarsh OTP Operator (Instant / Demo + DB)' },
                { value: 'supabase_sms', label: 'Supabase Phone Auth (Twilio / SMS)' },
                { value: 'webhook', label: 'Custom SMS Operator Webhook' },
              ]}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold uppercase mb-1">Operator Name</label>
            <input
              type="text"
              value={otpOperatorConfig.operatorName}
              onChange={(e) =>
                onChangeOtpOperatorConfig({ ...otpOperatorConfig, operatorName: e.target.value })
              }
              placeholder="Adarsh OTP Operator"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold uppercase mb-1">
              Webhook Endpoint (Optional)
            </label>
            <input
              type="url"
              value={otpOperatorConfig.webhookUrl || ''}
              onChange={(e) =>
                onChangeOtpOperatorConfig({ ...otpOperatorConfig, webhookUrl: e.target.value })
              }
              placeholder="https://sms-operator.example/send-otp"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: WORKERS & STAFF ACCESS (MODULE-RESTRICTED) */}
      <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 sm:space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 shrink-0" />
              <h3 className="text-sm sm:text-lg font-black text-slate-900">
                Workers &amp; Staff OTP Access
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 text-[11px] sm:text-xs font-bold font-mono">
                {staff.length} {staff.length === 1 ? 'Worker' : 'Workers'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-xs font-bold">
                Section-Only · Unique Phone Required
              </span>
            </div>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-600 mt-1">
              Each worker requires a <strong>unique 10-digit phone number</strong> and can strictly view <strong>only the exact section(s) you check</strong>. All editable phone number controls are hidden from workers.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddWorker}
            className="px-3 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>+ Add Worker Phone</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {staff.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-5 shadow-sm flex flex-col justify-between gap-3 transition hover:border-slate-300"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-black text-sm shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 text-base truncate">{s.name}</div>
                      <div className="text-xs text-sky-700 font-mono font-semibold">
                        ID #{s.id} · +91 {s.phone}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{s.status}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      Phone + OTP{s.pin && s.pin !== 'OTP' ? ` · Note: ${s.pin}` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSendTestOtp(s.phone, s.name)}
                    className="text-sky-700 hover:text-slate-900 text-xs font-bold py-1 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 cursor-pointer transition"
                  >
                    Send Test OTP
                  </button>
                </div>

                <div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-slate-600 mb-1.5">
                    Allowed Modules ({s.permissions.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.permissions.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No modules assigned</span>
                    ) : (
                      s.permissions.map((p) => (
                        <span
                          key={p}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            p === 'inventory'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : p === 'budget_bikes'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : p === 'exchange_leads'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p === 'loan_leads'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : p === 'service_leads'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : p === 'accessories_leads'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {MODULE_LABELS[p] || p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onEditWorker(s)}
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-700" />
                  <span>Edit Worker</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteWorker(s)}
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
