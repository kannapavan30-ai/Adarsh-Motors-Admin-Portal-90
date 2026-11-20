import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
  LabelList,
} from 'recharts';
import {
  Lock,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Plus,
  Wallet,
  DollarSign,
  CheckCircle,
  BarChart3,
  Calculator,
  PieChart as PieChartIcon,
  AlertTriangle,
  Search,
  Bike,
  AlertCircle,
  Edit2,
  LayoutList,
  Table as TableIcon,
  Calendar,
  Wrench,
} from 'lucide-react';
import PublicVisibilityToggle from './PublicVisibilityToggle';
import EditableSelect from './EditableSelect';
import type { BikeItem, SiteSettings } from '../App';
import { formatCompactINR } from '../utils/sectionVisibilitySync';

interface PnlTotals {
  totalPurchase: number;
  totalRepair: number;
  totalLanded: number;
  totalAsking: number;
  totalProfit: number;
  avgMarginPercent: number;
  realizedProfit: number;
  availableCount: number;
  soldCount: number;
  highMarginCount: number;
  normalMarginCount: number;
  thinMarginCount: number;
  lossCount: number;
}

interface PnlAnalyticsSectionProps {
  bikes: BikeItem[];
  filteredPnlBikes: BikeItem[];
  pnlTotals: PnlTotals;
  pnlRechartsData: any[];
  pnlPieData: Array<{ name: string; value: number; color: string }>;
  PnlCustomTooltip: React.ComponentType<any>;
  settings: SiteSettings;
  onToggleEmiCalculator: () => void;
  onOpenPrintModal: () => void;
  onExportCsv: () => void;
  onOpenNewProcurement: () => void;
  onEditProcurement: (bike: BikeItem) => void;
  onQuickMarkSold: (bike: BikeItem) => void;
  pnlChartMode: string;
  onChangeChartMode: (mode: 'bar' | 'area' | 'line') => void;
  pnlDateFilter: string;
  onChangeDateFilter: (filter: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom') => void;
  pnlSearch: string;
  onChangeSearch: (val: string) => void;
  pnlStatusFilter: string;
  onChangeStatusFilter: (status: 'all' | 'available' | 'sold') => void;
  pnlMarginBandFilter: string;
  onChangeMarginBandFilter: (band: string) => void;
  pnlCustomStart: string;
  onChangeCustomStart: (val: string) => void;
  pnlCustomEnd: string;
  onChangeCustomEnd: (val: string) => void;
}

export default function PnlAnalyticsSection({
  bikes,
  filteredPnlBikes,
  pnlTotals,
  pnlRechartsData,
  pnlPieData,
  PnlCustomTooltip,
  settings,
  onToggleEmiCalculator,
  onOpenPrintModal,
  onExportCsv,
  onOpenNewProcurement,
  onEditProcurement,
  onQuickMarkSold,
  pnlChartMode,
  onChangeChartMode,
  pnlDateFilter,
  onChangeDateFilter,
  pnlSearch,
  onChangeSearch,
  pnlStatusFilter,
  onChangeStatusFilter,
  pnlMarginBandFilter,
  onChangeMarginBandFilter,
  pnlCustomStart,
  onChangeCustomStart,
  pnlCustomEnd,
  onChangeCustomEnd,
}: PnlAnalyticsSectionProps) {
  const [ledgerLayout, setLedgerLayout] = useState<'cards' | 'table'>('cards');

  const computeBikeMetrics = (bike: BikeItem) => {
    const pCost = Number(bike.purchase_cost ?? Math.round((Number(bike.price) || 100000) * 0.81));
    const rCost = Number(bike.repair_cost ?? 30000);
    const landed = pCost + rCost;
    const asking = Number(bike.price ?? 0);
    const profit = asking - landed;
    const marginPercent = landed > 0 ? (profit / landed) * 100 : 0;
    const isLoss = profit < 0;
    const isHigh = marginPercent >= 20;
    const isNormal = marginPercent >= 10 && marginPercent < 20;
    return { pCost, rCost, landed, asking, profit, marginPercent, isLoss, isHigh, isNormal };
  };

  // Keep parent props referenced without breaking existing App.tsx signature
  void pnlRechartsData;
  void PnlCustomTooltip;

  const dailyPnlData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        dateKey: string;
        totalPurchase: number;
        totalRepair: number;
        totalLanded: number;
        totalAsking: number;
        profitAmount: number;
        lossAmount: number;
        unitsCount: number;
        profitUnitsCount: number;
        lossUnitsCount: number;
        soldCount: number;
      }
    >();

