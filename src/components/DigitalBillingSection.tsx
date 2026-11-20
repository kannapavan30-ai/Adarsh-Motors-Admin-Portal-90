import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Car,
  FileText,
  Zap,
  Printer,
  Download,
  Pencil,
  Receipt,
  LayoutList,
  Table as TableIcon,
  Eye,
  Globe,
  Calendar,
  Phone,
  IndianRupee,
} from 'lucide-react';
import PublicVisibilityToggle from './PublicVisibilityToggle';
import OwnerSectionPhoneControl from './OwnerSectionPhoneControl';
import type { InvoiceItem, SiteSettings } from '../App';
import { formatDeliveryDate } from './DeliveryNoteInvoice';
import { formatCompactINR } from '../utils/sectionVisibilitySync';

interface DigitalBillingSectionProps {
  invoices: InvoiceItem[];
  filteredInvoices: InvoiceItem[];
  billingSearch: string;
  onBillingSearchChange: (val: string) => void;
  totalRevenue: number;
  settings: SiteSettings;
  isOwner?: boolean;
  onSaveSectionPhone?: (nextPhone: string) => Promise<boolean> | boolean;
  formatINR: (val: number) => string;
  onToggleAllInvoicesPriceFlag: (
    settingKey: 'enableInvoicePriceView' | 'enableInvoicePricePublic',
    invoiceField: 'show_price_view' | 'show_price_public',
    label: string
  ) => void;
  onToggleBuyerPortal: () => void;
  onOpenCustomerHub: (inv: InvoiceItem) => void;
  onNewDeliveryNote: () => void;
  onToggleInvoicePriceFlag: (inv: InvoiceItem, field: 'show_price_view' | 'show_price_public') => void;
  onPrintInvoice: (inv: InvoiceItem) => void;
  onDownloadInvoice: (inv: InvoiceItem) => void;
  onEditInvoice: (inv: InvoiceItem) => void;
}

