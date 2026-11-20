import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Phone,
  Clock,
  Navigation,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  Building2,
  Compass,
  Copy,
} from 'lucide-react';
import PublicVisibilityToggle from './PublicVisibilityToggle';
import OwnerSectionPhoneControl from './OwnerSectionPhoneControl';
import { parseGoogleMapsLocation } from '../utils/googleMapsLocation';

export interface BranchRecord {
  id: number | string;
  city: string;
  branch_name: string;
  address: string;
  timings?: string;
  phone: string;
  maps_url: string;
  status: string;
}

interface BranchManagerSectionProps {
  branches: BranchRecord[];
  isLocationsVisible: boolean;
  onToggleLocationsVisibility: () => void;
  onOpenBranchModal: (branch: BranchRecord | null) => void;
  onRemoveBranch: (branch: BranchRecord) => void;
  onCopyPhone: (phone: string, branchName: string) => void;
  isOwner?: boolean;
  sectionPhone?: string;
  onSaveSectionPhone?: (nextPhone: string) => Promise<boolean> | boolean;
}

export default function BranchManagerSection({
  branches,
  isLocationsVisible,
  onToggleLocationsVisibility,
  onOpenBranchModal,
  onRemoveBranch,
  onCopyPhone,
  isOwner = false,
  sectionPhone = '',
  onSaveSectionPhone,
}: BranchManagerSectionProps) {
  const [branchSearch, setBranchSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Other'>('ALL');

  const stats = useMemo(() => {
    const activeCount = branches.filter((b) => String(b.status || '').toLowerCase() === 'active').length;
    const mappedCount = branches.filter((b) => {
      const parsed = parseGoogleMapsLocation(b.maps_url, [b.branch_name, b.address, b.city].filter(Boolean).join(', '));
      return Boolean(parsed.embedUrl);
    }).length;
    const citiesCount = new Set(branches.map((b) => String(b.city || '').trim()).filter(Boolean)).size;
    return {
      total: branches.length,
      activeCount,
      mappedCount,
      citiesCount,
    };
  }, [branches]);

  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    return branches.filter((br) => {
      const isActive = String(br.status || '').toLowerCase() === 'active';
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Other' && isActive) return false;
      if (!q) return true;
      return (
        String(br.branch_name || '').toLowerCase().includes(q) ||
        String(br.city || '').toLowerCase().includes(q) ||
        String(br.address || '').toLowerCase().includes(q) ||
        String(br.phone || '').toLowerCase().includes(q)
      );
    });
  }, [branches, branchSearch, statusFilter]);

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn pb-6">
      {/* Top Executive Studio Header */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Dealership Network</span>
              </span>
              <span className="hidden sm:inline text-xs text-slate-600 font-mono">table: branches • Live Website Sync</span>
            </div>
            <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              Pan-India Showrooms &amp; Studios
            </h2>
            <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-2xl">
              Manage physical dealership locations, showroom timings, and verified Google Maps pins synced live to your customer storefront.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            <PublicVisibilityToggle
              compact
              label="Locations"
              isVisible={isLocationsVisible}
              onToggle={onToggleLocationsVisibility}
            />
            <button
              type="button"
              onClick={() => onOpenBranchModal(null)}
              className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Add Branch</span>
              <span className="hidden sm:inline">Add Showroom Branch</span>
            </button>
          </div>
        </div>

        {/* Owner-Only Inline Call & WhatsApp Helpline Bar (Hidden from Workers) */}
        {isOwner && onSaveSectionPhone && (
          <OwnerSectionPhoneControl
            isOwner={isOwner}
            sectionLabel="Branches Inquiry Call & WhatsApp"
            phoneValue={sectionPhone}
            accentColor="rose"
            onSavePhone={onSaveSectionPhone}
          />
        )}
      </div>

      {/* 3 KPI Summary Cards (Sleek 3-Across Row on Mobile) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
        <div className="p-2.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-slate-600">
            <span className="truncate sm:hidden">Branches</span>
            <span className="truncate hidden sm:inline">Total Showrooms</span>
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">{stats.total}</div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Across {stats.citiesCount || 1} cit{stats.citiesCount === 1 ? 'y' : 'ies'}</div>
        </div>

        <div className="p-2.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-emerald-700">
            <span className="truncate sm:hidden">Active</span>
            <span className="truncate hidden sm:inline">Active Studios</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">{stats.activeCount}</div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Open for customer walk-ins</div>
        </div>

        <div className="p-2.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-sky-700">
            <span className="truncate sm:hidden">Map Pins</span>
            <span className="truncate hidden sm:inline">Google Map Pins</span>
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-sky-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">{stats.mappedCount}/{stats.total}</div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Interactive store directions live</div>
        </div>
      </div>

      {/* Search & Status Filter Strip */}
      {branches.length > 0 && (
        <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL' as const, label: `All (${branches.length})` },
              { id: 'Active' as const, label: `Active (${stats.activeCount})` },
              { id: 'Other' as const, label: `Other (${branches.length - stats.activeCount})` },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                  statusFilter === pill.id
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
              placeholder="Search city, branch, address..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      )}

      {/* Branches Grid or Empty State */}
      {branches.length === 0 ? (
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
          <MapPin className="w-10 h-10 text-red-600 mx-auto" />
          <p className="text-base font-bold text-slate-900">No showroom locations added yet</p>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Add your showroom branch and select its Google Maps store pin so customers can get instant directions on your website.
          </p>
          <button
            type="button"
            onClick={() => onOpenBranchModal(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Showroom</span>
          </button>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
          <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-base font-bold text-slate-900">No branches match your search</div>
          <p className="text-sm text-slate-600">Try clearing the filter or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
          {filteredBranches.map((br) => {
            const isActive = String(br.status || '').toLowerCase() === 'active';
            const parsedLoc = parseGoogleMapsLocation(
              br.maps_url,
              [br.branch_name, br.address, br.city].filter(Boolean).join(', ')
            );
            return (
              <div
                key={br.id}
                className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3 sm:gap-4 transition hover:border-slate-300"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                      {br.city}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span>{br.status}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">{br.branch_name}</h3>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                    <p className="text-xs sm:text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                      <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{br.address || 'Address pending'}</span>
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                      <a
                        href={`tel:${br.phone}`}
                        className="text-xs sm:text-sm text-slate-900 hover:text-red-600 font-mono font-bold flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{br.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onCopyPhone(br.phone, br.branch_name)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
                        title="Copy showroom phone"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {br.timings && (
                      <p className="text-xs text-slate-600 pt-1 border-t border-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{br.timings}</span>
                      </p>
                    )}
                  </div>

                  {parsedLoc.embedUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <iframe
                        title={`${br.branch_name} Map`}
                        src={parsedLoc.embedUrl}
                        loading="lazy"
                        className="w-full h-36 border-0"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                      {parsedLoc.lat !== null && parsedLoc.lng !== null && (
                        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] font-mono text-emerald-700 flex items-center justify-between">
                          <span>Pin: {parsedLoc.lat.toFixed(5)}, {parsedLoc.lng.toFixed(5)}</span>
                          <span className="font-sans font-bold">Live on Website</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={parsedLoc.normalizedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition"
                  >
                    <Navigation className="w-3.5 h-3.5 text-sky-600" />
                    <span>Open Maps</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenBranchModal(br)}
                      className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-700" />
                      <span>Edit Location</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveBranch(br)}
                      className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition flex items-center justify-center cursor-pointer"
                      title={`Remove ${br.branch_name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
