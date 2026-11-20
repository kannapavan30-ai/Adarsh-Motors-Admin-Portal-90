import React, { useMemo, useState } from 'react';
import {
  Bike,
  Plus,
  Search,
  LayoutGrid,
  List,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Users,
  Crown,
  Sparkles,
  CheckCircle2,
  Clock,
  Tag,
} from 'lucide-react';
import PublicVisibilityToggle from './PublicVisibilityToggle';
import EditableSelect from './EditableSelect';
import OwnerSectionPhoneControl from './OwnerSectionPhoneControl';
import type { BikeItem } from '../App';
import {
  FALLBACK_SHOWROOM_IMAGE,
  isAccessoryItem,
  matchesBikeCategoryFilter,
  normalizeBikeCategory,
  normalizeLocalAssetUrl,
} from '../utils/sectionVisibilitySync';

interface BikeInventorySectionProps {
  variant: 'superbikes' | 'budget';
  bikes: BikeItem[];
  isSectionVisibleOnSite: boolean;
  onToggleSectionVisibility: () => void;
  onAddBike: () => void;
  onEditBike: (bike: BikeItem) => void;
  onDeleteBike: (bike: BikeItem) => void;
  onPreviewBike: (bike: BikeItem) => void;
  onToggleBikeStatus: (bike: BikeItem) => void;
  onToggleBikeVisibility: (bike: BikeItem) => void;
  onChangeBikeStatus: (bike: BikeItem, newStatus: BikeItem['status']) => Promise<void>;
  isOwner: boolean;
  sectionPhone?: string;
  onSaveSectionPhone?: (nextPhone: string) => Promise<boolean> | boolean;
  getBikeLeads: (bike: BikeItem) => any[];
  onOpenBikeLeads: (bike: BikeItem) => void;
  formatINR: (val: any) => string;
  initialSearch?: string;
}