    filteredPnlBikes.forEach((bike) => {
      const raw = String(bike.procurement_date || bike.created_at || '2026-10-15').slice(0, 10);
      const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '2026-10-15';
      const { pCost, rCost, landed, asking, profit } = computeBikeMetrics(bike);

      const entry = grouped.get(dateKey) || {
        dateKey,
        totalPurchase: 0,
        totalRepair: 0,
        totalLanded: 0,
        totalAsking: 0,
        profitAmount: 0,
        lossAmount: 0,
        unitsCount: 0,
        profitUnitsCount: 0,
        lossUnitsCount: 0,
        soldCount: 0,
      };

      entry.totalPurchase += pCost;
      entry.totalRepair += rCost;
      entry.totalLanded += landed;
      entry.totalAsking += asking;
      entry.unitsCount += 1;
      if (bike.status === 'Sold') entry.soldCount += 1;

      if (profit >= 0) {
        entry.profitAmount += profit;
        entry.profitUnitsCount += 1;
      } else {
        entry.lossAmount += Math.abs(profit);
        entry.lossUnitsCount += 1;
      }

      grouped.set(dateKey, entry);
    });

    const sortedKeys = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));
    const years = new Set(sortedKeys.map((k) => k.slice(0, 4)));
    const multiYear = years.size > 1;

    return sortedKeys.map((dateKey) => {
      const g = grouped.get(dateKey)!;
      const [y, m, d] = dateKey.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      const dayLabel = isNaN(dt.getTime())
        ? dateKey
        : dt.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            ...(multiYear ? { year: '2-digit' } : {}),
          });
      const fullDateLabel = isNaN(dt.getTime())
        ? dateKey
        : dt.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });

      const netProfit = g.profitAmount - g.lossAmount;
      const profitPercent =
        g.totalLanded > 0 ? Number(((g.profitAmount / g.totalLanded) * 100).toFixed(1)) : 0;
      const lossPercent =
        g.totalLanded > 0 ? Number(((g.lossAmount / g.totalLanded) * 100).toFixed(1)) : 0;
      const netMarginPercent =
        g.totalLanded > 0 ? Number(((netProfit / g.totalLanded) * 100).toFixed(1)) : 0;
      const totalMovement = g.profitAmount + g.lossAmount;
      const profitSharePercent =
        totalMovement > 0 ? Number(((g.profitAmount / totalMovement) * 100).toFixed(1)) : 0;
      const lossSharePercent =
        totalMovement > 0 ? Number(((g.lossAmount / totalMovement) * 100).toFixed(1)) : 0;

      return {
        ...g,
        dayLabel,
        fullDateLabel,
        netProfit,
        profitPercent,
        lossPercent,
        netMarginPercent,
        profitSharePercent,
        lossSharePercent,
        profitPercentLabel: g.profitAmount > 0 ? `+${profitPercent}%` : '',
        lossPercentLabel: g.lossAmount > 0 ? `-${lossPercent}%` : '',
      };
    });
  }, [filteredPnlBikes]);

  const formatYAxisINR = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sign}₹${Math.round(abs / 1000)}k`;
    return `${sign}₹${Math.round(abs)}`;
  };

  const DailyPnlTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;

    return (
      <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-lg text-xs sm:text-sm font-sans min-w-[250px]">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="font-bold text-slate-900 text-sm sm:text-base">{d.fullDateLabel}</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-sky-700">
            {d.unitsCount} {d.unitsCount === 1 ? 'Unit' : 'Units'}
          </span>
        </div>
        <div className="text-[11px] text-slate-600 font-mono mb-2">
          {d.profitUnitsCount} Profitable • {d.lossUnitsCount} Loss • {d.soldCount} Sold
        </div>
        <div className="space-y-1.5 font-mono text-xs pt-2 border-t border-slate-200">
          <div className="flex justify-between gap-4 text-emerald-700 font-bold">
            <span>Daily Profit:</span>
            <span>
              +₹{d.profitAmount.toLocaleString('en-IN')} ({d.profitPercent}%)
            </span>
          </div>
          <div className="flex justify-between gap-4 text-red-700 font-bold">
            <span>Daily Loss:</span>
            <span>
              -₹{d.lossAmount.toLocaleString('en-IN')} ({d.lossPercent}%)
            </span>
          </div>
          <div className="flex justify-between gap-4 text-slate-700 pt-1 border-t border-slate-200">
            <span>P&amp;L Ratio:</span>
            <span className="text-slate-900">
              {d.profitSharePercent}% Profit / {d.lossSharePercent}% Loss
            </span>
          </div>
          <div className="flex justify-between gap-4 text-slate-600">
            <span>Capital Invested:</span>
            <span className="text-slate-900">₹{d.totalLanded.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-600">
            <span>Asking / Sale Value:</span>
            <span className="text-amber-800">₹{d.totalAsking.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center gap-4 pt-1.5 border-t border-slate-200 font-bold">
            <span className={d.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
              Net Daily P&amp;L:
            </span>
            <span className={d.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
              {d.netProfit >= 0 ? '+' : '-'}₹{Math.abs(d.netProfit).toLocaleString('en-IN')} (
              {d.netMarginPercent >= 0 ? '+' : ''}
              {d.netMarginPercent}%)
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn pb-6">
      {/* Top Executive Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-700" />
              <span>Owner Financials</span>
            </span>
            <span className="hidden sm:inline text-xs text-slate-600">• Confidentially Masked From Workers</span>
          </div>
          <h1 className="text-base sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2 tracking-tight truncate">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
            <span className="sm:hidden">Profit &amp; Loss (P&amp;L)</span>
            <span className="hidden sm:inline">Dealership Profit &amp; Loss (P&amp;L) &amp; Margin Analytics</span>
          </h1>
          <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-2xl">
            Real-time vehicle procurement ledger, mechanical refurbishment tracking, target net margins, and visual Recharts trend analysis.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          <PublicVisibilityToggle
            compact
            label="EMI Calc"
            isVisible={Boolean(settings.enableEmiCalculator)}
            onToggle={onToggleEmiCalculator}
          />
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600" />
            <span className="sm:hidden">Print P&amp;L</span>
            <span className="hidden sm:inline">Print Statement</span>
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewProcurement}
            className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Log Cost</span>
            <span className="hidden sm:inline">Log Procurement / Repairs</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Stat Cards (2x2 on Mobile, 4-Across on Tablet/Laptop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition group min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-600 text-[10px] sm:text-xs mb-1 sm:mb-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 truncate sm:hidden">Invested</span>
            <span className="font-semibold uppercase tracking-wider text-slate-600 truncate hidden sm:inline">Total Capital Invested</span>
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 items-center justify-center text-sky-600 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <Wallet className="w-3.5 h-3.5 text-sky-600 shrink-0 sm:hidden" />
          </div>
          <div className="text-base sm:text-xl xl:text-2xl font-black font-mono text-slate-900 tracking-tight truncate tabular-nums">
            <span className="sm:hidden">{formatCompactINR(pnlTotals.totalLanded)}</span>
            <span className="hidden sm:inline">₹{pnlTotals.totalLanded.toLocaleString('en-IN')}</span>
          </div>
          <div className="hidden sm:flex mt-2 pt-2 border-t border-slate-200 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>Purchase: <strong className="text-slate-900 font-mono">₹{pnlTotals.totalPurchase.toLocaleString('en-IN')}</strong></span>
            <span>Repairs: <strong className="text-sky-700 font-mono">₹{pnlTotals.totalRepair.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition group min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-600 text-[10px] sm:text-xs mb-1 sm:mb-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 truncate sm:hidden">Asking Value</span>
            <span className="font-semibold uppercase tracking-wider text-slate-600 truncate hidden sm:inline">Total Asking Valuation</span>
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 items-center justify-center text-amber-700 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <DollarSign className="w-3.5 h-3.5 text-amber-700 shrink-0 sm:hidden" />
          </div>
          <div className="text-base sm:text-xl xl:text-2xl font-black font-mono text-amber-800 tracking-tight truncate tabular-nums">
            <span className="sm:hidden">{formatCompactINR(pnlTotals.totalAsking)}</span>
            <span className="hidden sm:inline">₹{pnlTotals.totalAsking.toLocaleString('en-IN')}</span>
          </div>
          <div className="hidden sm:flex mt-2 pt-2 border-t border-slate-200 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>Active Stock Units</span>
            <span className="text-slate-900 font-mono font-bold">{pnlTotals.availableCount} Available / {pnlTotals.soldCount} Sold</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition group min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-600 text-[10px] sm:text-xs mb-1 sm:mb-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 truncate sm:hidden">Target Profit</span>
            <span className="font-semibold uppercase tracking-wider text-slate-600 truncate hidden sm:inline">Target Net Profit</span>
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0 sm:hidden" />
          </div>
          <div className={`text-base sm:text-xl xl:text-2xl font-black font-mono tracking-tight truncate tabular-nums ${pnlTotals.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <span className="sm:hidden">{pnlTotals.totalProfit >= 0 ? '+' : ''}{formatCompactINR(pnlTotals.totalProfit)}</span>
            <span className="hidden sm:inline">{pnlTotals.totalProfit < 0 ? '-' : '+'}₹{Math.abs(pnlTotals.totalProfit).toLocaleString('en-IN')}</span>
          </div>
          <div className="hidden sm:flex mt-2 pt-2 border-t border-slate-200 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
            <span className="text-slate-600">Avg Return / Margin</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${pnlTotals.avgMarginPercent >= 15 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : pnlTotals.avgMarginPercent > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {pnlTotals.avgMarginPercent.toFixed(1)}% ROI
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition group min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-600 text-[10px] sm:text-xs mb-1 sm:mb-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 truncate sm:hidden">Realized</span>
            <span className="font-semibold uppercase tracking-wider text-slate-600 truncate hidden sm:inline">Realized Cash Profit</span>
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 items-center justify-center text-purple-600 shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <CheckCircle className="w-3.5 h-3.5 text-purple-600 shrink-0 sm:hidden" />
          </div>
          <div className="text-base sm:text-xl xl:text-2xl font-black font-mono text-purple-700 tracking-tight truncate tabular-nums">
            <span className="sm:hidden">{formatCompactINR(pnlTotals.realizedProfit)}</span>
            <span className="hidden sm:inline">₹{pnlTotals.realizedProfit.toLocaleString('en-IN')}</span>
          </div>
          <div className="hidden sm:flex mt-2 pt-2 border-t border-slate-200 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>Sold Vehicles</span>
            <span className="text-purple-700 font-mono font-bold">{pnlTotals.soldCount} Units Dispatched</span>
          </div>
        </div>
      </div>

      {/* Data Visualization Dashboard using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        <div className="lg:col-span-2 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Daily Profit &amp; Loss Performance (% &amp; ₹)</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Per-day Profit vs Loss amounts and Profit / Loss percentage (%) across your dealership
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => onChangeChartMode('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${pnlChartMode === 'bar' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Daily P&amp;L
              </button>
              <button
                type="button"
                onClick={() => onChangeChartMode('line')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${pnlChartMode === 'line' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Profit / Loss %
              </button>
              <button
                type="button"
                onClick={() => onChangeChartMode('area')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${pnlChartMode === 'area' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Daily Trend
              </button>
            </div>
          </div>

          <div className="w-full h-56 sm:h-72">
            {dailyPnlData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-sm">
                <Calculator className="w-8 h-8 mb-2 opacity-60" />
                No daily profit &amp; loss records match current filters.
              </div>
            ) : pnlChartMode === 'area' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyPnlData} margin={{ top: 14, right: 12, left: 0, bottom: 16 }}>
                  <defs>
                    <linearGradient id="colorDailyProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDailyLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDailyNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#64748B"
                    fontSize={11}
                    interval={0}
                    angle={dailyPnlData.length > 7 ? -20 : 0}
                    textAnchor={dailyPnlData.length > 7 ? 'end' : 'middle'}
                    height={dailyPnlData.length > 7 ? 44 : 28}
                  />
                  <YAxis width={56} stroke="#64748B" fontSize={11} tickFormatter={formatYAxisINR} />
                  <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                  <RechartsTooltip content={<DailyPnlTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    formatter={(value) => <span className="text-slate-700 text-xs">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="profitAmount"
                    name="Daily Profit (₹)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDailyProfit)"
                    dot={{ r: 3.5, fill: '#10B981' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="lossAmount"
                    name="Daily Loss (₹)"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDailyLoss)"
                    dot={{ r: 3.5, fill: '#EF4444' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="netProfit"
                    name="Net P&L (₹)"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDailyNet)"
                    dot={{ r: 3, fill: '#38BDF8' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : pnlChartMode === 'line' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyPnlData} margin={{ top: 14, right: 12, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#64748B"
                    fontSize={11}
                    interval={0}
                    angle={dailyPnlData.length > 7 ? -20 : 0}
                    textAnchor={dailyPnlData.length > 7 ? 'end' : 'middle'}
                    height={dailyPnlData.length > 7 ? 44 : 28}
                  />
                  <YAxis width={48} stroke="#64748B" fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                  <RechartsTooltip content={<DailyPnlTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    formatter={(value) => <span className="text-slate-700 text-xs">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="profitPercent"
                    name="Profit %"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10B981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lossPercent"
                    name="Loss %"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#EF4444' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="netMarginPercent"
                    name="Net P&L %"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3.5, fill: '#F59E0B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyPnlData} margin={{ top: 20, right: 8, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#64748B"
                    fontSize={11}
                    interval={0}
                    angle={dailyPnlData.length > 7 ? -20 : 0}
                    textAnchor={dailyPnlData.length > 7 ? 'end' : 'middle'}
                    height={dailyPnlData.length > 7 ? 44 : 28}
                  />
                  <YAxis
                    yAxisId="inr"
                    width={54}
                    stroke="#64748B"
                    fontSize={11}
                    tickFormatter={formatYAxisINR}
                  />
                  <YAxis
                    yAxisId="pct"
                    orientation="right"
                    width={42}
                    stroke="#F59E0B"
                    fontSize={11}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <RechartsTooltip content={<DailyPnlTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    formatter={(value) => <span className="text-slate-700 text-xs">{value}</span>}
                  />
                  <Bar
                    yAxisId="inr"
                    dataKey="profitAmount"
                    name="Daily Profit (₹)"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                  >
                    <LabelList
                      dataKey="profitPercentLabel"
                      position="top"
                      fill="#047857"
                      fontSize={10}
                      fontWeight={700}
                    />
                  </Bar>
                  <Bar
                    yAxisId="inr"
                    dataKey="lossAmount"
                    name="Daily Loss (₹)"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                  >
                    <LabelList
                      dataKey="lossPercentLabel"
                      position="top"
                      fill="#b91c1c"
                      fontSize={10}
                      fontWeight={700}
                    />
                  </Bar>
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="netMarginPercent"
                    name="Net P&L %"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#F59E0B' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fleet Health & Margin Band Distribution */}
        <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 sm:space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-amber-700" />
              <span>Capital Split &amp; Margin Bands</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Outlay composition and count of high, normal, thin &amp; loss units
            </p>
          </div>

          <div className="w-full h-36 sm:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pnlPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={4}
                >
                  {pnlPieData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-700 font-semibold text-xs">
                <span>High (&gt;20%)</span>
                <span className="font-mono font-bold">{pnlTotals.highMarginCount}</span>
              </div>
              <span className="text-xs text-slate-600 block mt-0.5">Top Profit Stars</span>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200">
              <div className="flex items-center justify-between text-teal-700 font-semibold text-xs">
                <span>Normal (10-20%)</span>
                <span className="font-mono font-bold">{pnlTotals.normalMarginCount}</span>
              </div>
              <span className="text-xs text-slate-600 block mt-0.5">Healthy Velocity</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between text-amber-800 font-semibold text-xs">
                <span>Thin (&lt;10%)</span>
                <span className="font-mono font-bold">{pnlTotals.thinMarginCount}</span>
              </div>
              <span className="text-xs text-slate-600 block mt-0.5">Price Sensitive</span>
            </div>

            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center justify-between text-red-700 font-semibold text-xs">
                <span>Loss (&lt;0)</span>
                <span className="font-mono font-bold">{pnlTotals.lossCount}</span>
              </div>
              <span className="text-xs text-slate-600 block mt-0.5">Capital Deficit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Loss Prevention Alert Banner */}
      {pnlTotals.lossCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <strong className="text-red-700 font-bold uppercase tracking-wide block">
              Owner Loss Alert: {pnlTotals.lossCount} Vehicle(s) are incurring negative profit margin
            </strong>
            <p className="text-slate-700 mt-1 leading-relaxed">
              Vehicles where total investment (purchase price + mechanical refurbishment) exceeds showroom asking price will erode dealership capital. Revise asking price upwards or adjust repair cost entries.
            </p>
          </div>
        </div>
      )}

      {/* Date, Status, Margin Filters & Search Controls */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 space-y-2.5 sm:space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['all', 'today', 'week', 'month', 'quarter', 'year', 'custom'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onChangeDateFilter(filter)}
                className={`px-3 py-2 rounded-xl font-semibold capitalize whitespace-nowrap transition cursor-pointer ${
                  pnlDateFilter === filter
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {filter === 'all' ? 'All Time' : filter === 'year' ? 'Fiscal Year' : filter}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto min-w-0 sm:min-w-[240px] flex-1">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={pnlSearch}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Search model, brand or category..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-600 text-xs font-semibold uppercase">Status:</span>
            <button
              type="button"
              onClick={() => onChangeStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${pnlStatusFilter === 'all' ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({bikes.length})
            </button>
            <button
              type="button"
              onClick={() => onChangeStatusFilter('available')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${pnlStatusFilter === 'available' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-slate-600 hover:text-slate-900'}`}
            >
              In Stock
            </button>
            <button
              type="button"
              onClick={() => onChangeStatusFilter('sold')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${pnlStatusFilter === 'sold' ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Sold Units
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs font-semibold uppercase">Margin Filter:</span>
            <EditableSelect
              value={pnlMarginBandFilter}
              onChange={(val) => onChangeMarginBandFilter(val || 'all')}
              containerClassName="w-52"
              manualPlaceholder="Min ROI % or band..."
              options={[
                { value: 'all', label: 'All Margins' },
                { value: 'high', label: 'High Margin (> 20%)' },
                { value: 'normal', label: 'Normal Margin (10% - 20%)' },
                { value: 'thin', label: 'Thin Margin (0% - 10%)' },
                { value: 'loss', label: 'Loss Units (< 0%)' },
              ]}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-500"
            />
          </div>

          {pnlDateFilter === 'custom' && (
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <span className="text-slate-600 text-xs">From:</span>
              <input
                type="date"
                value={pnlCustomStart}
                onChange={(e) => onChangeCustomStart(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900"
              />
              <span className="text-slate-600 text-xs">To:</span>
              <input
                type="date"
                value={pnlCustomEnd}
                onChange={(e) => onChangeCustomEnd(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900"
              />
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Profitability Ledger (Detailed Cards + Optional Laptop Table) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Bike className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Vehicle Profitability Ledger ({filteredPnlBikes.length} Units)
              </h3>
              <span className="text-xs text-slate-600 font-mono">
                Owner Confidential • Purchase + Repairs vs Asking Price
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setLedgerLayout('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                ledgerLayout === 'cards' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Detailed Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setLedgerLayout('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                ledgerLayout === 'table' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>
        </div>

        {filteredPnlBikes.length === 0 ? (
          <div className="p-12 text-center text-slate-600 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
            No vehicles found matching current filter criteria.
          </div>
        ) : ledgerLayout === 'cards' ? (
          <div className="p-2.5 sm:p-4 space-y-2.5 sm:space-y-3.5">
            {filteredPnlBikes.map((bike) => {
              const { pCost, rCost, landed, asking, profit, marginPercent, isLoss, isHigh, isNormal } =
                computeBikeMetrics(bike);

              const accentBorder = isLoss
                ? 'border-red-200 hover:border-red-300'
                : isHigh
                ? 'border-emerald-200 hover:border-emerald-300'
                : isNormal
                ? 'border-teal-200 hover:border-teal-300'
                : 'border-amber-200 hover:border-amber-300';

              return (
                <div
                  key={bike.id}
                  className={`rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-5 shadow-sm transition ${accentBorder}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* LEFT: Vehicle Identity & Repairs Note */}
                    <div className="lg:col-span-4 space-y-2.5 lg:border-r lg:border-slate-200 lg:pr-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {bike.image_url ? (
                            <img
                              src={bike.image_url}
                              alt={bike.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                              <Bike className="w-5 h-5 text-slate-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                              {bike.name}{' '}
                              {bike.year ? (
                                <span className="text-xs text-slate-600 font-mono font-normal">({bike.year})</span>
                              ) : null}
                            </div>
                            <div className="text-xs text-slate-600 truncate">
                              {bike.brand} • {bike.category}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                            bike.status === 'Sold'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {bike.status === 'Sold' ? 'Sold' : 'In Stock'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Procured: {bike.procurement_date || '2026-02-15'}</span>
                        </span>
                      </div>

                      {bike.repairs_note && (
                        <div className="text-xs text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                          <span className="break-words">{bike.repairs_note}</span>
                        </div>
                      )}
                    </div>

                    {/* MIDDLE: 4 Financial Breakdown Metrics */}
                    <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-sans uppercase text-slate-500 font-bold">Purchase Cost</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">₹{pCost.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-sans uppercase text-slate-500 font-bold">Repairs &amp; Refurb</div>
                        <div className="text-sm font-bold text-sky-700 mt-0.5">+₹{rCost.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-sans uppercase text-slate-500 font-bold">Total Landed</div>
                        <div className="text-sm font-bold text-blue-700 mt-0.5">₹{landed.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-sans uppercase text-slate-500 font-bold">Asking Price</div>
                        <div className="text-sm font-bold text-amber-800 mt-0.5">₹{asking.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* RIGHT: Net Profit, ROI Band & Actions */}
                    <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3">
                      <div className="flex sm:block items-center justify-between gap-3 lg:text-right">
                        <div>
                          <div className="text-[11px] uppercase font-bold text-slate-500">Net Profit / Loss</div>
                          <div className={`text-lg font-black font-mono ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {profit < 0 ? '-' : '+'}₹{Math.abs(profit).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="mt-1">
                          {isLoss ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              <TrendingDown className="w-3.5 h-3.5" />
                              {marginPercent.toFixed(1)}% LOSS
                            </span>
                          ) : isHigh ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {marginPercent.toFixed(1)}% HIGH
                            </span>
                          ) : isNormal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              {marginPercent.toFixed(1)}% NORMAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {marginPercent.toFixed(1)}% THIN
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onQuickMarkSold(bike)}
                          title={bike.status === 'Sold' ? 'Revert to Available' : 'Mark as Sold (Realize Profit)'}
                          className={`min-h-[38px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            bike.status === 'Sold'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{bike.status === 'Sold' ? 'Sold' : 'Mark Sold'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditProcurement(bike)}
                          className="min-h-[38px] px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-sky-700" />
                          <span>Edit P&amp;L</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Grand Totals Footer Card */}
            <div className="mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
                <div className="font-sans font-black text-slate-900 text-sm">
                  Grand Totals ({filteredPnlBikes.length} Units)
                </div>
                <div className="text-emerald-700 font-bold mt-0.5">
                  Avg ROI: {pnlTotals.avgMarginPercent.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="font-sans text-slate-600">Total Purchase</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">₹{pnlTotals.totalPurchase.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="font-sans text-slate-600">Repairs + Landed</div>
                <div className="font-bold text-blue-700 text-sm mt-0.5">₹{pnlTotals.totalLanded.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="font-sans text-slate-600">Asking Total</div>
                <div className="font-bold text-amber-800 text-sm mt-0.5">₹{pnlTotals.totalAsking.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="font-sans text-slate-600">Projected Net Profit</div>
                <div className={`font-black text-sm mt-0.5 ${pnlTotals.totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {pnlTotals.totalProfit < 0 ? '-' : '+'}₹{Math.abs(pnlTotals.totalProfit).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* OPTIONAL LAPTOP TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Vehicle Model</th>
                  <th className="py-3.5 px-3">Procured</th>
                  <th className="py-3.5 px-3 text-right">Purchase Cost</th>
                  <th className="py-3.5 px-3 text-right">Repairs</th>
                  <th className="py-3.5 px-3 text-right">Landed Cost</th>
                  <th className="py-3.5 px-3 text-right">Asking Price</th>
                  <th className="py-3.5 px-3 text-right">Net P&amp;L</th>
                  <th className="py-3.5 px-3 text-center">ROI</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-xs sm:text-sm">
                {filteredPnlBikes.map((bike) => {
                  const { pCost, rCost, landed, asking, profit, marginPercent, isLoss, isHigh, isNormal } =
                    computeBikeMetrics(bike);

                  return (
                    <tr
                      key={bike.id}
                      className={`hover:bg-slate-50 transition ${isLoss ? 'bg-red-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          {bike.image_url ? (
                            <img
                              src={bike.image_url}
                              alt={bike.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              <Bike className="w-5 h-5 text-slate-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                              <span>{bike.name}</span>
                              {bike.year && (
                                <span className="text-xs text-slate-600 font-mono font-normal">({bike.year})</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 flex items-center gap-2">
                              <span>{bike.brand}</span>
                              <span>•</span>
                              <span>{bike.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 text-xs">{bike.procurement_date || '2026-02-15'}</td>
                      <td className="py-3.5 px-3 text-right text-slate-900">₹{pCost.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-3 text-right">
                        {rCost > 0 ? (
                          <span className="text-sky-700">+₹{rCost.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-600">₹0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right text-blue-700 font-bold">₹{landed.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-3 text-right text-amber-800 font-bold">₹{asking.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-3 text-right font-bold">
                        <span className={profit >= 0 ? 'text-emerald-700' : 'text-red-700 font-black'}>
                          {profit < 0 ? '-' : '+'}₹{Math.abs(profit).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {isLoss ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {marginPercent.toFixed(1)}% LOSS
                          </span>
                        ) : isHigh ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {marginPercent.toFixed(1)}% HIGH
                          </span>
                        ) : isNormal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {marginPercent.toFixed(1)}% NORMAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {marginPercent.toFixed(1)}% THIN
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {bike.status === 'Sold' ? (
                          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Sold
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickMarkSold(bike)}
                            title={bike.status === 'Sold' ? 'Revert to Available' : 'Mark as Sold (Realize Profit)'}
                            className={`p-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                              bike.status === 'Sold'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditProcurement(bike)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-sky-700" />
                            <span>Edit P&amp;L</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td className="py-3.5 px-4 font-sans">Grand Totals ({filteredPnlBikes.length} Vehicles)</td>
                  <td className="py-3.5 px-3"></td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-700">₹{pnlTotals.totalPurchase.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-sky-700">₹{pnlTotals.totalRepair.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-blue-700">₹{pnlTotals.totalLanded.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-amber-800">₹{pnlTotals.totalAsking.toLocaleString('en-IN')}</td>
                  <td className={`py-3.5 px-3 text-right font-mono ${pnlTotals.totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {pnlTotals.totalProfit < 0 ? '-' : '+'}₹{Math.abs(pnlTotals.totalProfit).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-emerald-700">{pnlTotals.avgMarginPercent.toFixed(1)}% ROI</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