export default function DigitalBillingSection({
  invoices,
  filteredInvoices,
  billingSearch,
  onBillingSearchChange,
  totalRevenue,
  settings,
  isOwner = false,
  onSaveSectionPhone,
  formatINR,
  onToggleAllInvoicesPriceFlag,
  onToggleBuyerPortal,
  onOpenCustomerHub,
  onNewDeliveryNote,
  onToggleInvoicePriceFlag,
  onPrintInvoice,
  onDownloadInvoice,
  onEditInvoice,
}: DigitalBillingSectionProps) {
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'WITH_DOCS' | 'PUBLIC_PRICE' | 'ECHARGER'>('ALL');

  const displayedInvoices = useMemo(() => {
    if (quickFilter === 'WITH_DOCS') {
      return filteredInvoices.filter((inv) => inv.documents && inv.documents.length > 0);
    }
    if (quickFilter === 'PUBLIC_PRICE') {
      return filteredInvoices.filter((inv) => Boolean(inv.show_price_public));
    }
    if (quickFilter === 'ECHARGER') {
      return filteredInvoices.filter((inv) => Boolean(inv.has_echarger));
    }
    return filteredInvoices;
  }, [filteredInvoices, quickFilter]);

  const docsCount = useMemo(
    () => invoices.filter((i) => i.documents && i.documents.length > 0).length,
    [invoices]
  );
  const publicPriceCount = useMemo(
    () => invoices.filter((i) => Boolean(i.show_price_public)).length,
    [invoices]
  );
  const echargerCount = useMemo(
    () => invoices.filter((i) => Boolean(i.has_echarger)).length,
    [invoices]
  );

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn pb-6">
      {/* Top Executive Studio Header */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Delivery Notes &amp; RC Hub</span>
              </span>
              <span className="hidden sm:inline text-xs text-slate-600 font-mono">Price Section Privacy Controls</span>
            </div>
            <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              Digital Billing &amp; Delivery Notes
            </h2>
            <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-3xl">
              Issue official Adarsh Motors Auto Consultants Delivery Notes, manage RC/Transfer papers, and control Price section visibility (View &amp; Public ON/OFF).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
            <PublicVisibilityToggle
              compact
              label="Price (View)"
              isVisible={Boolean(settings.enableInvoicePriceView)}
              onToggle={() =>
                onToggleAllInvoicesPriceFlag(
                  'enableInvoicePriceView',
                  'show_price_view',
                  'Invoice Price Section (View)'
                )
              }
              title="Toggle Price Section ON/OFF in Digital Delivery Note View"
            />
            <PublicVisibilityToggle
              compact
              label="Price (Public)"
              isVisible={Boolean(settings.enableInvoicePricePublic)}
              onToggle={() =>
                onToggleAllInvoicesPriceFlag(
                  'enableInvoicePricePublic',
                  'show_price_public',
                  'Invoice Price (Public View)'
                )
              }
              title="Toggle Price Section ON/OFF on Public Customer Portal"
            />
            <PublicVisibilityToggle
              compact
              label="Buyer Portal"
              isVisible={Boolean(settings.enableCustomerHub)}
              onToggle={onToggleBuyerPortal}
            />
            <button
              type="button"
              onClick={() => {
                if (invoices.length > 0) {
                  onOpenCustomerHub(invoices[0]);
                }
              }}
              className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
              <span className="sm:hidden">Buyer Hub</span>
              <span className="hidden sm:inline">Customer Portal View</span>
            </button>
            <button
              type="button"
              onClick={onNewDeliveryNote}
              className="col-span-2 sm:col-span-1 min-h-[38px] sm:min-h-[40px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Delivery Note</span>
            </button>
          </div>
        </div>

        {/* Owner-Only Inline Call & WhatsApp Helpline Bar (Hidden from Workers) */}
        {isOwner && onSaveSectionPhone && (
          <OwnerSectionPhoneControl
            isOwner={isOwner}
            sectionLabel="RTO & Billing Call / WhatsApp"
            phoneValue={settings.billingPhone || settings.salesPhone || ''}
            accentColor="purple"
            onSavePhone={onSaveSectionPhone}
          />
        )}
      </div>

      {/* 4 KPI Quick Stat Cards (Sleek 4-Across Row on Mobile) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-slate-600">
            <span className="truncate sm:hidden">Revenue</span>
            <span className="truncate hidden sm:inline">Price Section Status</span>
            <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-xs sm:text-xl font-black text-emerald-700 font-mono mt-0.5 sm:mt-1.5 truncate tabular-nums leading-tight">
            {settings.enableInvoicePriceView ? (
              totalRevenue > 0 ? (
                <>
                  <span className="sm:hidden">{formatCompactINR(totalRevenue)}</span>
                  <span className="hidden sm:inline">{formatINR(totalRevenue)}</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">ON</span>
                  <span className="hidden sm:inline">View ON (No Price)</span>
                </>
              )
            ) : (
              <>
                <span className="sm:hidden">Hidden</span>
                <span className="hidden sm:inline">Hidden (No Price)</span>
              </>
            )}
          </div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Staff invoice visibility</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-slate-600">
            <span className="truncate sm:hidden">Notes</span>
            <span className="truncate hidden sm:inline">Delivery Notes</span>
            <Receipt className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">
            <span>{invoices.length}</span>
            <span className="hidden sm:inline text-sm font-bold text-slate-600 ml-1">Registered</span>
          </div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Official showroom slips</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-sky-700">
            <span className="truncate sm:hidden">Docs</span>
            <span className="truncate hidden sm:inline">Vehicles With Docs</span>
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-black text-sky-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">
            <span>{docsCount}</span>
            <span className="hidden sm:inline text-sm font-bold text-sky-700 ml-1">Uploaded</span>
          </div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">RC, Insurance &amp; PUC ready</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-amber-800">
            <span className="truncate sm:hidden">Public ₹</span>
            <span className="truncate hidden sm:inline">Public Price Visible</span>
            <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-black text-amber-800 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">
            {publicPriceCount}/{invoices.length}
            <span className="hidden sm:inline text-sm font-bold ml-1">ON</span>
          </div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Shown on Buyer Portal</div>
        </div>
      </div>

      {/* Filter Pills + Search + View Switcher */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2.5 sm:space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 lg:pb-0">
            {[
              { id: 'ALL' as const, label: 'All Notes', count: filteredInvoices.length },
              { id: 'WITH_DOCS' as const, label: 'Docs / RC', count: docsCount },
              { id: 'PUBLIC_PRICE' as const, label: 'Public Price', count: publicPriceCount },
              { id: 'ECHARGER' as const, label: 'E-Charger', count: echargerCount },
            ].map((tab) => {
              const active = quickFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQuickFilter(tab.id)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                    active
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] sm:text-[11px] ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop View Toggle */}
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

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 pt-2 border-t border-slate-200">
          <div className="relative flex-1 sm:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={billingSearch}
              onChange={(e) => onBillingSearchChange(e.target.value)}
              placeholder="Search owner, reg #, model, or note #..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
            />
          </div>
          <div className="text-xs sm:text-sm text-slate-600 flex items-center justify-between sm:justify-end">
            <span>
              Showing <span className="text-slate-900 font-bold font-mono">{displayedInvoices.length}</span> notes
            </span>
          </div>
        </div>
      </div>

      {/* MAIN LIST: DETAILED CARDS OR OPTIONAL TABLE */}
      {displayedInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center space-y-2">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-base font-bold text-slate-900">No delivery notes found</div>
          <p className="text-xs sm:text-sm text-slate-600">
            Try switching filters or searching with another owner name, registration number, or slip number.
          </p>
        </div>
      ) : layoutMode === 'cards' ? (
        <div className="space-y-2.5 sm:space-y-3.5">
          {displayedInvoices.map((inv) => {
            const isViewPriceOn = Boolean(inv.show_price_view);
            const isPublicPriceOn = Boolean(inv.show_price_public);
            const hasPriceVal = Number(inv.price || 0) > 0;
            const deliveryDate = inv.delivery_note?.delivery_date || formatDeliveryDate(inv.created_at);
            const docsLen = inv.documents?.length || 0;

            return (
              <div
                key={inv.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:border-slate-300"
              >
                <div className="p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
                  {/* LEFT ZONE: Slip #, IND Reg Plate, Purchaser, Date */}
                  <div className="lg:col-span-4 space-y-3 lg:border-r lg:border-slate-200 lg:pr-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-black text-red-700 text-sm sm:text-base">
                        No. {inv.delivery_note?.note_no || inv.invoice_number}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-red-200 text-red-700 font-mono font-black text-xs uppercase tracking-wider">
                        <span className="text-[11px] text-blue-700 font-black">IND</span>
                        <span>{inv.reg_number || 'TS 09 EQ 4200'}</span>
                      </span>
                    </div>

                    <div>
                      <div className="text-base font-extrabold text-slate-900">{inv.customer_name}</div>
                      <div className="text-xs sm:text-sm font-mono text-sky-700 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>+91 {inv.mobile}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        <span>{deliveryDate}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-mono">
                        {inv.delivery_note?.vehicle_category || 'M.Cycle'}
                      </span>
                      {inv.payment_mode && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
                          {inv.payment_mode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT ZONE: Vehicle Details, Docs, Price Visibility Switches & Actions */}
                  <div className="lg:col-span-8 space-y-3 min-w-0">
                    {/* Vehicle + Price Strip */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-7 space-y-1 min-w-0">
                        <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
                          Delivered Vehicle &amp; Chassis
                        </div>
                        <div className="text-sm sm:text-base font-extrabold text-slate-900 break-words">
                          {inv.vehicle}
                        </div>
                        {inv.delivery_note?.chassis_number && (
                          <div className="text-xs font-mono text-slate-600">
                            Chassis: <span className="text-slate-900">{inv.delivery_note.chassis_number}</span>
                          </div>
                        )}
                        {inv.has_echarger && (
                          <div className="text-xs text-amber-800 flex items-center gap-1 pt-0.5 font-semibold">
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">{inv.echarger_details || 'Fast Home Charger Kit Included'}</span>
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-5 sm:text-right space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2.5 sm:pt-0 sm:pl-3">
                        <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
                          Price Display
                        </div>
                        <div className="font-mono text-base font-black">
                          {isViewPriceOn && hasPriceVal ? (
                            <span className="text-emerald-700">{formatINR(inv.price)}</span>
                          ) : (
                            <span className="text-slate-500 text-sm font-semibold">No Price (Hidden)</span>
                          )}
                        </div>
                        <div className="flex flex-wrap sm:justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleInvoicePriceFlag(inv, 'show_price_view')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              isViewPriceOn
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            <span>View: {isViewPriceOn ? 'ON' : 'OFF'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleInvoicePriceFlag(inv, 'show_price_public')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              isPublicPriceOn
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                            }`}
                          >
                            <Globe className="w-3 h-3" />
                            <span>Public: {isPublicPriceOn ? 'ON' : 'OFF'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Docs & Action Buttons Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
                      <div>
                        {docsLen > 0 ? (
                          <button
                            type="button"
                            onClick={() => onOpenCustomerHub(inv)}
                            className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-700" />
                            <span>{docsLen} Attached Document{docsLen === 1 ? '' : 's'} (RC / Docs)</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic px-1">No RC/transfer files attached yet</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onPrintInvoice(inv)}
                          className="min-h-[38px] px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View / Print</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadInvoice(inv)}
                          className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-600" />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditInvoice(inv)}
                          className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCustomerHub(inv)}
                          className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                          title="Customer Ownership Hub Preview"
                        >
                          <Car className="w-3.5 h-3.5 text-sky-600" />
                          <span>Hub</span>
                        </button>
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
                  <th className="py-3.5 px-4">Note #</th>
                  <th className="py-3.5 px-4">Registration #</th>
                  <th className="py-3.5 px-4">Owner / Purchaser</th>
                  <th className="py-3.5 px-4">Vehicle Model</th>
                  <th className="py-3.5 px-4">Docs &amp; RC</th>
                  <th className="py-3.5 px-4">Delivery</th>
                  <th className="py-3.5 px-4">Price Section</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayedInvoices.map((inv) => {
                  const isViewPriceOn = Boolean(inv.show_price_view);
                  const isPublicPriceOn = Boolean(inv.show_price_public);
                  const hasPriceVal = Number(inv.price || 0) > 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition align-top">
                      <td className="py-3.5 px-4 font-mono font-bold text-red-700 whitespace-nowrap">
                        No. {inv.delivery_note?.note_no || inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 border border-red-200 text-red-700 font-mono font-bold text-xs uppercase tracking-wider">
                          <span className="text-xs text-blue-700 font-black">IND</span>
                          <span>{inv.reg_number || 'TS 09 EQ 4200'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.customer_name}</div>
                        <div className="font-mono text-xs text-slate-600">+91 {inv.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.vehicle}</div>
                        {inv.delivery_note?.chassis_number && (
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            Chassis: {inv.delivery_note.chassis_number}
                          </div>
                        )}
                        {inv.has_echarger && (
                          <div className="text-xs text-amber-800 flex items-center gap-1 mt-0.5 font-medium">
                            <Zap className="w-3.5 h-3.5 text-amber-700" />
                            <span>{inv.echarger_details || 'Fast Home Charger Kit'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.documents && inv.documents.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => onOpenCustomerHub(inv)}
                            className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-700" />
                            <span>{inv.documents.length} Docs</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No files</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-700 font-medium">
                          {inv.delivery_note?.delivery_date || formatDeliveryDate(inv.created_at)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {inv.delivery_note?.vehicle_category || 'M.Cycle'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="font-mono text-xs font-bold">
                            {isViewPriceOn && hasPriceVal ? (
                              <span className="text-emerald-700">{formatINR(inv.price)}</span>
                            ) : (
                              <span className="text-slate-500 italic">No Price (Hidden)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onToggleInvoicePriceFlag(inv, 'show_price_view')}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                                isViewPriceOn
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                              }`}
                            >
                              View: {isViewPriceOn ? 'ON' : 'OFF'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleInvoicePriceFlag(inv, 'show_price_public')}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                                isPublicPriceOn
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                              }`}
                            >
                              Public: {isPublicPriceOn ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintInvoice(inv)}
                            className="px-2.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownloadInvoice(inv)}
                            title="Download Standalone Delivery Note"
                            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-sky-700 border border-slate-200 transition cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditInvoice(inv)}
                            title="Edit Delivery Note Details"
                            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenCustomerHub(inv)}
                            title="Customer Ownership Hub Preview"
                            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                          >
                            <Car className="w-4 h-4" />
                          </button>
                        </div>
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
