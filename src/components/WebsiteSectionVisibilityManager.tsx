import React, { useState } from 'react';
import {
  Sliders, Globe, EyeOff, Check, X, Bike, Package,
  Wrench, ArrowRightLeft, Calendar, Calculator, Car, MapPin, Users,
  Bell, RefreshCw, Save, CheckCircle2, AlertTriangle, Power, Lock, Unlock, Monitor
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { SiteSettings } from '../App';
import { syncSectionVisibilityToSupabase, WebsiteSectionKey } from '../utils/sectionVisibilitySync';

interface Props {
  supabase: SupabaseClient;
  settings: SiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  currentUser: { name: string; phone: string; role: 'owner' | 'staff' };
  showToast: (msg: string) => void;
  logAuditAction: (action_type: any, module: any, description: string, target_id?: any, target_name?: string, details?: any) => void;
  onOpenStorefront?: () => void;
}

export interface WebsiteSectionConfig {
  id: string;
  key: keyof SiteSettings;
  phoneField?: keyof SiteSettings;
  title: string;
  category: 'Showcase' | 'Customer Services' | 'Transactions & Finance' | 'Identity & Promo';
  description: string;
  customerSiteAnchor: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const WEBSITE_SECTIONS: WebsiteSectionConfig[] = [
  {
    id: 'sec_inventory',
    key: 'enableInventoryFleet',
    phoneField: 'superbikesPhone',
    title: 'Superbikes Fleet Showcase',
    category: 'Showcase',
    description: 'Displays certified superbikes, cruisers & adventure bikes with specs, pricing, and direct Superbikes Desk contact.',
    customerSiteAnchor: '#superbikes',
    badge: 'Superbikes',
    icon: Bike,
    color: 'text-red-600',
  },
  {
    id: 'sec_budget_bikes',
    key: 'enableBudgetBikesSection',
    phoneField: 'budgetBikesPhone',
    title: 'Budget Bikes & Commuters Fleet',
    category: 'Showcase',
    description: 'Dedicated section for budget bikes, commuters & scooters with its own separate Budget Bikes Desk phone number.',
    customerSiteAnchor: '#budget-bikes',
    badge: 'Budget Bikes',
    icon: Bike,
    color: 'text-teal-600',
  },
  {
    id: 'sec_accessories',
    key: 'enableAccessoriesSection',
    phoneField: 'accessoriesPhone',
    title: 'Superbike Accessories & Riding Gear Catalog',
    category: 'Showcase',
    description: 'Shows Akrapovič exhausts, Dainese airbag suits, Brembo kits, helmets & crash protection with dedicated Accessories phone.',
    customerSiteAnchor: '#accessories',
    badge: 'Accessories',
    icon: Package,
    color: 'text-amber-700',
  },
  {
    id: 'sec_workshop',
    key: 'enableWorkshopBooking',
    phoneField: 'servicePhone',
    title: 'Workshop, Dyno Hub & Service Booking',
    category: 'Customer Services',
    description: 'Lets customers book technician service slots, Motul 300V oil flushes & dyno tuning with dedicated Service helpline.',
    customerSiteAnchor: '#workshop',
    badge: 'Service Hub',
    icon: Wrench,
    color: 'text-sky-600',
  },
  {
    id: 'sec_exchange',
    key: 'enableSellBike',
    phoneField: 'tradeInPhone',
    title: 'Exchange Bike / Instant Trade-In Valuation',
    category: 'Transactions & Finance',
    description: 'Enables customers to submit sell/exchange requests, get fast doorstep valuations & call the Trade-In Desk.',
    customerSiteAnchor: '#sell-modal',
    badge: 'Trade-In & Sell',
    icon: ArrowRightLeft,
    color: 'text-emerald-600',
  },
  {
    id: 'sec_testride',
    key: 'enableTestRide',
    phoneField: 'testRidePhone',
    title: 'VIP Weekend Test Ride Booking Scheduler',
    category: 'Customer Services',
    description: 'Online scheduler allowing verified riders to reserve test rides and call the Test Ride Coordinator directly.',
    customerSiteAnchor: '#test-ride',
    badge: 'Test Ride',
    icon: Calendar,
    color: 'text-orange-600',
  },
  {
    id: 'sec_finance',
    key: 'enableEmiCalculator',
    phoneField: 'financePhone',
    title: 'Low-Rate Finance & Monthly EMI Calculator',
    category: 'Transactions & Finance',
    description: 'Interactive loan tenure slider with bank interest rates, monthly payment estimators & direct Finance Desk phone.',
    customerSiteAnchor: '#finance',
    badge: 'EMI Finance',
    icon: Calculator,
    color: 'text-blue-600',
  },
  {
    id: 'sec_hub',
    key: 'enableCustomerHub',
    phoneField: 'billingPhone',
    title: 'Customer Vehicle Ownership & Document Hub',
    category: 'Customer Services',
    description: 'Lets buyers look up RC smart card transfer progress, insurance & invoices with direct RTO / Billing Desk phone.',
    customerSiteAnchor: '#ownership-hub',
    badge: 'Buyer Portal',
    icon: Car,
    color: 'text-purple-600',
  },
  {
    id: 'sec_banner',
    key: 'bannerActive',
    title: 'Top Festive Announcement & Promo Ticker Banner',
    category: 'Identity & Promo',
    description: 'Top announcement ribbon on the storefront highlighting seasonal campaigns, zero fees, and RSA offers.',
    customerSiteAnchor: '#promo-banner',
    badge: 'Promo Ticker',
    icon: Bell,
    color: 'text-amber-600',
  },
  {
    id: 'sec_branches',
    key: 'enableBranchLocations',
    phoneField: 'branchesPhone',
    title: 'Showroom Branches & Studio Locations',
    category: 'Showcase',
    description: 'Showroom cards with addresses, per-branch phone numbers, timings, and 1-tap Google Maps directions.',
    customerSiteAnchor: '#locations',
    badge: 'Studio Locations',
    icon: MapPin,
    color: 'text-rose-600',
  },
  {
    id: 'sec_community',
    key: 'enableCommunityRides',
    phoneField: 'communityPhone',
    title: 'VIP Riders Community & Sunday Breakfast Rides',
    category: 'Identity & Promo',
    description: 'Highlights the superbike owners club, Sunday ride schedule & direct Community Coordinator helpline.',
    customerSiteAnchor: '#community',
    badge: 'Community Club',
    icon: Users,
    color: 'text-indigo-600',
  },
  {
    id: 'sec_invoice_price_public',
    key: 'enableInvoicePricePublic',
    title: 'Digital Invoice / Delivery Note Price (Public View)',
    category: 'Transactions & Finance',
    description: 'Controls whether the Price Section is visible on customer/public digital invoice & delivery note views (OFF by default).',
    customerSiteAnchor: '#ownership-hub',
    badge: 'Invoice Price',
    icon: Calculator,
    color: 'text-emerald-600',
  },
];

export default function WebsiteSectionVisibilityManager({
  supabase,
  settings,
  setSettings,
  currentUser,
  showToast,
  logAuditAction,
  onOpenStorefront,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('ALL');
  const [showDisableAllConfirm, setShowDisableAllConfirm] = useState(false);

  const handleToggleSection = async (sec: WebsiteSectionConfig) => {
    const currentValue = Boolean(settings[sec.key]);
    const nextValue = !currentValue;
    const nextSettings: SiteSettings = { ...settings, [sec.key]: nextValue };

    setSettings(nextSettings);

    logAuditAction(
      'settings_edit',
      'CMS Settings',
      `${currentUser.name} turned section "${sec.title}" ${nextValue ? 'ON (Visible)' : 'OFF (Hidden)'}`,
      sec.id,
      sec.title,
      { field: sec.key as string, before: currentValue, after: nextValue }
    );

    const { ok, errorMessage } = await syncSectionVisibilityToSupabase(
      supabase,
      nextSettings,
      sec.key as WebsiteSectionKey,
      nextValue
    );

    if (ok) {
      showToast(`${sec.badge} is now ${nextValue ? 'VISIBLE ON WEBSITE (ON)' : 'HIDDEN ON WEBSITE (OFF)'}`);
    } else {
      showToast(`Saved locally — Supabase sync failed: ${errorMessage}`);
    }
  };

  const handleEnableAll = async () => {
    const nextSettings: SiteSettings = {
      ...settings,
      enableInventoryFleet: true,
      enableBudgetBikesSection: true,
      enableAccessoriesSection: true,
      enableWorkshopBooking: true,
      enableSellBike: true,
      enableTestRide: true,
      enableEmiCalculator: true,
      enableCustomerHub: true,
      enableBranchLocations: true,
      enableCommunityRides: true,
      bannerActive: true,
    };

    setSettings(nextSettings);
    logAuditAction('settings_edit', 'CMS Settings', `${currentUser.name} activated all customer website sections`);

    const { ok, errorMessage } = await syncSectionVisibilityToSupabase(
      supabase,
      nextSettings,
      'enableAccessoriesSection',
      true
    );
    if (ok) {
      showToast('All storefront sections are now LIVE (ON).');
    } else {
      showToast(`Saved locally — Supabase sync failed: ${errorMessage}`);
    }
  };

  const handleDisableAll = async () => {
    setShowDisableAllConfirm(false);

    const nextSettings: SiteSettings = {
      ...settings,
      enableInventoryFleet: false,
      enableBudgetBikesSection: false,
      enableAccessoriesSection: false,
      enableWorkshopBooking: false,
      enableSellBike: false,
      enableTestRide: false,
      enableEmiCalculator: false,
      enableCustomerHub: false,
      enableBranchLocations: false,
      enableCommunityRides: false,
      bannerActive: false,
    };

    setSettings(nextSettings);
    logAuditAction('settings_edit', 'CMS Settings', `${currentUser.name} turned OFF all customer website sections`);

    const { ok, errorMessage } = await syncSectionVisibilityToSupabase(
      supabase,
      nextSettings,
      'enableAccessoriesSection',
      false
    );
    if (ok) {
      showToast('All storefront sections turned OFF (Stealth mode).');
    } else {
      showToast(`Saved locally — Supabase sync failed: ${errorMessage}`);
    }
  };

  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      const { ok, errorMessage } = await syncSectionVisibilityToSupabase(
        supabase,
        settings,
        'enableAccessoriesSection',
        Boolean(settings.enableAccessoriesSection)
      );
      if (ok) {
        showToast('Published website visibility settings live to Supabase.');
      } else {
        showToast(`Saved locally — Supabase sync error: ${errorMessage}`);
      }
    } finally {
      setTimeout(() => setIsSaving(false), 250);
    }
  };

  const filteredSections = WEBSITE_SECTIONS.filter(
    (s) => selectedFilterCategory === 'ALL' || s.category === selectedFilterCategory
  );

  const activeCount = WEBSITE_SECTIONS.filter((s) => Boolean(settings[s.key])).length;
  const totalCount = WEBSITE_SECTIONS.length;

  return (
    <div className="space-y-3.5 sm:space-y-5 pb-6 sm:pb-8">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-600 mb-1">
            <span className="text-red-600 font-bold">Master Visibility Controls</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Supabase Table: site_settings</span>
          </div>

          <h2 className="text-base sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0" />
            <span className="truncate">Website Section Visibility</span>
          </h2>

          <p className="hidden sm:block text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Turn customer-facing modules ON or OFF immediately. Every switch writes straight to Supabase so the live storefront updates in real time.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
          {onOpenStorefront && (
            <button
              type="button"
              onClick={onOpenStorefront}
              className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Globe className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="truncate">Live Storefront</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={isSaving}
            className={`min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer ${!onOpenStorefront ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 shrink-0" />}
            <span className="truncate">{isSaving ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Summary & Bulk Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
              Storefront Live Health
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-0.5 sm:mt-1">
              {activeCount}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-slate-600">of {totalCount} Live</span>
            </div>
            <div className="text-xs mt-0.5">
              {totalCount - activeCount === 0 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> All visible
                </span>
              ) : (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {totalCount - activeCount} hidden
                </span>
              )}
            </div>
          </div>
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border shrink-0 ${
              activeCount === totalCount
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-2.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-base font-bold text-slate-900 truncate">Full Launch</div>
            <div className="hidden sm:block text-xs text-slate-600 mt-0.5">Publish all {totalCount} sections</div>
            <button
              type="button"
              onClick={handleEnableAll}
              className="mt-2 sm:mt-3 w-full sm:w-auto min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Turn ALL ON</span>
            </button>
          </div>
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 items-center justify-center border border-emerald-200 shrink-0">
            <Unlock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-2.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-base font-bold text-slate-900 truncate">Stealth Mode</div>
            <div className="hidden sm:block text-xs text-slate-600 mt-0.5">Hide all public modules</div>
            <button
              type="button"
              onClick={() => setShowDisableAllConfirm(true)}
              className="mt-2 sm:mt-3 w-full sm:w-auto min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-200 transition cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
              <span className="truncate">Turn ALL OFF</span>
            </button>
          </div>
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 text-slate-600 items-center justify-center border border-slate-200 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pt-0.5">
        {(['ALL', 'Showcase', 'Customer Services', 'Transactions & Finance', 'Identity & Promo'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedFilterCategory(cat)}
            className={`min-h-[36px] sm:min-h-[40px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition cursor-pointer ${
              selectedFilterCategory === cat
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 12 Interactive Section Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {filteredSections.map((sec) => {
          const isEnabled = Boolean(settings[sec.key]);
          const IconComp = sec.icon;

          return (
            <div
              key={sec.id}
              className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-colors flex flex-col justify-between space-y-2.5 sm:space-y-4 hover:border-slate-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isEnabled
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
                        {sec.badge}
                      </div>
                      <div className="text-xs font-mono text-sky-700 truncate">{sec.customerSiteAnchor}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 border ${
                      isEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {isEnabled ? 'Live on Site' : 'Hidden'}
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-lg text-slate-900 mt-2.5 leading-snug">
                  {sec.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 sm:line-clamp-none leading-relaxed">
                  {sec.description}
                </p>

                {sec.phoneField && (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600 font-medium">Section Contact:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {String(settings[sec.phoneField] || settings.salesPhone || '+91 9014540489')}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                <div className="text-sm font-mono font-semibold">
                  <span className="text-slate-600 mr-1.5 font-sans">Status:</span>
                  <span className={isEnabled ? 'text-emerald-700' : 'text-slate-600'}>
                    {isEnabled ? 'ACTIVE' : 'OFFLINE'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleSection(sec)}
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label={`Toggle ${sec.title}`}
                  className="min-h-[44px] inline-flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
                >
                  <span className={`text-sm font-bold uppercase tracking-wider ${isEnabled ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {isEnabled ? 'ON' : 'OFF'}
                  </span>
                  <span
                    className={`w-14 h-7 rounded-full transition-colors relative p-0.5 flex items-center ${
                      isEnabled ? 'bg-emerald-600' : 'bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 flex items-center justify-center ${
                        isEnabled ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    >
                      {isEnabled ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-600 stroke-[3]" />
                      )}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Info Strip */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Supabase Real-Time Sync Ready</span>
          </h4>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Every section switch writes directly to <code className="text-sky-700 font-mono">site_settings</code> on{' '}
            <code className="text-sky-700 font-mono">itmarysfybhcrmvnggyy.supabase.co</code>. Open the Live Storefront anytime to verify customer view changes immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveAndPublish}
          disabled={isSaving}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-sm flex items-center gap-2 transition cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          <span>Force Sync Now</span>
        </button>
      </div>

      {/* Disable All Modal */}
      {showDisableAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 border border-amber-200 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Turn OFF All Sections?</h3>
            <p className="text-sm text-slate-600 mt-1.5 mb-5 leading-relaxed">
              This hides all public showroom modules from customers until you turn them back ON.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDisableAllConfirm(false)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-sm cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisableAll}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm cursor-pointer"
              >
                Confirm Turn OFF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