export default function BikeInventorySection({
  variant,
  bikes,
  isSectionVisibleOnSite,
  onToggleSectionVisibility,
  onAddBike,
  onEditBike,
  onDeleteBike,
  onPreviewBike,
  onToggleBikeStatus,
  onToggleBikeVisibility,
  onChangeBikeStatus,
  isOwner,
  sectionPhone = '',
  onSaveSectionPhone,
  getBikeLeads,
  onOpenBikeLeads,
  formatINR,
  initialSearch = '',
}: BikeInventorySectionProps) {
  const [search, setSearch] = useState(initialSearch);
  const [catFilter, setCatFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'showroom' | 'table'>('showroom');

  const isSuperbike = variant === 'superbikes';

  const vehicleBikes = useMemo(
    () => bikes.filter((b) => b && !isAccessoryItem(b)),
    [bikes]
  );

  const stats = useMemo(() => {
    let available = 0;
    let booked = 0;
    let sold = 0;
    let hidden = 0;
    for (const b of vehicleBikes) {
      const s = String(b?.status || 'Available');
      if (s === 'Available') available++;
      else if (s === 'Booked') booked++;
      else if (s === 'Sold') sold++;
      else if (s === 'Hidden') hidden++;
    }
    return { total: vehicleBikes.length, available, booked, sold, hidden };
  }, [vehicleBikes]);

  const filteredBikes = useMemo(() => {
    const q = (search || '').toLowerCase().trim();
    const catClean = String(catFilter || '').trim();
    const catLower = catClean.toLowerCase();
    const statusClean = String(statusFilter || '').trim();
    const statusLower = statusClean.toLowerCase();

    return vehicleBikes.filter((b) => {
      if (!b) return false;
      const bName = String(b.name || '').toLowerCase();
      const bBrand = String(b.brand || '').toLowerCase();
      const matchesSearch =
        !q ||
        bName.includes(q) ||
        bBrand.includes(q) ||
        String(b.category || '').toLowerCase().includes(q) ||
        String(b.location || '').toLowerCase().includes(q);

      const matchesCat =
        !catClean ||
        catClean === 'ALL' ||
        matchesBikeCategoryFilter(b.category, catClean) ||
        String(b.category || '').toLowerCase().includes(catLower) ||
        bName.includes(catLower) ||
        bBrand.includes(catLower);

      const matchesStatus =
        !statusClean ||
        statusClean === 'ALL' ||
        b.status === statusClean ||
        String(b.status || '').toLowerCase().includes(statusLower);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [vehicleBikes, search, catFilter, statusFilter]);

  const categoryOptions = isSuperbike
    ? [
        { value: 'ALL', label: 'All Luxury & Superbikes' },
        { value: 'Superbikes', label: 'Superbikes' },
        { value: 'Cruisers', label: 'Cruisers' },
        { value: 'Adventure', label: 'Adventure Tourers' },
        { value: 'Luxury', label: 'Luxury Bikes' },
      ]
    : [
        { value: 'ALL', label: 'All Mid-Range, Budget & Scooters' },
        { value: 'Mid-Range', label: 'Mid-Range / Budget Bike' },
        { value: 'Scooters', label: 'Scooters' },
      ];

  return (
    <div className="space-y-2.5 sm:space-y-4 animate-fadeIn pb-6">
      {/* Top Executive Header */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <span
                className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border flex items-center gap-1 ${
                  isSuperbike
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}
              >
                {isSuperbike ? <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                <span className="sm:hidden">
                  {isSuperbike ? 'Luxury & Superbikes' : 'Budget & Commuters'}
                </span>
                <span className="hidden sm:inline">
                  {isSuperbike ? 'Limited Stock • Luxury & Superbikes' : 'High-Volume • Commuters & Scooters'}
                </span>
              </span>
              <span className="hidden sm:inline text-xs text-slate-600 font-mono">
                {isSuperbike ? 'Separate Superbike Worker Access' : 'Separate Budget Bike Worker Access'}
              </span>
            </div>

            <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bike className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${isSuperbike ? 'text-red-600' : 'text-teal-600'}`} />
              <span className="truncate">
                {isSuperbike
                  ? 'Superbikes & Luxury Inventory'
                  : 'Budget Bikes Inventory Manager'}
              </span>
            </h2>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-2xl">
              {isSuperbike
                ? 'Manage limited-stock superbikes, luxury imports, cruisers, and adventure bikes synced to the Superbikes & Luxury storefront.'
                : 'Manage daily commuters, scooters, mid-range motorcycles, and budget-friendly inventory synced separately to the Budget Bikes storefront.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            <PublicVisibilityToggle
              compact
              label={isSuperbike ? 'Superbikes' : 'Budget Bikes'}
              isVisible={isSectionVisibleOnSite}
              onToggle={onToggleSectionVisibility}
            />
            <button
              type="button"
              onClick={onAddBike}
              className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">{isSuperbike ? 'Add Superbike' : 'Add Budget Bike'}</span>
              <span className="hidden sm:inline">
                {isSuperbike ? 'Add Superbike / Luxury' : 'Add Budget / Commuter Bike'}
              </span>
            </button>
          </div>
        </div>

        {/* Owner-Only Inline Call & WhatsApp Helpline Bar (Hidden from Workers) */}
        {isOwner && onSaveSectionPhone && (
          <OwnerSectionPhoneControl
            isOwner={isOwner}
            sectionLabel={isSuperbike ? 'Superbikes Call & WhatsApp' : 'Budget Bikes Call & WhatsApp'}
            phoneValue={sectionPhone}
            accentColor={isSuperbike ? 'red' : 'teal'}
            mandatory
            onSavePhone={onSaveSectionPhone}
          />
        )}
      </div>

      {/* 4 Segment KPI Cards (2x2 on Mobile, 4-Across on Tablet/Laptop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
            <span className="truncate">{isSuperbike ? 'Luxury Stock' : 'Budget Stock'}</span>
            <Bike className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSuperbike ? 'text-red-600' : 'text-teal-600'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 tabular-nums leading-tight">
            {stats.total}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 truncate">Total units in this catalog</div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
            <span className="truncate">Available</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 tabular-nums leading-tight">
            {stats.available}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 truncate">Ready on showroom floor</div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800">
            <span className="truncate">Booked / Sold</span>
            <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800 font-mono mt-1 tabular-nums leading-tight">
            {stats.booked + stats.sold}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 truncate">
            {stats.booked} booked · {stats.sold} sold
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
            <span className="truncate">Hidden</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-700 font-mono mt-1 tabular-nums leading-tight">
            {stats.hidden}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 truncate">Paused from public website</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2 sm:gap-2.5 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isSuperbike
                ? 'Search superbike, brand or city...'
                : 'Search budget bike, scooter or brand...'
            }
            className={`w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none ${
              isSuperbike ? 'focus:border-red-500' : 'focus:border-teal-500'
            }`}
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap min-w-0">
          <EditableSelect
            compact
            value={catFilter}
            onChange={(val) => setCatFilter(val || 'ALL')}
            containerClassName="flex-1 min-w-0 sm:flex-none sm:min-w-[175px]"
            manualPlaceholder="Filter category..."
            options={categoryOptions}
            className="px-2 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] sm:text-xs text-slate-900 focus:outline-none focus:border-red-500"
          />
          <EditableSelect
            compact
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || 'ALL')}
            containerClassName="flex-1 min-w-0 sm:flex-none sm:min-w-[155px]"
            manualPlaceholder="Filter status..."
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'Available', label: 'Available' },
              { value: 'Booked', label: 'Booked' },
              { value: 'Sold', label: 'Sold' },
              { value: 'Hidden', label: 'Hidden (Off Website)' },
            ]}
            className="px-2 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] sm:text-xs text-slate-900 focus:outline-none focus:border-red-500"
          />

          {/* View Mode Toggle: Showroom Grid vs Compact Table */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('showroom')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'showroom'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Showroom Card Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Compact Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* RESPONSIVE INVENTORY VIEW CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {viewMode === 'showroom' ? (
          /* 2-COLUMN MOBILE / 5-COLUMN LAPTOP SHOWROOM CARD GRID */
          <div className="p-2.5 sm:p-3.5">
            {filteredBikes.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-600 space-y-3">
                <Bike className="w-10 h-10 mx-auto text-slate-400" />
                <div>
                  {isSuperbike
                    ? 'No superbikes or luxury vehicles found matching your filters.'
                    : 'No budget bikes, commuters, or scooters found matching your filters.'}
                </div>
                <button
                  type="button"
                  onClick={onAddBike}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSuperbike ? 'Add First Superbike' : 'Add Budget / Commuter Bike'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                {filteredBikes.map((b) => {
                  const bLeads = isOwner ? getBikeLeads(b) : [];
                  const hasLeads = bLeads.length > 0;
                  const isPublic = b.status !== 'Hidden';
                  return (
                    <div
                      key={b.id}
                      className={`bg-white hover:bg-slate-50/60 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-sm group relative ${
                        b.status === 'Hidden'
                          ? 'border-slate-200 opacity-80'
                          : b.status === 'Sold'
                          ? 'border-red-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Top Image Stage */}
                        <div
                          onClick={() => onPreviewBike(b)}
                          className="relative aspect-[4/3] w-full bg-slate-100 border-b border-slate-200 overflow-hidden cursor-pointer group/img select-none"
                          title="Click to preview showroom showcase"
                        >
                          <img
                            src={normalizeLocalAssetUrl(b.image_url, FALLBACK_SHOWROOM_IMAGE)}
                            alt={b.name}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/aistudio/image_f4045ab9.png';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-transparent to-black/25 pointer-events-none" />

                          {/* Top Corner Badges */}
                          <div className="absolute top-1.5 inset-x-1.5 z-10 flex items-start justify-between gap-1 pointer-events-none">
                            <span
                              className={`text-[9px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow truncate max-w-[62%] ${
                                b.category === 'Riding Gear'
                                  ? 'bg-slate-100 text-slate-900 border border-slate-200'
                                  : isSuperbike
                                  ? 'bg-red-600/95 text-white border border-red-400/50'
                                  : 'bg-teal-600/95 text-white border border-teal-400/50'
                              }`}
                            >
                              {b.badge || b.category || (isSuperbike ? 'SUPERBIKE' : 'BUDGET')}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-white bg-black/85 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/20 shadow shrink-0 tabular-nums">
                              {b.year || '2026'}
                            </span>
                          </div>

                          {/* Status Overlay */}
                          {b.status !== 'Available' && (
                            <div className="absolute bottom-1.5 right-1.5 z-10 pointer-events-none">
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                  b.status === 'Booked'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : b.status === 'Hidden'
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {b.status}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="px-2.5 pt-2 xl:px-3 xl:pt-2.5">
                          <div className="flex items-center justify-between gap-1">
                            <div
                              className={`text-[10px] font-black uppercase tracking-wider truncate ${
                                isSuperbike ? 'text-red-600' : 'text-teal-600'
                              }`}
                            >
                              {b.brand}
                            </div>
                            <span className="text-[9px] text-slate-500 font-semibold truncate">
                              {b.category}
                            </span>
                          </div>

                          <h3
                            onClick={() => onPreviewBike(b)}
                            className={`text-xs xl:text-[13px] font-black text-slate-900 uppercase tracking-tight line-clamp-2 leading-tight min-h-[2rem] mt-0.5 cursor-pointer transition-colors ${
                              isSuperbike ? 'hover:text-red-600' : 'hover:text-teal-600'
                            }`}
                            title={`${b.name} - Click to open showcase`}
                          >
                            {b.name}
                          </h3>

                          <div className="text-[10px] sm:text-[11px] text-slate-600 font-mono mt-1 truncate tabular-nums">
                            {b.category === 'Riding Gear' ? (
                              <span>Brand New · Level 2</span>
                            ) : (
                              <span>
                                {b.km
                                  ? typeof b.km === 'number'
                                    ? b.km.toLocaleString('en-IN') + ' km'
                                    : b.km
                                  : 'New'}{' '}
                                · {b.max_power || b.hp || (isSuperbike ? '168 hp' : '125 cc')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-2.5 pb-2.5 pt-2 xl:px-3 xl:pb-3">
                        <div className="pt-2 border-t border-slate-200">
                          <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                            OFFER PRICE
                          </div>

                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <div className="text-[13px] sm:text-sm xl:text-[15px] font-black text-slate-900 font-mono tabular-nums tracking-tight truncate min-w-0">
                              {formatINR(b.price)}
                            </div>
                            <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px] sm:text-[9px] shrink-0">
                              VERIFIED
                            </span>
                          </div>
                        </div>

                        {/* Edit + View Row */}
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditBike(b)}
                            className="py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                            title="Edit Vehicle Details, Price & Photos"
                          >
                            <Pencil className="w-3 h-3 shrink-0" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onPreviewBike(b)}
                            className="py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition active:scale-95 whitespace-nowrap cursor-pointer"
                            title="Open Customer Showcase View"
                          >
                            <Eye className="w-3 h-3 text-sky-600 shrink-0" />
                            <span>View</span>
                          </button>
                        </div>

                        {/* Status + Public Toggle + Delete */}
                        <div className="mt-1.5 flex items-center gap-1">
                          <EditableSelect
                            compact
                            commitManualOnConfirm
                            value={b.status}
                            onChange={(val) => onChangeBikeStatus(b, val as BikeItem['status'])}
                            containerClassName="flex-1 min-w-0"
                            ariaLabel={`Change status for ${b.name}`}
                            manualPlaceholder="Custom status..."
                            options={[
                              { value: 'Available', label: 'Available' },
                              { value: 'Booked', label: 'Booked' },
                              { value: 'Sold', label: 'Sold' },
                              { value: 'Hidden', label: 'Hidden' },
                            ]}
                            className={`h-7 text-[10px] sm:text-[11px] rounded-lg px-1.5 border focus:outline-none font-bold truncate cursor-pointer ${
                              b.status === 'Available'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : b.status === 'Booked'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : b.status === 'Hidden'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => onToggleBikeVisibility(b)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition cursor-pointer ${
                              isPublic
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                            }`}
                            title={
                              isPublic
                                ? 'Public on Website (ON) - Click to Hide'
                                : 'Hidden from Website (OFF) - Click to Show'
                            }
                            aria-label={isPublic ? 'Hide from public website' : 'Show on public website'}
                          >
                            {isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteBike(b)}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer"
                            title="Delete Vehicle"
                            aria-label={`Delete ${b.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Owner-Only Inquiries Chip */}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => onOpenBikeLeads(b)}
                            className={`w-full mt-1.5 py-1 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-between transition border cursor-pointer ${
                              hasLeads
                                ? 'bg-red-50 border-red-200 text-slate-900 hover:bg-red-100'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                            title={`View ${bLeads.length} customer inquiries for ${b.name}`}
                          >
                            <span className="flex items-center gap-1 truncate">
                              <Users className={`w-3 h-3 shrink-0 ${hasLeads ? 'text-red-600' : 'text-slate-500'}`} />
                              <span className="truncate">Inquiries</span>
                            </span>
                            <span
                              className={`px-1.5 py-0.5 leading-none rounded font-mono text-[10px] font-black tabular-nums shrink-0 ${
                                hasLeads ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {bLeads.length}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Compact Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-600 bg-slate-50 border-b border-slate-200 font-bold uppercase text-xs">
                  <th className="py-3.5 px-4">VEHICLE / PRODUCT</th>
                  <th className="py-3.5 px-4">BRAND</th>
                  <th className="py-3.5 px-4">CATEGORY</th>
                  <th className="py-3.5 px-4">YEAR & KM</th>
                  <th className="py-3.5 px-4">PRICE</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  {isOwner && <th className="py-3.5 px-4 text-center">OWNER LEADS</th>}
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBikes.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onPreviewBike(b)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        {b.image_url ? (
                          <img
                            src={normalizeLocalAssetUrl(b.image_url, FALLBACK_SHOWROOM_IMAGE)}
                            alt={b.name}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-white group-hover:border-red-300 transition"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/aistudio/image_f4045ab9.png';
                            }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                            <Bike className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-base group-hover:text-red-600 transition">
                            {b.name}
                          </div>
                          <div className="text-xs text-slate-600 font-mono">
                            {b.max_power || b.hp || '168 hp'} · {b.engine_type || b.engine || 'Spec'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{b.brand}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-900 text-xs font-semibold border border-slate-200">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-900">
                      {b.year || '2026'} ·{' '}
                      <span className="text-slate-600">
                        {b.km
                          ? typeof b.km === 'number'
                            ? b.km.toLocaleString('en-IN') + ' km'
                            : b.km
                          : 'New'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-base">
                      {formatINR(b.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleBikeStatus(b)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                            b.status === 'Available'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : b.status === 'Booked'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              : b.status === 'Hidden'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              b.status === 'Available'
                                ? 'bg-emerald-500'
                                : b.status === 'Booked'
                                ? 'bg-amber-500'
                                : b.status === 'Hidden'
                                ? 'bg-slate-400'
                                : 'bg-red-500'
                            }`}
                          />
                          <span>{b.status === 'Available' ? 'Available' : b.status}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleBikeVisibility(b)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 border cursor-pointer ${
                            b.status !== 'Hidden'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                          }`}
                        >
                          {b.status !== 'Hidden' ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          <span>{b.status !== 'Hidden' ? 'Public ON' : 'Public OFF'}</span>
                        </button>

                        <EditableSelect
                          compact
                          commitManualOnConfirm
                          value={b.status}
                          onChange={(val) => onChangeBikeStatus(b, val as BikeItem['status'])}
                          containerClassName="w-32"
                          manualPlaceholder="Custom status..."
                          options={[
                            { value: 'Available', label: 'Available' },
                            { value: 'Booked', label: 'Booked' },
                            { value: 'Sold', label: 'Sold' },
                            { value: 'Hidden', label: 'Hidden' },
                          ]}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none"
                        />
                      </div>
                    </td>
                    {isOwner && (
                      <td className="py-3.5 px-4 text-center">
                        {(() => {
                          const bLeads = getBikeLeads(b);
                          const hasLeads = bLeads.length > 0;
                          return (
                            <button
                              type="button"
                              onClick={() => onOpenBikeLeads(b)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                                hasLeads
                                  ? 'bg-red-50 hover:bg-red-100 border-red-200 text-slate-900 shadow-sm'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <Users className={`w-3.5 h-3.5 ${hasLeads ? 'text-red-600' : 'text-slate-600'}`} />
                              <span>
                                {bLeads.length} {bLeads.length === 1 ? 'Lead' : 'Leads'}
                              </span>
                            </button>
                          );
                        })()}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onPreviewBike(b)}
                          className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition cursor-pointer"
                          title="Open Vehicle Showcase"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditBike(b)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                          title="Edit Vehicle"
                        >
                          <Pencil className="w-4 h-4 text-sky-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBike(b)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
