import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, X, Smartphone, Monitor, ExternalLink, Copy, Check,
  Share2, Bike, Package, PhoneCall, Wrench, ArrowRightLeft,
  RefreshCw, MapPin, Calculator, Car, AlertTriangle, CheckCircle2,
  Send, Search, ShieldCheck, Calendar, Users, Navigation, MessageCircle,
  KeyRound, Lock, LogOut, ZoomIn, Layers, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SiteSettings, BikeItem } from '../App';
import { resolveAccessoryShowcaseFields, type SuperbikeAccessoryItem } from './SuperbikeAccessoriesManager';
import EditableSelect from './EditableSelect';
import {
  hydrateSettingsFromRows,
  normalizeLocalAssetUrl,
  FALLBACK_SHOWROOM_IMAGE,
  buildWhatsAppUrl,
  formatTelHref,
  isAccessoryItem,
  isBudgetVehicleCategory,
  matchesBikeCategoryFilter,
  resolveEnquiryContact,
  EnquirySegment,
  broadcastLiveSync,
} from '../utils/sectionVisibilitySync';
import { parseGoogleMapsLocation } from '../utils/googleMapsLocation';
import { fetchAllBikesSafe } from '../utils/fetchBikesSafe';
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  normalizePhone10,
} from '../utils/otpService';

interface BranchRow {
  id: string | number;
  city: string;
  branch_name: string;
  address: string;
  timings?: string;
  phone: string;
  maps_url?: string;
  maps_query?: string;
  status?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customerSiteUrl: string;
  showToast: (msg: string) => void;
  supabase?: SupabaseClient;
  adminSettings?: SiteSettings;
  adminBikes?: BikeItem[];
  adminBranches?: BranchRow[];
  standalonePage?: boolean;
  onBackToAdmin?: () => void;
}

export default function CustomerLiveWebsitePreviewModal({
  isOpen,
  onClose,
  customerSiteUrl,
  showToast,
  supabase,
  adminSettings,
  adminBikes = [],
  adminBranches = [],
  standalonePage = false,
  onBackToAdmin,
}: Props) {
  const [previewTab, setPreviewTab] = useState<'connected' | 'external'>('connected');
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('desktop');
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Live Supabase storefront state
  const [isLoadingStore, setIsLoadingStore] = useState(false);
  const [liveBikes, setLiveBikes] = useState<any[]>([]);
  const [liveAccessories, setLiveAccessories] = useState<SuperbikeAccessoryItem[]>([]);
  const [liveBranches, setLiveBranches] = useState<BranchRow[]>([]);
  const [liveSettings, setLiveSettings] = useState<SiteSettings | undefined>(adminSettings);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [dbError, setDbError] = useState<string | null>(null);

  // Storefront interactive tools
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedSuperbikeCategory, setSelectedSuperbikeCategory] = useState('ALL');
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState('ALL');
  const [emiPrice, setEmiPrice] = useState(920000);
  const [emiDown, setEmiDown] = useState(200000);
  const [emiMonths, setEmiMonths] = useState(36);
  const [selectedStoreAccessory, setSelectedStoreAccessory] = useState<SuperbikeAccessoryItem | null>(null);
  const [storeAccPhotoIdx, setStoreAccPhotoIdx] = useState(0);
  const [storeAccZoomOpen, setStoreAccZoomOpen] = useState(false);

  // Customer Website OTP Session (Navbar Login + Hub + Lead Verification)
  const [verifiedCustomerPhone, setVerifiedCustomerPhone] = useState<string>(() => {
    try {
      return sessionStorage.getItem('adarsh_customer_verified_phone') || '';
    } catch {
      return '';
    }
  });
  const [showCustomerOtpModal, setShowCustomerOtpModal] = useState(false);
  const [custAuthPhone, setCustAuthPhone] = useState('');
  const [custAuthStep, setCustAuthStep] = useState<'phone' | 'otp'>('phone');
  const [custAuthOtp, setCustAuthOtp] = useState('');
  const [custAuthNotice, setCustAuthNotice] = useState('');
  const [custAuthDemoCode, setCustAuthDemoCode] = useState('');
  const [custAuthCooldown, setCustAuthCooldown] = useState(0);
  const [isSendingCustOtp, setIsSendingCustOtp] = useState(false);
  const [isVerifyingCustOtp, setIsVerifyingCustOtp] = useState(false);

  // Customer Inquiry / Test Ride / Sell / Workshop Lead Submission (with Phone + OTP Gate)
  const [leadModalType, setLeadModalType] = useState<
    null | { type: string; bikeName?: string; segment?: EnquirySegment }
  >(null);
  const [leadSegment, setLeadSegment] = useState<EnquirySegment>('superbike');
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadBranch, setLeadBranch] = useState('Hyderabad – Jubilee Hills');
  const [leadMessage, setLeadMessage] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadOtpStep, setLeadOtpStep] = useState<'phone' | 'otp'>('phone');
  const [leadOtpCode, setLeadOtpCode] = useState('');
  const [leadOtpNotice, setLeadOtpNotice] = useState('');
  const [leadOtpDemoCode, setLeadOtpDemoCode] = useState('');
  const [leadOtpCooldown, setLeadOtpCooldown] = useState(0);
  const [isSendingLeadOtp, setIsSendingLeadOtp] = useState(false);
  const [waRouterOpen, setWaRouterOpen] = useState(false);

  // Customer Ownership Lookup (Protected by Phone + OTP Verification)
  const [hubPhone, setHubPhone] = useState('');
  const [hubOtpStep, setHubOtpStep] = useState<'phone' | 'otp'>('phone');
  const [hubOtpCode, setHubOtpCode] = useState('');
  const [hubOtpNotice, setHubOtpNotice] = useState('');
  const [hubOtpDemoCode, setHubOtpDemoCode] = useState('');
  const [hubOtpCooldown, setHubOtpCooldown] = useState(0);
  const [isSendingHubOtp, setIsSendingHubOtp] = useState(false);
  const [hubError, setHubError] = useState('');
  const [hubSearching, setHubSearching] = useState(false);
  const [hubResult, setHubResult] = useState<{ invoices: any[]; customer: any | null } | null>(null);

  useEffect(() => {
    try {
      if (verifiedCustomerPhone) {
        sessionStorage.setItem('adarsh_customer_verified_phone', verifiedCustomerPhone);
      } else {
        sessionStorage.removeItem('adarsh_customer_verified_phone');
      }
    } catch {}
  }, [verifiedCustomerPhone]);

  useEffect(() => {
    if (custAuthCooldown <= 0) return;
    const t = window.setTimeout(() => setCustAuthCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [custAuthCooldown]);

  useEffect(() => {
    if (leadOtpCooldown <= 0) return;
    const t = window.setTimeout(() => setLeadOtpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [leadOtpCooldown]);

  useEffect(() => {
    if (hubOtpCooldown <= 0) return;
    const t = window.setTimeout(() => setHubOtpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [hubOtpCooldown]);

  const liveUrl = customerSiteUrl || 'https://adarsh-motors-site.netlify.app/';

  const adminBikesRef = useRef(adminBikes);
  const adminBranchesRef = useRef(adminBranches);
  const adminSettingsRef = useRef(adminSettings);
  useEffect(() => { adminBikesRef.current = adminBikes; }, [adminBikes]);
  useEffect(() => { adminBranchesRef.current = adminBranches; }, [adminBranches]);
  useEffect(() => { adminSettingsRef.current = adminSettings; }, [adminSettings]);

  const fetchLiveStorefrontData = useCallback(async () => {
    setIsLoadingStore(true);
    setDbError(null);

    if (!supabase) {
      setLiveBikes(adminBikesRef.current);
      setLiveBranches(adminBranchesRef.current);
      setLiveSettings(adminSettingsRef.current);
      setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
      setIsLoadingStore(false);
      return;
    }

    try {
      const [bikesRes, accRes, branchesRes, settingsRes] = await Promise.all([
        fetchAllBikesSafe(supabase, {
          excludeAccessories: true,
          includeGalleries: false,
          onProgress: (rows) => {
            if (standalonePage || adminBikesRef.current.length === 0) {
              setLiveBikes(rows);
            }
          },
        }),
        supabase.from('accessories').select('*').order('created_at', { ascending: false }),
        supabase.from('branches').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*'),
      ]);

      const errMsg =
        bikesRes.error?.message ||
        accRes.error?.message ||
        branchesRes.error?.message ||
        settingsRes.error?.message;
      if (errMsg) setDbError(errMsg);

      if (!bikesRes.error && Array.isArray(bikesRes.data) && (standalonePage || adminBikesRef.current.length === 0)) {
        // Merge any newly saved local bikes that haven't replicated yet so added demo bikes show immediately
        let merged = bikesRes.data;
        try {
          const savedLocal = localStorage.getItem('adarsh_bikes');
          if (savedLocal) {
            const parsedLocal = JSON.parse(savedLocal);
            if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
              const dbIds = new Set(merged.map((b: any) => String(b.id)));
              const localOnly = parsedLocal.filter((b: any) => b && !isAccessoryItem(b) && !dbIds.has(String(b.id)));
              if (localOnly.length > 0) {
                merged = [...localOnly, ...merged];
              }
            }
          }
        } catch {}
        setLiveBikes(merged.filter((b: any) => b && !isAccessoryItem(b)));
      } else if (adminBikesRef.current.length > 0) {
        setLiveBikes(adminBikesRef.current.filter((b: any) => b && !isAccessoryItem(b)));
      }

      if (!accRes.error && Array.isArray(accRes.data) && accRes.data.length > 0) {
        let metaMap: Record<string, Partial<SuperbikeAccessoryItem>> = {};
        try {
          const rawMeta = localStorage.getItem('adarsh_accessories_stock_meta');
          if (rawMeta) metaMap = JSON.parse(rawMeta) || {};
        } catch {}
        const mergedAcc = accRes.data.map((row: any) => {
          const meta = metaMap[String(row.id)] || {};
          const stockNum = Number(row.stock_count) || 0;
          const soldNum = row.sold_count !== undefined && row.sold_count !== null
            ? Number(row.sold_count) || 0
            : Number(meta.sold_count) || 0;
          return {
            ...row,
            stock_count: stockNum,
            sold_count: soldNum,
            initial_stock: row.initial_stock ?? meta.initial_stock ?? stockNum + soldNum,
            gst_badge: row.gst_badge || meta.gst_badge,
            fitment_note: row.fitment_note || meta.fitment_note,
            material_spec: row.material_spec || meta.material_spec,
            material_detail: row.material_detail || meta.material_detail,
            workshop_title: row.workshop_title || meta.workshop_title,
            workshop_detail: row.workshop_detail || meta.workshop_detail,
            delivery_title: row.delivery_title || meta.delivery_title,
            delivery_detail: row.delivery_detail || meta.delivery_detail,
            authenticity_note: row.authenticity_note || meta.authenticity_note,
          };
        });
        setLiveAccessories(mergedAcc as SuperbikeAccessoryItem[]);
      } else {
        try {
          const savedAcc = localStorage.getItem('adarsh_accessories');
          if (savedAcc) setLiveAccessories(JSON.parse(savedAcc));
        } catch {}
      }

      if (!branchesRes.error && Array.isArray(branchesRes.data) && (standalonePage || adminBranchesRef.current.length === 0)) {
        setLiveBranches(
          branchesRes.data.map((b: any) => ({
            id: b.id,
            city: b.city || 'Hyderabad',
            branch_name: b.branch_name || b.name || 'Adarsh Motors Showroom',
            address: b.address || '',
            timings: b.timings || '',
            phone: b.phone || '+91 9014540489',
            maps_url: b.maps_url || b.maps_query || '',
            maps_query: b.maps_query || b.maps_url || '',
            status: b.status || 'Active',
          }))
        );
      } else if (adminBranchesRef.current.length > 0) {
        setLiveBranches(adminBranchesRef.current);
      }

      const fallbackSettings = adminSettingsRef.current;
      // In Admin Preview modal, keep the live edited adminSettings authoritative so typed/changed numbers show immediately;
      // In standalone customer storefront mode (#showroom), hydrate fresh from Supabase site_settings.
      if (standalonePage && !settingsRes.error && Array.isArray(settingsRes.data) && settingsRes.data.length > 0 && fallbackSettings) {
        setLiveSettings(hydrateSettingsFromRows(settingsRes.data, fallbackSettings));
      } else if (fallbackSettings) {
        setLiveSettings(fallbackSettings);
      }

      setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
    } catch (e: any) {
      setDbError(e?.message || 'Could not reach Supabase');
      setLiveBikes(adminBikesRef.current);
      setLiveBranches(adminBranchesRef.current);
      setLiveSettings(adminSettingsRef.current);
    } finally {
      setIsLoadingStore(false);
    }
  }, [supabase, standalonePage]);

  useEffect(() => {
    if (!isOpen && !standalonePage) return;
    fetchLiveStorefrontData();
  }, [isOpen, standalonePage, fetchLiveStorefrontData]);

  // Real-time auto-update listeners (BroadcastChannel, localStorage cross-tab, custom events, Supabase Realtime, and focus/poll)
  useEffect(() => {
    if (!isOpen && !standalonePage) return;

    const handleCustomSync = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      if (detail?.type === 'settings' && detail?.payload) {
        setLiveSettings(detail.payload);
        setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
      } else if (detail?.type === 'branches' && Array.isArray(detail?.payload)) {
        setLiveBranches(detail.payload);
        setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
      } else if (detail?.type === 'bikes' && Array.isArray(detail?.payload)) {
        setLiveBikes(detail.payload.filter((b: any) => b && !isAccessoryItem(b)));
        setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
      } else if (detail?.type === 'accessories' && Array.isArray(detail?.payload)) {
        setLiveAccessories(detail.payload);
        setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
      }
    };

    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'adarsh_settings' && e.newValue) {
          setLiveSettings(JSON.parse(e.newValue));
          setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
        } else if (e.key === 'adarsh_branches' && e.newValue) {
          setLiveBranches(JSON.parse(e.newValue));
          setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
        } else if (e.key === 'adarsh_bikes' && e.newValue) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setLiveBikes(parsed.filter((b: any) => b && !isAccessoryItem(b)));
          }
          setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
        } else if (e.key === 'adarsh_accessories' && e.newValue) {
          setLiveAccessories(JSON.parse(e.newValue));
          setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
        }
      } catch {}
    };

    window.addEventListener('adarsh:live-sync', handleCustomSync);
    window.addEventListener('storage', handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('adarsh_live_sync');
        bc.onmessage = (msg) => {
          const d = msg?.data;
          if (!d) return;
          if (d.type === 'settings' && d.payload) {
            setLiveSettings(d.payload);
            setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
          } else if (d.type === 'branches' && Array.isArray(d.payload)) {
            setLiveBranches(d.payload);
            setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
          } else if (d.type === 'bikes' && Array.isArray(d.payload)) {
            setLiveBikes(d.payload.filter((b: any) => b && !isAccessoryItem(b)));
            setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
          } else if (d.type === 'accessories' && Array.isArray(d.payload)) {
            setLiveAccessories(d.payload);
            setLastSyncedAt(new Date().toLocaleTimeString('en-IN'));
          }
        };
      }
    } catch {}

    let rtChannel: any = null;
    if (supabase) {
      try {
        rtChannel = supabase
          .channel(`customer_storefront_sync_${standalonePage ? 'standalone' : 'modal'}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
            fetchLiveStorefrontData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, () => {
            fetchLiveStorefrontData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bikes' }, () => {
            fetchLiveStorefrontData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'accessories' }, () => {
            fetchLiveStorefrontData();
          })
          .subscribe();
      } catch {}
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveStorefrontData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const pollId = standalonePage
      ? window.setInterval(() => {
          fetchLiveStorefrontData();
        }, 12000)
      : undefined;

    return () => {
      window.removeEventListener('adarsh:live-sync', handleCustomSync);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (pollId) window.clearInterval(pollId);
      if (bc) {
        try { bc.close(); } catch {}
      }
      if (rtChannel && supabase) {
        try { supabase.removeChannel(rtChannel); } catch {}
      }
    };
  }, [isOpen, standalonePage, supabase, fetchLiveStorefrontData]);

  // Keep synced instantaneously if admin updates bikes, branches, or settings
  useEffect(() => {
    if (adminSettings) setLiveSettings(adminSettings);
  }, [adminSettings]);

  useEffect(() => {
    if (!standalonePage && Array.isArray(adminBikes)) {
      setLiveBikes(adminBikes.filter((b: any) => b && !isAccessoryItem(b)));
    } else if (standalonePage && Array.isArray(adminBikes) && adminBikes.length > 0) {
      setLiveBikes(adminBikes.filter((b: any) => b && !isAccessoryItem(b)));
    }
  }, [adminBikes, standalonePage]);

  useEffect(() => {
    if (!standalonePage && Array.isArray(adminBranches)) {
      setLiveBranches(adminBranches);
    } else if (standalonePage && Array.isArray(adminBranches) && adminBranches.length > 0) {
      setLiveBranches(adminBranches);
    }
  }, [adminBranches, standalonePage]);

  if (!isOpen && !standalonePage) return null;

  const settings = (!standalonePage && adminSettings) ? adminSettings : (liveSettings || adminSettings);

  const visibleBikes = liveBikes.filter(
    (b) =>
      String(b?.status || 'Available') !== 'Hidden' &&
      !isAccessoryItem(b)
  );

  const parseNumericPrice = (val: any): number => {
    if (typeof val === 'number') return val;
    const cleaned = String(val || '').replace(/[^\d.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const isBudgetBikeItem = (b: any): boolean =>
    isBudgetVehicleCategory(b?.category, b?.price_raw || b?.price, b?.name);

  const superbikeFleet = visibleBikes.filter((b) => !isBudgetBikeItem(b));
  const budgetBikeFleet = visibleBikes.filter((b) => isBudgetBikeItem(b));

  const filteredSuperbikes =
    selectedSuperbikeCategory === 'ALL'
      ? superbikeFleet
      : superbikeFleet.filter((b) =>
          matchesBikeCategoryFilter(b?.category, selectedSuperbikeCategory)
        );

  const filteredBudgetBikes =
    selectedBudgetCategory === 'ALL'
      ? budgetBikeFleet
      : budgetBikeFleet.filter((b) =>
          matchesBikeCategoryFilter(b?.category, selectedBudgetCategory)
        );

  const visibleAccessories = liveAccessories.filter(
    (a) => a?.is_visible_on_portal !== false
  );
  const activeBranches = liveBranches.filter(
    (br) => String(br?.status || 'Active') !== 'Inactive'
  );

  const activeHeroSlides = (settings?.heroSlides || []).filter((s) => s.isActive !== false);
  const safeSlideIdx = activeHeroSlides.length > 0 ? activeSlideIdx % activeHeroSlides.length : 0;
  const currentHeroSlide = activeHeroSlides[safeSlideIdx];

  const handleStorefrontTarget = (rawTarget?: string) => {
    const target = String(rawTarget || '').trim();
    if (!target) {
      openLeadModal({ type: 'Showroom Callback', segment: 'general' });
      return;
    }
    const hashIdx = target.indexOf('#');
    const anchor = hashIdx >= 0 ? target.slice(hashIdx).toLowerCase() : '';
    if (anchor === '#sell-modal') {
      openLeadModal({ type: 'Sell / Exchange Valuation', segment: 'trade_in' });
      return;
    }
    if (anchor === '#inventory' || anchor === '#superbikes') {
      document.getElementById('superbikes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (anchor === '#legacy' || anchor === '#about') {
      document.getElementById('legacy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (anchor) {
      const el = document.getElementById(anchor.replace(/^#/, ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    if (/^https?:\/\//i.test(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    openLeadModal({ type: 'Showroom Callback', segment: 'general' });
  };

  const superbikesPhone = settings?.superbikesPhone || settings?.salesPhone || '+91 9014540489';
  const budgetBikesPhone = settings?.budgetBikesPhone || settings?.salesPhone || '+91 9014540489';
  const accessoriesPhone = settings?.accessoriesPhone || settings?.salesPhone || '+91 9014540489';
  const servicePhone = settings?.servicePhone || '+91 9848012345';
  const tradeInPhone = settings?.tradeInPhone || settings?.salesPhone || '+91 9014540489';
  const testRidePhone = settings?.testRidePhone || settings?.salesPhone || '+91 9014540489';
  const financePhone = settings?.financePhone || settings?.salesPhone || '+91 9014540489';
  const billingPhone = settings?.billingPhone || '+91 9849112233';
  const branchesPhone = settings?.branchesPhone || settings?.salesPhone || '+91 9014540489';
  const communityPhone = settings?.communityPhone || settings?.salesPhone || '+91 9014540489';
  const rsaPhone = settings?.rsaPhone || '1800-425-9999';
  const ownerPhone = settings?.ownerPhone || settings?.salesPhone || '+91 9014540489';

  const openLeadModal = (payload: { type: string; bikeName?: string; segment: EnquirySegment }) => {
    setLeadSegment(payload.segment);
    if (verifiedCustomerPhone && !leadPhone) {
      setLeadPhone(verifiedCustomerPhone);
    }
    setLeadOtpStep('phone');
    setLeadOtpCode('');
    setLeadOtpNotice('');
    setLeadOtpDemoCode('');
    setLeadModalType(payload);
  };

  // Auto-divert enquiry when general/bike text mentions budget vs luxury/superbike
  const activeRoutedContact = resolveEnquiryContact(
    settings,
    leadSegment,
    [leadModalType?.bikeName, leadMessage].filter(Boolean).join(' ')
  );

  const buildDivertedLeadWaUrl = () => {
    const bikeContext = leadModalType?.bikeName ? ` for ${leadModalType.bikeName}` : '';
    const msgLines = [
      `Hello Adarsh Motors (${activeRoutedContact.deskLabel}),`,
      `I am enquiring regarding ${leadModalType?.type || 'Bike Inquiry'}${bikeContext}.`,
      leadName.trim() ? `Name: ${leadName.trim()}` : '',
      leadPhone.trim() ? `Phone: ${leadPhone.trim()}` : '',
      leadBranch ? `Branch: ${leadBranch}` : '',
      leadMessage.trim() ? `Details: ${leadMessage.trim()}` : '',
    ].filter(Boolean);
    return buildWhatsAppUrl(activeRoutedContact.phone, msgLines.join('\n'));
  };

  const formatPrice = (val: any) => {
    if (typeof val === 'number') return '₹' + Math.round(val).toLocaleString('en-IN');
    if (typeof val === 'string') {
      if (val.trim().startsWith('₹')) return val.trim();
      const num = parseFloat(val.replace(/[^\d.]/g, ''));
      if (!isNaN(num)) return '₹' + Math.round(num).toLocaleString('en-IN');
    }
    return '₹0';
  };

  // EMI Monthly Payment
  const principal = Math.max(0, emiPrice - emiDown);
  const monthlyRate = (settings?.defaultEmiInterestRate || 8.5) / 12 / 100;
  const emiMonthly =
    principal > 0 && emiMonths > 0
      ? Math.round(
          (principal * monthlyRate * Math.pow(1 + monthlyRate, emiMonths)) /
            (Math.pow(1 + monthlyRate, emiMonths) - 1)
        )
      : 0;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    showToast('Storefront URL copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Explore Adarsh Motors Certified Superbikes & Storefront: ${liveUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Customer Website Navbar OTP Auth Handlers
  const handleSendCustomerSiteOtp = async (overridePhone?: string) => {
    const digits = normalizePhone10(overridePhone ?? custAuthPhone);
    if (digits.length !== 10) {
      showToast('Enter a valid 10-digit mobile number.');
      return;
    }
    setCustAuthPhone(digits);
    setIsSendingCustOtp(true);
    try {
      const res = await sendPhoneOtp({ phone: digits, context: 'customer', supabase });
      if (!res.ok) {
        showToast(res.error || 'Unable to send OTP.');
        return;
      }
      setCustAuthStep('otp');
      setCustAuthOtp('');
      setCustAuthNotice(res.message);
      setCustAuthDemoCode(res.demoCode || '');
      setCustAuthCooldown(30);
      showToast(`OTP sent to +91 ${digits}`);
    } finally {
      setIsSendingCustOtp(false);
    }
  };

  const handleVerifyCustomerSiteOtp = async () => {
    const digits = normalizePhone10(custAuthPhone);
    if (digits.length !== 10 || custAuthOtp.trim().length < 4) {
      showToast('Enter the 6-digit OTP sent to your mobile.');
      return;
    }
    setIsVerifyingCustOtp(true);
    try {
      const check = await verifyPhoneOtp({
        phone: digits,
        otp: custAuthOtp,
        context: 'customer',
        supabase,
      });
      if (!check.ok) {
        showToast(check.message || 'OTP verification failed.');
        return;
      }
      setVerifiedCustomerPhone(digits);
      setHubPhone(digits);
      setLeadPhone(digits);
      setShowCustomerOtpModal(false);
      setCustAuthStep('phone');
      setCustAuthOtp('');
      setCustAuthNotice('');
      setCustAuthDemoCode('');
      showToast(`Mobile +91 ${digits} verified via OTP!`);
    } finally {
      setIsVerifyingCustOtp(false);
    }
  };

  const handleLogoutCustomerSiteOtp = () => {
    setVerifiedCustomerPhone('');
    setHubResult(null);
    setHubOtpStep('phone');
    setHubOtpCode('');
    setHubOtpNotice('');
    setHubOtpDemoCode('');
    showToast('Signed out of Customer OTP session.');
  };

  const isLeadPhoneOtpVerified =
    Boolean(verifiedCustomerPhone) &&
    normalizePhone10(leadPhone) === normalizePhone10(verifiedCustomerPhone);

  const handleSendLeadOtp = async () => {
    const digits = normalizePhone10(leadPhone);
    if (digits.length !== 10) {
      showToast('Enter a valid 10-digit mobile number first.');
      return;
    }
    setLeadPhone(digits);
    setIsSendingLeadOtp(true);
    try {
      const res = await sendPhoneOtp({
        phone: digits,
        context: 'customer',
        supabase,
        recipientName: leadName.trim() || undefined,
      });
      if (!res.ok) {
        showToast(res.error || 'Unable to send OTP.');
        return;
      }
      setLeadOtpStep('otp');
      setLeadOtpCode('');
      setLeadOtpNotice(res.message);
      setLeadOtpDemoCode(res.demoCode || '');
      setLeadOtpCooldown(30);
      showToast(`OTP sent to +91 ${digits}`);
    } finally {
      setIsSendingLeadOtp(false);
    }
  };

  const handleVerifyLeadOtp = async () => {
    const digits = normalizePhone10(leadPhone);
    if (digits.length !== 10 || leadOtpCode.trim().length < 4) {
      showToast('Enter the 6-digit OTP to verify your number.');
      return;
    }
    const check = await verifyPhoneOtp({
      phone: digits,
      otp: leadOtpCode,
      context: 'customer',
      supabase,
    });
    if (!check.ok) {
      showToast(check.message || 'Invalid OTP.');
      return;
    }
    setVerifiedCustomerPhone(digits);
    setLeadOtpStep('phone');
    setLeadOtpCode('');
    setLeadOtpNotice('');
    setLeadOtpDemoCode('');
    showToast('Phone verified via OTP! Submitting or send WhatsApp now.');
  };

  const handleSubmitCustomerLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadModalType) return;
    const digits = normalizePhone10(leadPhone);
    if (digits.length !== 10) {
      showToast('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!isLeadPhoneOtpVerified) {
      if (leadOtpStep !== 'otp') {
        await handleSendLeadOtp();
        return;
      }
      const check = await verifyPhoneOtp({
        phone: digits,
        otp: leadOtpCode,
        context: 'customer',
        supabase,
      });
      if (!check.ok) {
        showToast(check.message || 'Please verify the OTP sent to your mobile.');
        return;
      }
      setVerifiedCustomerPhone(digits);
    }
    const resolvedServiceType =
      leadSegment === 'trade_in'
        ? 'Sell / Exchange Valuation'
        : leadSegment === 'finance'
        ? 'Loan & Finance Application'
        : leadSegment === 'service'
        ? 'Workshop & Dyno Service'
        : leadModalType.type;
    const payload = {
      type: resolvedServiceType,
      name: leadName.trim() || 'Showroom Visitor',
      phone: digits,
      bike_model: leadModalType.bikeName || 'General Inquiry',
      branch: leadBranch,
      service_type: resolvedServiceType,
      notes: `${leadMessage.trim() || `${resolvedServiceType} submitted from Customer Storefront`} [OTP Verified]`,
      status: 'New',
    };

    setIsSubmittingLead(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.from('leads').insert([payload]).select().single();
        if (error) {
          showToast(`Could not submit inquiry: ${error.message}`);
        } else {
          broadcastLiveSync('leads', data || payload);
          showToast(`OTP Verified inquiry routed to ${activeRoutedContact.deskLabel}!`);
          setLeadModalType(null);
          setLeadName('');
          setLeadMessage('');
          setLeadOtpStep('phone');
          setLeadOtpCode('');
          setLeadOtpNotice('');
          setLeadOtpDemoCode('');
        }
      }
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const runHubDatabaseFetch = async (digits: string) => {
    if (!supabase) return;
    setHubSearching(true);
    setHubError('');
    try {
      const [invRes, custRes] = await Promise.all([
        supabase.from('invoices').select('*'),
        supabase.from('customers').select('*'),
      ]);
      const matchedInvoices = (invRes.data || []).filter((inv: any) =>
        String(inv.mobile || inv.phone || '').replace(/\D/g, '').endsWith(digits)
      );
      const matchedCustomer =
        (custRes.data || []).find((c: any) =>
          String(c.mobile || '').replace(/\D/g, '').endsWith(digits)
        ) || null;
      setHubResult({ invoices: matchedInvoices, customer: matchedCustomer });
    } finally {
      setHubSearching(false);
    }
  };

  const handleCustomerHubLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalizePhone10(hubPhone || verifiedCustomerPhone);
    if (digits.length !== 10) {
      setHubError('Enter a valid 10-digit mobile number.');
      showToast('Enter a valid 10-digit mobile number.');
      return;
    }
    setHubPhone(digits);
    setHubError('');

    // Already OTP-verified for this exact mobile number -> unlock directly
    if (verifiedCustomerPhone && normalizePhone10(verifiedCustomerPhone) === digits) {
      await runHubDatabaseFetch(digits);
      return;
    }

    if (hubOtpStep === 'phone') {
      setIsSendingHubOtp(true);
      try {
        const res = await sendPhoneOtp({ phone: digits, context: 'customer', supabase });
        if (!res.ok) {
          setHubError(res.error || 'Could not send OTP.');
          return;
        }
        setHubOtpStep('otp');
        setHubOtpCode('');
        setHubOtpNotice(res.message);
        setHubOtpDemoCode(res.demoCode || '');
        setHubOtpCooldown(30);
        showToast(`OTP sent to +91 ${digits}`);
      } finally {
        setIsSendingHubOtp(false);
      }
      return;
    }

    // Verify entered OTP before exposing RC & invoice documents
    const check = await verifyPhoneOtp({
      phone: digits,
      otp: hubOtpCode,
      context: 'customer',
      supabase,
    });
    if (!check.ok) {
      setHubError(check.message || 'Invalid OTP code.');
      return;
    }
    setVerifiedCustomerPhone(digits);
    setHubOtpStep('phone');
    setHubOtpCode('');
    setHubOtpNotice('');
    setHubOtpDemoCode('');
    await runHubDatabaseFetch(digits);
    showToast(`Ownership Hub unlocked for +91 ${digits}`);
  };

  const storefrontBody = (
    <div className="bg-gradient-to-br from-white via-[#F6F9FF] to-[#F3FAF7] text-slate-900 font-sans">
      {/* Top Promo Banner */}
      {settings?.bannerActive && (
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-center gap-2.5 text-center">
          <span className="font-black uppercase tracking-wider px-2 py-0.5 bg-black/35 text-amber-300 rounded">
            {settings.bannerBadge || 'OFFER'}
          </span>
          <span>{settings.bannerText}</span>
          {settings.bannerCtaText && (
            <button
              type="button"
              onClick={() => handleStorefrontTarget(settings.bannerCtaLink)}
              className="px-2.5 py-0.5 rounded-md bg-black/85 hover:bg-black text-amber-300 text-xs font-black uppercase tracking-wider cursor-pointer transition shrink-0"
            >
              {settings.bannerCtaText} →
            </button>
          )}
        </div>
      )}

      {/* Storefront Navbar */}
      <div className="px-4 sm:px-6 py-3.5 bg-white/85 liquid-glass border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/assets/adarsh-emblem-cropped.png"
            alt="Adarsh Motors"
            className="w-9 h-9 rounded-lg object-contain bg-slate-100/85 p-1"
          />
          <div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {settings?.dealershipName || 'ADARSH MOTORS'}
            </div>
            <div className="text-xs text-red-600 font-mono font-semibold">
              {settings?.tagline || 'PERFORMANCE. REFINED.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={formatTelHref(settings?.salesPhone, '+919014540489')}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/85 text-xs sm:text-sm font-mono font-semibold text-slate-900 flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>{settings?.salesPhone || '+91 9014540489'}</span>
          </a>
          <a
            href={buildWhatsAppUrl(
              settings?.salesPhone || settings?.whatsapp,
              settings?.whatsappGreeting || 'Hello Adarsh Motors, I would like to connect with your showroom.'
            )}
            target="_blank"
            rel="noreferrer"
            className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
          {verifiedCustomerPhone ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-700 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>OTP Verified: +91 {verifiedCustomerPhone}</span>
              <button
                type="button"
                onClick={handleLogoutCustomerSiteOtp}
                title="Sign out OTP session"
                className="ml-1 p-1 rounded hover:bg-slate-100/85 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCustAuthStep('phone');
                setCustAuthOtp('');
                setCustAuthNotice('');
                setCustAuthDemoCode('');
                setShowCustomerOtpModal(true);
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 cursor-pointer transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Customer OTP Login</span>
            </button>
          )}
          {standalonePage && onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs sm:text-sm font-bold text-white cursor-pointer"
            >
              Staff Admin Portal
            </button>
          )}
        </div>
      </div>

      {/* Hero Section */}
      {currentHeroSlide && (
        <div className="relative min-h-[260px] sm:min-h-[340px] flex items-end p-5 sm:p-8 border-b border-slate-200/80 overflow-hidden bg-gradient-to-br from-white via-sky-50/60 to-rose-50/40">
          <img
            src={normalizeLocalAssetUrl(currentHeroSlide.image, FALLBACK_SHOWROOM_IMAGE)}
            alt={currentHeroSlide.title}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_SHOWROOM_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/20" />
          {activeHeroSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveSlideIdx((prev) => (prev - 1 + activeHeroSlides.length) % activeHeroSlides.length)
                }
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/85 hover:bg-white text-slate-900 border border-slate-200/90 shadow-md cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveSlideIdx((prev) => (prev + 1) % activeHeroSlides.length)}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/85 hover:bg-white text-slate-900 border border-slate-200/90 shadow-md cursor-pointer transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <div className="relative z-10 max-w-2xl space-y-3 liquid-glass-subtle rounded-2xl p-4 sm:p-6 border border-white/80">
            <div className="text-xs font-mono uppercase tracking-widest text-red-600 font-bold">
              {currentHeroSlide.badge}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {currentHeroSlide.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {currentHeroSlide.subtitle || (currentHeroSlide as any).description}
            </p>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleStorefrontTarget(currentHeroSlide.buttonTarget)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center justify-center cursor-pointer"
              >
                {currentHeroSlide.buttonText || currentHeroSlide.ctaText || 'Explore Inventory'}
              </button>
              <a
                href={buildWhatsAppUrl(
                  superbikesPhone,
                  'Hello Adarsh Motors Superbikes & Luxury Desk, I would like details on your certified superbikes.'
                )}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>WhatsApp Superbikes</span>
              </a>
              <a
                href={buildWhatsAppUrl(
                  budgetBikesPhone,
                  'Hello Adarsh Motors Budget Bikes Desk, please share available commuter & budget bikes.'
                )}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>WhatsApp Budget Bikes</span>
              </a>
              {activeHeroSlides.length > 1 && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:ml-2 pt-1 sm:pt-0">
                  {activeHeroSlides.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      type="button"
                      onClick={() => setActiveSlideIdx(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === safeSlideIdx
                          ? 'w-6 bg-red-600'
                          : 'w-2 bg-slate-400/60 hover:bg-slate-600/80'
                      }`}
                      aria-label={`Hero slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Stack */}
      <div className="p-4 sm:p-6 space-y-8 max-w-6xl mx-auto">
        {/* SECTION 1: SUPERBIKES FLEET (Dedicated Section + Dedicated Phone Number) */}
        {settings?.enableInventoryFleet !== false ? (
          <section id="superbikes" className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-red-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Bike className="w-5 h-5 text-red-500" />
                  <span>Superbikes Collection ({filteredSuperbikes.length})</span>
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Certified Superbikes, Cruisers &amp; Adventure machines · {settings?.workingHours || 'Open Daily'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={formatTelHref(superbikesPhone)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-50/90 hover:bg-red-100/90 border border-red-200/90 text-red-700 hover:text-slate-900 text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Superbikes Desk: {superbikesPhone}</span>
                </a>
                <a
                  href={buildWhatsAppUrl(
                    superbikesPhone,
                    'Hello Adarsh Motors Superbikes & Luxury Desk, I want details about your Superbikes collection.'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-1">
                {['ALL', 'Superbikes', 'Cruisers', 'Adventure', 'Luxury'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedSuperbikeCategory(cat)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition ${
                      selectedSuperbikeCategory === cat
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-50/90 text-slate-700 hover:text-slate-900 border border-slate-200/85'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {settings?.enableBudgetBikesSection !== false && (
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('budget-bikes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="min-h-[34px] px-3 py-1.5 rounded-lg bg-teal-50/90 hover:bg-teal-100/90 border border-teal-200/90 text-teal-700 text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer"
                >
                  Mid-Range, Budget Bikes &amp; Scooters ({budgetBikeFleet.length}) ↓
                </button>
              )}
            </div>

            {filteredSuperbikes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 text-center space-y-3 text-sm text-slate-600">
                <div>
                  No superbikes currently available in this filter. Contact Superbikes Desk at{' '}
                  <span className="font-mono text-slate-900">{superbikesPhone}</span>.
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={formatTelHref(superbikesPhone)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call {superbikesPhone}</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      superbikesPhone,
                      'Hello Adarsh Motors Superbikes Desk, please share latest superbike stock.'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Superbikes Desk</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuperbikes.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-slate-100 border-b border-slate-200/80">
                        <img
                          src={normalizeLocalAssetUrl(b.image_url, FALLBACK_SHOWROOM_IMAGE)}
                          alt={b.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_SHOWROOM_IMAGE;
                          }}
                        />
                        <span
                          className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${
                            b.status === 'Available'
                              ? 'bg-emerald-600 text-white'
                              : b.status === 'Booked'
                              ? 'bg-amber-600 text-white'
                              : 'bg-red-700 text-white'
                          }`}
                        >
                          {b.status || 'Available'}
                        </span>
                      </div>
                      <div className="p-4 space-y-1.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-red-600 truncate">
                          {b.brand} · {b.year}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2 min-h-[2.75rem]">
                          {b.name}
                        </h3>
                        <div className="text-xs font-mono text-slate-600 truncate">
                          {typeof b.km === 'number' ? `${b.km.toLocaleString('en-IN')} km` : b.km || 'New'} ·{' '}
                          {b.hp || b.max_power || 'Verified'} · {b.location || 'Hyderabad'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-slate-200/85 flex items-center justify-between gap-2">
                      <div className="text-lg font-extrabold text-slate-900 font-mono tabular-nums">
                        {formatPrice(b.price_raw || b.price)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={formatTelHref(superbikesPhone)}
                          className="min-h-[40px] px-2.5 py-2 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/85 text-slate-900 text-xs font-bold flex items-center gap-1"
                          title={`Call Superbikes Desk: ${superbikesPhone}`}
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                        </a>
                        <a
                          href={buildWhatsAppUrl(
                            superbikesPhone,
                            `Hello Adarsh Motors Superbikes Desk, I am enquiring about ${b.name} (${formatPrice(b.price_raw || b.price)}). Is it available?`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="min-h-[40px] px-2.5 py-2 rounded-xl bg-emerald-50/90 hover:bg-emerald-600 border border-emerald-200/90 text-emerald-700 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                          title={`WhatsApp Superbikes Desk: ${superbikesPhone}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            openLeadModal({ type: 'Superbike Inquiry', bikeName: b.name, segment: 'superbike' })
                          }
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Inquire
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 text-sm text-amber-800">
            Superbikes Collection section is currently hidden by Admin visibility controls.
          </div>
        )}

        {/* SECTION 2: BUDGET BIKES & COMMUTERS FLEET (Separate Section + Dedicated Phone & WhatsApp Number) */}
        {settings?.enableBudgetBikesSection !== false && (
          <section id="budget-bikes" className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-teal-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Bike className="w-5 h-5 text-teal-600" />
                  <span>Mid-Range, Budget Bikes &amp; Scooters ({filteredBudgetBikes.length})</span>
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Mid-Range Motorcycles, Budget Bikes, Commuters &amp; Scooters with clean paperwork
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={formatTelHref(budgetBikesPhone)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-50/90 hover:bg-teal-100/90 border border-teal-200/90 text-teal-700 hover:text-slate-900 text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Budget &amp; Mid-Range Desk: {budgetBikesPhone}</span>
                </a>
                <a
                  href={buildWhatsAppUrl(
                    budgetBikesPhone,
                    'Hello Adarsh Motors Budget & Mid-Range Bikes Desk, please share available commuter, scooter & mid-range bikes.'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-1">
              {['ALL', 'Mid-Range', 'Scooters'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedBudgetCategory(cat)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition ${
                    selectedBudgetCategory === cat
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-50/90 text-slate-700 hover:text-slate-900 border border-slate-200/85'
                  }`}
                >
                  {cat === 'Mid-Range' ? 'Mid-Range / Budget' : cat}
                </button>
              ))}
            </div>

            {filteredBudgetBikes.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600">
                <span>
                  New Budget Bikes &amp; Commuters arrive daily. Call or WhatsApp our Budget Bikes Desk directly!
                </span>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={formatTelHref(budgetBikesPhone)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call {budgetBikesPhone}</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      budgetBikesPhone,
                      'Hello Adarsh Motors Budget Bikes Desk, please share today’s budget & commuter bike stock.'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBudgetBikes.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl bg-white/85 backdrop-blur-xl border border-teal-200/90 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-slate-100 border-b border-slate-200/80">
                        <img
                          src={normalizeLocalAssetUrl(b.image_url, FALLBACK_SHOWROOM_IMAGE)}
                          alt={b.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_SHOWROOM_IMAGE;
                          }}
                        />
                        <span
                          className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${
                            b.status === 'Available'
                              ? 'bg-emerald-600 text-white'
                              : b.status === 'Booked'
                              ? 'bg-amber-600 text-white'
                              : 'bg-red-700 text-white'
                          }`}
                        >
                          {b.status || 'Available'}
                        </span>
                      </div>
                      <div className="p-4 space-y-1.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-600 truncate">
                          {b.brand} · {b.year} · {b.category}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2 min-h-[2.75rem]">
                          {b.name}
                        </h3>
                        <div className="text-xs font-mono text-slate-600 truncate">
                          {typeof b.km === 'number' ? `${b.km.toLocaleString('en-IN')} km` : b.km || 'Verified'} · {b.location || 'Hyderabad'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-slate-200/85 flex items-center justify-between gap-2">
                      <div className="text-lg font-extrabold text-slate-900 font-mono tabular-nums">
                        {formatPrice(b.price_raw || b.price)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={formatTelHref(budgetBikesPhone)}
                          className="min-h-[40px] px-2.5 py-2 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/85 text-slate-900 text-xs font-bold flex items-center gap-1"
                          title={`Call Budget Bikes Desk: ${budgetBikesPhone}`}
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                        </a>
                        <a
                          href={buildWhatsAppUrl(
                            budgetBikesPhone,
                            `Hello Adarsh Motors Budget Bikes Desk, I am enquiring about ${b.name} (${formatPrice(b.price_raw || b.price)}). Is it available?`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="min-h-[40px] px-2.5 py-2 rounded-xl bg-emerald-50/90 hover:bg-emerald-600 border border-emerald-200/90 text-emerald-700 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                          title={`WhatsApp Budget Bikes Desk: ${budgetBikesPhone}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            openLeadModal({ type: 'Budget Bike Inquiry', bikeName: b.name, segment: 'budget' })
                          }
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Inquire
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: SUPERBIKE ACCESSORIES (Separate Section + Dedicated Phone & WhatsApp Number) */}
        {settings?.enableAccessoriesSection !== false && (
          <section id="accessories" className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-amber-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-700" />
                  <span>Superbike Accessories &amp; Gear ({visibleAccessories.length})</span>
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Synced directly from Admin Accessories Inventory
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={formatTelHref(accessoriesPhone)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/90 text-amber-800 hover:text-slate-900 text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Accessories Desk: {accessoriesPhone}</span>
                </a>
                <a
                  href={buildWhatsAppUrl(
                    accessoriesPhone,
                    'Hello Adarsh Motors Accessories Desk, I want to enquire about superbike gear & parts.'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleAccessories.map((acc) => {
                const remQty = Number(acc.stock_count) || 0;
                const soldQty = Number(acc.sold_count) || 0;
                const isRedAlert = remQty < 10;
                const isCriticalRed = remQty < 5;

                return (
                  <div
                    key={acc.id}
                    className={`rounded-2xl bg-white/85 backdrop-blur-xl border overflow-hidden flex flex-col justify-between transition hover:border-amber-200/90 ${
                      isCriticalRed
                        ? 'border-red-300 shadow-lg shadow-red-500/15'
                        : isRedAlert
                        ? 'border-red-200/90'
                        : 'border-slate-200/85'
                    }`}
                  >
                    <div>
                      <div
                        onClick={() => {
                          setSelectedStoreAccessory(acc);
                          setStoreAccPhotoIdx(0);
                          setStoreAccZoomOpen(false);
                        }}
                        className="relative aspect-[16/10] bg-white/85 backdrop-blur-xl border-b border-slate-200/85 cursor-pointer group overflow-hidden"
                        title="Tap to view fitment specs & zoom photos"
                      >
                        <img
                          src={normalizeLocalAssetUrl(acc.image_url, FALLBACK_SHOWROOM_IMAGE)}
                          alt={acc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_SHOWROOM_IMAGE;
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
                        <span className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-md bg-black/80 border border-white/15 text-[10px] font-semibold text-white flex items-center gap-1">
                          <ZoomIn className="w-3 h-3 text-sky-300" />
                          <span>Specs &amp; Zoom</span>
                        </span>
                        <div className="absolute top-2 right-2">
                          {remQty === 0 ? (
                            <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-black uppercase shadow">
                              SOLD OUT · 0 LEFT
                            </span>
                          ) : isCriticalRed ? (
                            <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-black uppercase shadow">
                              ONLY {remQty} LEFT!
                            </span>
                          ) : isRedAlert ? (
                            <span className="px-2.5 py-1 rounded-lg bg-red-50/90 border border-red-200/90 text-red-700 text-[11px] font-black uppercase shadow">
                              {remQty} REMAINING (&lt;10)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-emerald-700 text-[11px] font-bold uppercase shadow">
                              {remQty} IN STOCK
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="text-xs font-bold uppercase text-amber-700 truncate">
                          {acc.brand} · {acc.category}
                        </div>
                        <h3
                          onClick={() => {
                            setSelectedStoreAccessory(acc);
                            setStoreAccPhotoIdx(0);
                            setStoreAccZoomOpen(false);
                          }}
                          className="text-base font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.75rem] cursor-pointer hover:text-amber-800 transition"
                        >
                          {acc.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 min-h-[2.25rem]">
                          {acc.description || 'Genuine OEM & track-certified superbike component.'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                          <div className={`px-2.5 py-1.5 rounded-lg border font-mono font-bold truncate ${
                            isRedAlert
                              ? 'bg-red-50/90 border-red-200/90 text-red-700'
                              : 'bg-emerald-50/90 border-emerald-200/90 text-emerald-700'
                          }`}>
                            Remaining: {remQty}
                          </div>
                          <div className="px-2.5 py-1.5 rounded-lg bg-slate-50/90 border border-slate-200/85 text-slate-700 font-mono font-semibold truncate">
                            Sold Out: {soldQty}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 pt-3 border-t border-slate-200/85 flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold font-mono text-slate-900 tabular-nums truncate">
                        {formatPrice(acc.price)}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStoreAccessory(acc);
                            setStoreAccPhotoIdx(0);
                            setStoreAccZoomOpen(false);
                          }}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/85 text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="View technical specs & zoom"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-sky-700" />
                          <span className="hidden sm:inline">Specs</span>
                        </button>
                        <a
                          href={buildWhatsAppUrl(
                            accessoriesPhone,
                            `Hello Adarsh Motors Accessories Desk, I want to order/enquire about ${acc.title} (${formatPrice(acc.price)}). Remaining website qty: ${remQty}.`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-50/90 hover:bg-emerald-600 border border-emerald-200/90 text-emerald-700 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                          title={`WhatsApp Accessories Desk: ${accessoriesPhone}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            openLeadModal({ type: 'Accessory Order', bikeName: acc.title, segment: 'accessories' })
                          }
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                        >
                          {remQty === 0 ? 'Notify Me' : 'Order'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 4: DEDICATED SERVICE, TRADE-IN, TEST RIDE & COMMUNITY SECTIONS (Each with Separate Call + WhatsApp) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings?.enableWorkshopBooking !== false && (
            <div
              id="workshop"
              className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-sky-200/90 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50/90 border border-sky-200/90 text-sky-600 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">Service, Workshop &amp; Dyno Hub</h3>
                  </div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-sky-50/90 text-sky-700 border border-sky-200/90">
                    Service Section
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Motul 300V oil flushes, ECU dyno tuning, brake bleed &amp; laser alignment by master technicians.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/85 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={formatTelHref(servicePhone)}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-sky-50/90 hover:bg-sky-100/90 border border-sky-200/90 text-sky-700 text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                    <span>{servicePhone}</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      servicePhone,
                      'Hello Adarsh Motors Service & Dyno Desk, I would like to book a service slot.'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                    title={`WhatsApp Service Desk: ${servicePhone}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => openLeadModal({ type: 'Workshop & Dyno Service', segment: 'service' })}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                >
                  Book Service Slot
                </button>
              </div>
            </div>
          )}

          {settings?.enableSellBike !== false && (
            <div
              id="sell-modal"
              className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-emerald-200/90 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-600 flex items-center justify-center">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">Sell / Exchange Bike</h3>
                  </div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-emerald-50/90 text-emerald-700 border border-emerald-200/90">
                    Trade-In Desk
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  15-minute doorstep valuation, instant bank payout, and 100% legal RTO transfer guarantee.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/85 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={formatTelHref(tradeInPhone)}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-700 text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{tradeInPhone}</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      tradeInPhone,
                      'Hello Adarsh Motors Trade-In Desk, I want an instant valuation to sell/exchange my bike.'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                    title={`WhatsApp Trade-In Desk: ${tradeInPhone}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => openLeadModal({ type: 'Sell / Exchange Valuation', segment: 'trade_in' })}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Get Instant Valuation
                </button>
              </div>
            </div>
          )}

          {settings?.enableTestRide !== false && (
            <div
              id="test-ride"
              className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-orange-200/90 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-50/90 border border-orange-200/90 text-orange-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">Schedule VIP Test Ride</h3>
                  </div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-orange-50/90 text-orange-700 border border-orange-200/90">
                    Test Ride Desk
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Book guided weekend studio rides and physical superbike inspections with our showroom marshals.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/85 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={formatTelHref(testRidePhone)}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-orange-50/90 hover:bg-orange-100/90 border border-orange-200/90 text-orange-700 text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-orange-600" />
                    <span>{testRidePhone}</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      testRidePhone,
                      'Hello Adarsh Motors Test Ride Desk, I would like to book a VIP test ride.'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                    title={`WhatsApp Test Ride Desk: ${testRidePhone}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => openLeadModal({ type: 'VIP Test Ride', segment: 'test_ride' })}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer"
                >
                  Reserve Test Ride
                </button>
              </div>
            </div>
          )}

          {settings?.enableCommunityRides !== false && (
            <div
              id="community"
              className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-indigo-200/90 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50/90 border border-indigo-200/90 text-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">VIP Riders &amp; Sunday Breakfast Rides</h3>
                  </div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-indigo-50/90 text-indigo-700 border border-indigo-200/90">
                    Riders Club
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Join 2,500+ Adarsh Motors riders for curated highway breakfast runs and track-day experiences.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/85 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={formatTelHref(communityPhone)}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200/90 text-indigo-700 text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{communityPhone}</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      communityPhone,
                      'Hello Adarsh Motors Riders Club Desk, I want to register for the Sunday Breakfast Ride!'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                    title={`WhatsApp Riders Club Desk: ${communityPhone}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => openLeadModal({ type: 'VIP Riders Club Registration', segment: 'community' })}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Join VIP Club
                </button>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 5 & 6: EMI Calculator & Buyer Ownership Hub (Each with Separate Contact Phone) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {settings?.enableEmiCalculator !== false && (
            <section id="finance" className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-200/90 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <span>Superbike EMI Estimator</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-blue-700">
                    {settings?.defaultEmiInterestRate || 8.5}% p.a.
                  </span>
                  <a
                    href={formatTelHref(financePhone)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50/90 border border-blue-200/90 text-blue-700 text-xs font-mono font-bold flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3 text-blue-600" />
                    <span>{financePhone}</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      financePhone,
                      `Hello Adarsh Motors Finance Desk, please share EMI approval details for Bike Price ${formatPrice(emiPrice)}, Down Payment ${formatPrice(emiDown)}, ${emiMonths} months (Est. ${formatPrice(emiMonthly)}/mo).`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                    title={`WhatsApp Finance Desk: ${financePhone}`}
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WA</span>
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Bike Price (₹)</label>
                  <input
                    type="number"
                    value={emiPrice}
                    onChange={(e) => setEmiPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-200/85 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Down Payment (₹)</label>
                  <input
                    type="number"
                    value={emiDown}
                    onChange={(e) => setEmiDown(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-200/85 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Tenure (Months)</label>
                  <EditableSelect
                    value={String(emiMonths || '')}
                    inputType="number"
                    onChange={(val) => {
                      const num = Number(val);
                      setEmiMonths(isNaN(num) || num <= 0 ? 0 : num);
                    }}
                    manualPlaceholder="Months (e.g. 18)"
                    options={[12, 24, 36, 48, 60].map((m) => ({
                      value: String(m),
                      label: `${m} Months`,
                    }))}
                    className="px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-200/85 font-mono text-slate-900"
                  />
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/85 backdrop-blur-xl border border-slate-200/85 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs sm:text-sm text-slate-600 block">Estimated Monthly EMI</span>
                  <span className="text-xl font-extrabold font-mono text-emerald-700 tabular-nums">
                    {formatPrice(emiMonthly)}/mo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openLeadModal({
                      type: 'Loan & Finance Application',
                      segment: 'finance',
                      bikeName: `Loan Plan · ${formatPrice(emiPrice)} (${emiMonths}m · EMI ${formatPrice(emiMonthly)}/mo)`,
                    })
                  }
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-blue-600/25"
                >
                  Apply for Loan / Finance
                </button>
              </div>
            </section>
          )}

          {settings?.enableCustomerHub !== false && (
            <section id="ownership-hub" className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-purple-200/90 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-purple-600" />
                  <span>Buyer Ownership &amp; RC Transfer Hub</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <a
                    href={formatTelHref(billingPhone)}
                    className="px-2.5 py-1 rounded-lg bg-purple-50/90 border border-purple-200/90 text-purple-700 text-xs font-mono font-bold flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3 text-purple-600" />
                    <span>RTO Desk: {billingPhone}</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      billingPhone,
                      'Hello Adarsh Motors RTO & Billing Desk, I would like an update on my RC transfer / invoice.'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                    title={`WhatsApp RTO Desk: ${billingPhone}`}
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WA</span>
                  </a>
                </div>
              </div>
              <form onSubmit={handleCustomerHubLookup} className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="tel"
                    value={hubPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHubPhone(val);
                      if (hubOtpStep === 'otp') {
                        setHubOtpStep('phone');
                        setHubOtpCode('');
                        setHubOtpNotice('');
                        setHubOtpDemoCode('');
                      }
                    }}
                    placeholder="Enter buyer mobile (e.g. 9123456789)"
                    className="w-full sm:w-auto flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/85 text-sm font-mono text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={hubSearching || isSendingHubOtp}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60"
                  >
                    {verifiedCustomerPhone && normalizePhone10(verifiedCustomerPhone) === normalizePhone10(hubPhone || verifiedCustomerPhone) ? (
                      <>
                        <Search className="w-4 h-4" />
                        <span>{hubSearching ? 'Checking...' : 'Check RC'}</span>
                      </>
                    ) : hubOtpStep === 'phone' ? (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>{isSendingHubOtp ? 'Sending OTP...' : 'Send OTP to Check RC'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{hubSearching ? 'Verifying...' : 'Verify OTP & Unlock'}</span>
                      </>
                    )}
                  </button>
                </div>

                {hubOtpStep === 'otp' && (
                  <div className="p-3.5 rounded-xl bg-white/85 backdrop-blur-xl border border-purple-200/90 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-purple-700 font-semibold">{hubOtpNotice || 'OTP sent to your mobile.'}</span>
                      {hubOtpDemoCode && (
                        <button
                          type="button"
                          onClick={() => setHubOtpCode(hubOtpDemoCode)}
                          className="px-2 py-0.5 rounded bg-emerald-50/90 border border-emerald-200/90 text-emerald-700 font-mono font-bold cursor-pointer shrink-0"
                        >
                          OTP: {hubOtpDemoCode} (Tap to fill)
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={hubOtpCode}
                        onChange={(e) => setHubOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full sm:w-auto flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-slate-50/90 border border-purple-200/90 text-sm font-mono tracking-[0.25em] text-slate-900 placeholder-slate-400"
                      />
                      <button
                        type="button"
                        disabled={hubOtpCooldown > 0 || isSendingHubOtp}
                        onClick={async () => {
                          const digits = normalizePhone10(hubPhone);
                          if (digits.length !== 10) return;
                          setIsSendingHubOtp(true);
                          try {
                            const res = await sendPhoneOtp({ phone: digits, context: 'customer', supabase });
                            if (!res.ok) {
                              setHubError(res.error || 'Could not resend OTP.');
                              return;
                            }
                            setHubOtpCode('');
                            setHubOtpNotice(res.message);
                            setHubOtpDemoCode(res.demoCode || '');
                            setHubOtpCooldown(30);
                            showToast(`Fresh OTP sent to +91 ${digits}`);
                          } finally {
                            setIsSendingHubOtp(false);
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-200/85 text-xs text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
                      >
                        {hubOtpCooldown > 0 ? `Resend (${hubOtpCooldown}s)` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}

                {hubError && (
                  <div className="text-xs font-semibold text-red-700 bg-red-50/90 border border-red-200/90 rounded-lg px-3 py-2">
                    {hubError}
                  </div>
                )}
              </form>

              {hubResult && (
                <div className="p-3.5 rounded-xl bg-white/85 backdrop-blur-xl border border-slate-200/85 space-y-2 text-sm">
                  {hubResult.customer ? (
                    <div>
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{hubResult.customer.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-sky-50/90 text-sky-700">
                          RTO: {hubResult.customer.paper_transfer_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {hubResult.customer.paper_transfer_notes || 'File active in RTO queue.'}
                      </p>
                    </div>
                  ) : hubResult.invoices.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-emerald-700 font-semibold">
                        Found {hubResult.invoices.length} Delivery Note / Invoice record(s) for{' '}
                        {hubResult.invoices[0].vehicle} ({hubResult.invoices[0].invoice_number || hubResult.invoices[0].invoice_id}).
                      </div>
                      <div className="text-xs text-slate-600 font-mono">
                        Reg #: {hubResult.invoices[0].reg_number || hubResult.invoices[0].reg_no || 'Registered'}
                        {Boolean(settings?.enableInvoicePricePublic) &&
                        Boolean(hubResult.invoices[0].show_price_public) &&
                        Number(hubResult.invoices[0].price || 0) > 0
                          ? ` · Price: ${formatPrice(hubResult.invoices[0].price)}`
                          : ' · Price: Hidden on Public View'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-600">No vehicle invoice or RTO record matched that phone number.</div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* SECTION 7: Showroom Branches */}
        {settings?.enableBranchLocations !== false && activeBranches.length > 0 && (
          <section id="locations" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600" />
                <span>Showroom Locations ({activeBranches.length})</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={formatTelHref(branchesPhone)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-50/90 hover:bg-rose-100/90 border border-rose-200/90 text-rose-700 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                  <span>Branches Desk: {branchesPhone}</span>
                </a>
                <a
                  href={buildWhatsAppUrl(
                    branchesPhone,
                    'Hello Adarsh Motors, please share your showroom branch locations & visiting hours.'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBranches.map((br) => {
                const parsedMap = parseGoogleMapsLocation(
                  br.maps_url || br.maps_query,
                  `${br.branch_name} ${br.address} ${br.city}`
                );
                return (
                  <div
                    key={br.id}
                    className="rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-36 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/85 overflow-hidden">
                        <iframe
                          title={`Map for ${br.branch_name}`}
                          src={parsedMap.embedUrl}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="w-full h-full border-0"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase text-rose-600">{br.city}</span>
                          <span className="text-xs font-mono text-emerald-700">{br.status || 'Active'}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{br.branch_name}</h4>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{br.address}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <a
                            href={formatTelHref(br.phone)}
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-700 hover:text-sky-700 font-bold"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>{br.phone}</span>
                          </a>
                          <a
                            href={buildWhatsAppUrl(
                              br.phone,
                              `Hello ${br.branch_name}, I would like to visit your showroom.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-700 text-xs font-bold"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                        {br.timings && (
                          <div className="text-xs text-slate-600">{br.timings}</div>
                        )}
                        {parsedMap.lat !== null && parsedMap.lng !== null && (
                          <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                            Pin: {parsedMap.lat.toFixed(5)}, {parsedMap.lng.toFixed(5)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-slate-200/85">
                      <a
                        href={parsedMap.normalizedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-red-50/90 hover:bg-red-100/90 border border-red-200/90 text-red-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Navigation className="w-3.5 h-3.5 shrink-0" />
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 8: Contact Helplines & Dealership Footer (Call + WhatsApp on Every Section Number) */}
        <footer id="legacy" className="p-5 sm:p-6 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
                {settings?.dealershipName || 'ADARSH MOTORS'}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {settings?.subtitle || 'Certified Pre-Owned Superbike Studio & Dyno Hub.'}
              </p>
              {settings?.address && (
                <p className="text-xs text-slate-600 mt-1.5">{settings.address}</p>
              )}
              <div className="text-xs text-slate-600 leading-relaxed mt-2">
                {settings?.workingHours || 'Mon - Sat: 9:30 AM - 8:30 PM'}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Dedicated Section Call &amp; WhatsApp Helplines (Live Synced from Admin)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono">
                {[
                  { label: 'Main Sales', color: 'text-slate-700', phone: settings?.salesPhone || '+91 9014540489', msg: 'Hello Adarsh Motors Sales Desk!' },
                  { label: 'Superbikes & Luxury', color: 'text-red-700', phone: superbikesPhone, msg: 'Hello Adarsh Motors Superbikes & Luxury Desk!' },
                  { label: 'Budget Bikes', color: 'text-teal-700', phone: budgetBikesPhone, msg: 'Hello Adarsh Motors Budget Bikes Desk!' },
                  { label: 'Accessories', color: 'text-amber-800', phone: accessoriesPhone, msg: 'Hello Adarsh Motors Accessories Desk!' },
                  { label: 'Service / Dyno', color: 'text-sky-700', phone: servicePhone, msg: 'Hello Adarsh Motors Service & Dyno Desk!' },
                  { label: 'Sell / Exchange', color: 'text-emerald-700', phone: tradeInPhone, msg: 'Hello Adarsh Motors Trade-In Desk!' },
                  { label: 'Test Ride', color: 'text-orange-700', phone: testRidePhone, msg: 'Hello Adarsh Motors Test Ride Desk!' },
                  { label: 'Finance / EMI', color: 'text-blue-700', phone: financePhone, msg: 'Hello Adarsh Motors Finance Desk!' },
                  { label: 'RTO / Billing', color: 'text-purple-700', phone: billingPhone, msg: 'Hello Adarsh Motors RTO & Billing Desk!' },
                  { label: 'Showrooms', color: 'text-rose-700', phone: branchesPhone, msg: 'Hello Adarsh Motors Showroom Locations Desk!' },
                  { label: 'Riders Club', color: 'text-indigo-700', phone: communityPhone, msg: 'Hello Adarsh Motors Riders Club!' },
                  { label: '24x7 RSA', color: 'text-red-700', phone: rsaPhone, msg: 'URGENT: Need 24x7 RSA Support from Adarsh Motors.' },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="p-2 rounded-lg bg-white/85 backdrop-blur-xl border border-slate-200/85 flex items-center justify-between gap-2"
                  >
                    <a
                      href={formatTelHref(row.phone)}
                      className="min-w-0 flex-1 flex items-center justify-between gap-1.5 hover:text-slate-900"
                      title={`Call ${row.label}: ${row.phone}`}
                    >
                      <span className={`${row.color} font-sans truncate`}>{row.label}:</span>
                      <span className="text-slate-900 font-bold truncate">{row.phone}</span>
                    </a>
                    <a
                      href={buildWhatsAppUrl(row.phone, row.msg)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded bg-emerald-50/90 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/90 shrink-0 transition"
                      title={`WhatsApp ${row.label}: ${row.phone}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={buildWhatsAppUrl(
                    settings?.whatsapp || settings?.salesPhone,
                    settings?.whatsappGreeting || 'Hello Adarsh Motors!'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Default WhatsApp ({settings?.whatsapp || '9014540489'})</span>
                </a>
                <a
                  href={formatTelHref(ownerPhone)}
                  className="inline-flex min-h-[40px] items-center gap-2 px-4 py-2 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/90 text-amber-800 text-xs font-bold font-mono transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                  <span>VIP Escalation: {ownerPhone}</span>
                </a>
                <a
                  href={buildWhatsAppUrl(
                    ownerPhone,
                    'Hello Pavan Kumar (Adarsh Motors VIP Concierge), I need direct assistance.'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-700 text-xs font-bold transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp VIP</span>
                </a>
              </div>

              {/* Live Synced Social Media Channels Dock */}
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                  Follow Us:
                </span>
                {[
                  {
                    label: 'Instagram',
                    raw: settings?.instagram,
                    href: /^https?:\/\//i.test(String(settings?.instagram || '').trim())
                      ? String(settings?.instagram).trim()
                      : `https://instagram.com/${String(settings?.instagram || 'adarshmotors.in').replace(/^@/, '')}`,
                    cls: 'bg-pink-50/90 text-pink-700 border-pink-200/90',
                  },
                  {
                    label: 'YouTube',
                    raw: settings?.youtube,
                    href: String(settings?.youtube || '').trim(),
                    cls: 'bg-red-50/90 text-red-700 border-red-200/90',
                  },
                  {
                    label: 'Facebook',
                    raw: settings?.facebook,
                    href: String(settings?.facebook || '').trim(),
                    cls: 'bg-blue-50/90 text-blue-700 border-blue-200/90',
                  },
                  {
                    label: 'X',
                    raw: settings?.twitter,
                    href: String(settings?.twitter || '').trim(),
                    cls: 'bg-slate-100/90 text-slate-800 border-slate-300/85',
                  },
                  {
                    label: 'Telegram',
                    raw: settings?.telegram,
                    href: String(settings?.telegram || '').trim(),
                    cls: 'bg-sky-50/90 text-sky-700 border-sky-200/90',
                  },
                  {
                    label: 'Threads',
                    raw: settings?.threads,
                    href: String(settings?.threads || '').trim(),
                    cls: 'bg-purple-50/90 text-purple-700 border-purple-200/90',
                  },
                ]
                  .filter((item) => Boolean(item.raw && String(item.raw).trim()))
                  .map((item) => {
                    const finalHref = /^https?:\/\//i.test(item.href)
                      ? item.href
                      : `https://${item.href.replace(/^\/+/, '')}`;
                    return (
                      <a
                        key={item.label}
                        href={finalHref}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold hover:opacity-85 transition ${item.cls}`}
                      >
                        <span>{item.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    );
                  })}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Smart WhatsApp Concierge Auto-Router */}
      <div className="sticky bottom-4 z-40 flex justify-end px-4 pb-4 pointer-events-none">
        <div className="pointer-events-auto relative">
          {waRouterOpen && (
            <div className="mb-2.5 w-[calc(100vw-2rem)] sm:w-80 max-w-sm p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-emerald-200/90 shadow-2xl space-y-2">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/85">
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  Smart WhatsApp Auto-Diversion
                </span>
                <button
                  type="button"
                  onClick={() => setWaRouterOpen(false)}
                  className="text-slate-600 hover:text-slate-900 p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Select what you are looking for to auto-connect on WhatsApp to the dedicated desk number:
              </p>
              <div className="space-y-1.5 text-xs">
                {[
                  {
                    label: 'Superbikes & Luxury (e.g. Tenere, Ducati, BMW)',
                    phone: superbikesPhone,
                    badge: 'bg-red-50/90 text-red-700 border-red-200/90',
                    msg: 'Hello Adarsh Motors Superbikes & Luxury Desk, I am enquiring about a superbike / luxury motorcycle.',
                  },
                  {
                    label: 'Budget Bikes, Commuters & Scooters',
                    phone: budgetBikesPhone,
                    badge: 'bg-teal-50/90 text-teal-700 border-teal-200/90',
                    msg: 'Hello Adarsh Motors Budget Bikes Desk, I am looking for a budget / commuter bike.',
                  },
                  {
                    label: 'Accessories & Riding Gear',
                    phone: accessoriesPhone,
                    badge: 'bg-amber-50/90 text-amber-800 border-amber-200/90',
                    msg: 'Hello Adarsh Motors Accessories Desk, I want to enquire about parts & riding gear.',
                  },
                  {
                    label: 'Service, Workshop & Dyno',
                    phone: servicePhone,
                    badge: 'bg-sky-50/90 text-sky-700 border-sky-200/90',
                    msg: 'Hello Adarsh Motors Service Desk, I want to book a service / dyno appointment.',
                  },
                  {
                    label: 'Sell / Exchange My Bike',
                    phone: tradeInPhone,
                    badge: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90',
                    msg: 'Hello Adarsh Motors Trade-In Desk, I want to sell or exchange my bike.',
                  },
                ].map((opt) => (
                  <a
                    key={opt.label}
                    href={buildWhatsAppUrl(opt.phone, opt.msg)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/85 backdrop-blur-xl hover:bg-slate-100 border border-slate-200/85 transition"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{opt.label}</div>
                      <div className="text-[11px] font-mono text-emerald-700">{opt.phone}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 ${opt.badge}`}>
                      WA Chat
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setWaRouterOpen((v) => !v)}
            className="min-h-[44px] px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold shadow-xl shadow-emerald-900/50 flex items-center gap-2 cursor-pointer border border-emerald-400/40"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Enquiry Router</span>
          </button>
        </div>
      </div>

      {/* Customer Lead Capture & Smart WhatsApp Diversion Modal inside Storefront */}
      {leadModalType && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-100/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/85 backdrop-blur-xl border border-slate-200/85 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {leadModalType.type}
                {leadModalType.bikeName ? ` · ${leadModalType.bikeName}` : ''}
              </h3>
              <button
                type="button"
                onClick={() => setLeadModalType(null)}
                className="p-1.5 rounded-lg bg-slate-100/85 text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomerLead} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Vehicle / Inquiry Category (Auto-Diverts Number)
                </label>
                <EditableSelect
                  value={leadSegment}
                  onChange={(val) => setLeadSegment(val as EnquirySegment)}
                  manualPlaceholder="Write vehicle/inquiry type (e.g. Activa)..."
                  options={[
                    { value: 'general', label: 'Auto-Detect from Bike / Message' },
                    { value: 'superbike', label: 'Superbikes & Luxury Bikes' },
                    { value: 'budget', label: 'Budget Bikes, Commuters & Scooters' },
                    { value: 'accessories', label: 'Accessories & Riding Gear' },
                    { value: 'service', label: 'Service, Workshop & Dyno' },
                    { value: 'trade_in', label: 'Sell / Exchange Bike' },
                    { value: 'test_ride', label: 'VIP Test Ride Booking' },
                    { value: 'finance', label: 'Finance & EMI Desk' },
                    { value: 'billing', label: 'RTO, Billing & Ownership' },
                    { value: 'community', label: 'VIP Riders Community' },
                  ]}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/85 text-slate-900 font-semibold"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/85 backdrop-blur-xl border border-emerald-200/90 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase text-emerald-700">
                    Diverted To: {activeRoutedContact.deskLabel}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 truncate">
                    {activeRoutedContact.phone}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={formatTelHref(activeRoutedContact.phone)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/85 text-sky-700 text-xs font-bold flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={buildDivertedLeadWaUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <input
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/85 text-slate-900 placeholder-slate-400"
              />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => {
                      setLeadPhone(e.target.value);
                      if (leadOtpStep === 'otp') {
                        setLeadOtpStep('phone');
                        setLeadOtpCode('');
                      }
                    }}
                    placeholder="10-Digit Mobile Number *"
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/85 text-slate-900 font-mono placeholder-slate-400"
                  />
                  {isLeadPhoneOtpVerified ? (
                    <span className="px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-700 text-xs font-bold flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                      <span>OTP Verified</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSendingLeadOtp}
                      onClick={handleSendLeadOtp}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {isSendingLeadOtp ? 'Sending...' : leadOtpStep === 'otp' ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>

                {!isLeadPhoneOtpVerified && leadOtpStep === 'otp' && (
                  <div className="p-3 rounded-xl bg-white/85 backdrop-blur-xl border border-sky-200/90 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-sky-700 font-semibold">{leadOtpNotice || 'OTP dispatched.'}</span>
                      {leadOtpDemoCode && (
                        <button
                          type="button"
                          onClick={() => setLeadOtpCode(leadOtpDemoCode)}
                          className="px-2 py-0.5 rounded bg-emerald-50/90 border border-emerald-200/90 text-emerald-700 font-mono font-bold cursor-pointer"
                        >
                          OTP: {leadOtpDemoCode} (Fill)
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={leadOtpCode}
                        onChange={(e) => setLeadOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-50/90 border border-sky-200/90 text-slate-900 font-mono tracking-[0.2em] text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyLeadOtp}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <EditableSelect
                value={leadBranch}
                onChange={(val) => setLeadBranch(val)}
                manualPlaceholder="Write branch / city manually..."
                options={
                  activeBranches.length > 0
                    ? activeBranches.map((br) => ({
                        value: br.branch_name,
                        label: br.branch_name,
                      }))
                    : [{ value: 'Hyderabad – Main Showroom', label: 'Hyderabad – Main Showroom' }]
                }
                className="px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/85 text-slate-900"
              />
              <textarea
                rows={2}
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                placeholder="Model name (e.g. Budget bike or Superbike/Tenere), preferred date, or message..."
                className="w-full p-3 rounded-xl bg-slate-50/90 border border-slate-200/85 text-slate-900 placeholder-slate-400"
              />
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLeadModalType(null)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50/90 text-slate-700 font-semibold cursor-pointer text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <a
                  href={buildDivertedLeadWaUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>WhatsApp Now</span>
                </a>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="col-span-2 sm:col-span-1 min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmittingLead
                      ? 'Sending...'
                      : !isLeadPhoneOtpVerified && leadOtpStep === 'phone'
                      ? 'Send OTP & Submit'
                      : !isLeadPhoneOtpVerified && leadOtpStep === 'otp'
                      ? 'Verify OTP & Submit'
                      : 'Submit Inquiry'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Website Phone + OTP Login Modal */}
      {showCustomerOtpModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-100/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/85 backdrop-blur-xl border border-sky-200/90 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/85">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50/90 border border-sky-200/90 text-sky-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Customer Website OTP Sign In</h3>
                  <p className="text-xs text-slate-600">Verify your mobile via connected OTP Operator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerOtpModal(false)}
                className="p-1.5 rounded-lg bg-slate-100/85 text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {custAuthStep === 'phone' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCustomerSiteOtp();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Customer Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={custAuthPhone}
                    onChange={(e) => setCustAuthPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile (e.g. 9123456789)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/85 text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingCustOtp}
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSendingCustOtp ? 'Sending OTP...' : 'Send OTP via Operator'}</span>
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyCustomerSiteOtp();
                }}
                className="space-y-4"
              >
                <div className="p-3 rounded-xl bg-white/85 backdrop-blur-xl border border-sky-200/90 space-y-2">
                  <div className="text-xs text-sky-700 font-semibold">{custAuthNotice}</div>
                  {custAuthDemoCode && (
                    <button
                      type="button"
                      onClick={() => setCustAuthOtp(custAuthDemoCode)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-emerald-700 text-xs font-mono font-bold cursor-pointer"
                    >
                      Operator OTP Code: {custAuthDemoCode} (Tap to auto-fill)
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Enter 6-Digit OTP for +91 {custAuthPhone}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={custAuthOtp}
                    onChange={(e) => setCustAuthOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit OTP"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-sky-200/90 text-slate-900 font-mono tracking-[0.3em] text-center text-base focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustAuthStep('phone');
                      setCustAuthOtp('');
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50/90 border border-slate-200/85 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Change Number
                  </button>
                  <button
                    type="button"
                    disabled={custAuthCooldown > 0 || isSendingCustOtp}
                    onClick={() => handleSendCustomerSiteOtp(custAuthPhone)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50/90 border border-slate-200/85 text-sky-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {custAuthCooldown > 0 ? `Resend (${custAuthCooldown}s)` : 'Resend OTP'}
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingCustOtp}
                    className="col-span-2 sm:col-span-1 sm:flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold cursor-pointer disabled:opacity-60"
                  >
                    {isVerifyingCustOtp ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Storefront Customer Accessory Detail Showcase Modal (Non-Clipping Responsive Split) */}
      {selectedStoreAccessory && (() => {
        const specs = resolveAccessoryShowcaseFields(selectedStoreAccessory);
        const photos =
          selectedStoreAccessory.gallery_urls && selectedStoreAccessory.gallery_urls.length > 0
            ? selectedStoreAccessory.gallery_urls
            : [selectedStoreAccessory.image_url];
        const safeIdx = Math.min(storeAccPhotoIdx, Math.max(0, photos.length - 1));
        const activePhoto = normalizeLocalAssetUrl(
          photos[safeIdx] || selectedStoreAccessory.image_url,
          FALLBACK_SHOWROOM_IMAGE
        );
        const remQty = Number(selectedStoreAccessory.stock_count) || 0;
        const soldQty = Number(selectedStoreAccessory.sold_count) || 0;

        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-5 bg-slate-100/90 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-5xl bg-white/85 backdrop-blur-xl border border-slate-200/85 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[92vh]">
              {/* Top Sticky Header */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200/85 flex items-center justify-between gap-3 bg-white/85 backdrop-blur-xl shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-700 truncate">
                    {specs.gst_badge}
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate mt-0.5">
                    {selectedStoreAccessory.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStoreAccessory(null);
                    setStoreAccZoomOpen(false);
                  }}
                  aria-label="Close accessory showcase"
                  className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-100/85 hover:bg-slate-100/85 text-slate-700 hover:text-slate-900 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Balanced Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: Contained Photo Stage + Thumbnails */}
                  <div className="lg:col-span-5 space-y-3">
                    <div
                      onClick={() => setStoreAccZoomOpen(true)}
                      className="relative w-full h-[220px] sm:h-[260px] lg:h-[300px] rounded-2xl bg-white/85 backdrop-blur-xl border border-red-200/90 overflow-hidden flex items-center justify-center cursor-zoom-in group"
                    >
                      <img
                        src={activePhoto}
                        alt={selectedStoreAccessory.title}
                        className="max-w-full max-h-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_SHOWROOM_IMAGE;
                        }}
                      />
                      <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/85 border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap">
                        <ZoomIn className="w-3.5 h-3.5 text-sky-700" />
                        <span>Tap for big review &amp; zoom</span>
                      </span>

                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStoreAccPhotoIdx((safeIdx - 1 + photos.length) % photos.length);
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 cursor-pointer"
                            aria-label="Previous photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStoreAccPhotoIdx((safeIdx + 1) % photos.length);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 cursor-pointer"
                            aria-label="Next photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {photos.length > 1 && (
                      <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                        {photos.map((pUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setStoreAccPhotoIdx(idx)}
                            className={`w-14 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                              idx === safeIdx
                                ? 'border-red-200/90 ring-2 ring-red-500/40'
                                : 'border-slate-200/85 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={pUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/85 backdrop-blur-xl border border-slate-200/85 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Website Stock</div>
                        <div className={`text-sm font-black font-mono ${remQty < 10 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {remQty === 0 ? 'Sold Out (0)' : `${remQty} Remaining`}
                        </div>
                      </div>
                      <div className="border-l border-slate-200/85">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Units Dispatched</div>
                        <div className="text-sm font-black font-mono text-amber-800">
                          {soldQty} Sold
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price Banner + 2x2 Showcase Cards */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-red-200/90 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                          {selectedStoreAccessory.title}
                        </div>
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mt-0.5">
                          {specs.gst_badge}
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tabular-nums shrink-0">
                        {formatPrice(selectedStoreAccessory.price)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50/90 border border-red-200/90 text-red-600 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-wider text-red-600">
                            VERIFIED FITMENT
                          </div>
                          <div className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                            {selectedStoreAccessory.compatibility_models?.length
                              ? selectedStoreAccessory.compatibility_models.slice(0, 3).join(' / ')
                              : 'Universal Superbike Fitment'}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{specs.fitment_note}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-700 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                            TECHNICAL BUILD &amp; MATERIAL
                          </div>
                          <div className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                            {specs.material_spec}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{specs.material_detail}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 leading-snug">{specs.workshop_title}</div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{specs.workshop_detail}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50/90 border border-blue-200/90 text-blue-600 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 leading-snug">{specs.delivery_title}</div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{specs.delivery_detail}</p>
                        </div>
                      </div>
                    </div>

                    {selectedStoreAccessory.description && (
                      <div className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/85 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {selectedStoreAccessory.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-4 py-3.5 sm:px-6 border-t border-slate-200/85 bg-white/85 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="truncate">{specs.authenticity_note}</span>
                </div>
                <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                  <a
                    href={formatTelHref(accessoriesPhone)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/85 text-slate-900 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Call Concierge</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      accessoriesPhone,
                      `Hello Adarsh Motors Accessories Desk, I want to order ${selectedStoreAccessory.title} (${formatPrice(selectedStoreAccessory.price)}).`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>Order on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Storefront Big Review & Zoom Lightbox */}
      {selectedStoreAccessory && storeAccZoomOpen && (() => {
        const photos =
          selectedStoreAccessory.gallery_urls && selectedStoreAccessory.gallery_urls.length > 0
            ? selectedStoreAccessory.gallery_urls
            : [selectedStoreAccessory.image_url];
        const safeIdx = Math.min(storeAccPhotoIdx, Math.max(0, photos.length - 1));
        const activePhoto = normalizeLocalAssetUrl(
          photos[safeIdx] || selectedStoreAccessory.image_url,
          FALLBACK_SHOWROOM_IMAGE
        );
        return (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-slate-100/90 backdrop-blur-lg">
            <div className="w-full max-w-5xl flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 text-slate-900">
                <div className="min-w-0">
                  <h4 className="font-black text-base sm:text-lg truncate">{selectedStoreAccessory.title}</h4>
                  <div className="text-xs font-mono text-slate-600">
                    Photo {safeIdx + 1} of {photos.length}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStoreAccZoomOpen(false)}
                  className="min-h-[38px] min-w-[38px] p-2 rounded-full bg-slate-100/85 hover:bg-white/25 text-slate-900 cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Close zoom view"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative w-full h-[65vh] sm:h-[75vh] bg-black rounded-2xl border border-white/15 flex items-center justify-center overflow-hidden">
                <img
                  src={activePhoto}
                  alt={selectedStoreAccessory.title}
                  className="max-w-full max-h-full object-contain p-2"
                />
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStoreAccPhotoIdx((safeIdx - 1 + photos.length) % photos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoreAccPhotoIdx((safeIdx + 1) % photos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  if (standalonePage) {
    return (
      <div className="min-h-screen bg-transparent">
        {storefrontBody}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-100/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-6xl bg-white/85 backdrop-blur-xl border border-slate-200/85 rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/85 flex items-center justify-between bg-white/85 backdrop-blur-xl flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Synced directly to itmarysfybhcrmvnggyy.supabase.co</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                Customer Storefront Preview
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Switch: Live Connected Storefront vs Legacy Netlify URL */}
            <div className="flex items-center p-1 bg-slate-50/90 rounded-xl border border-slate-200/85">
              <button
                type="button"
                onClick={() => setPreviewTab('connected')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold cursor-pointer transition ${
                  previewTab === 'connected' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Connected Live View
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('external')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold cursor-pointer transition ${
                  previewTab === 'external' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                External Netlify URL
              </button>
            </div>

            {/* Mobile / Desktop Frame Toggle */}
            <div className="flex items-center p-1 bg-slate-50/90 rounded-xl border border-slate-200/85">
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer ${
                  deviceMode === 'mobile' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer ${
                  deviceMode === 'desktop' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Desktop</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/85 text-slate-900 text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden md:inline">{copied ? 'Copied' : 'Copy URL'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Storefront Preview"
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-100/85 hover:bg-slate-100/85 text-slate-700 hover:text-slate-900 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Honest Sync Diagnostic Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-sky-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
              {previewTab === 'connected' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div>
                {previewTab === 'connected' ? (
                  <>
                    <div className="font-bold text-slate-900">
                      Connected Live Storefront — Reflects All Admin Edits Immediately
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Showing {visibleBikes.length} live bikes, {visibleAccessories.length} accessories, and {activeBranches.length} branches from{' '}
                      <code className="text-sky-700 font-mono">itmarysfybhcrmvnggyy.supabase.co</code>
                      {lastSyncedAt ? ` · Refreshed ${lastSyncedAt}` : ''}. (Note: external{' '}
                      <span className="font-mono text-amber-800">adarsh-motors-site.netlify.app</span> is still hardcoded to an old offline database <span className="font-mono">nwdgayanhwzxivqlspdd</span> and must be redeployed with this Supabase URL to update externally.)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-amber-800">
                      External Netlify Deployment Diagnostic
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      The external deployment at <span className="font-mono text-slate-900">{liveUrl}</span> is pointing to old offline Supabase URL <code className="text-amber-800 font-mono">nwdgayanhwzxivqlspdd.supabase.co</code>, so Admin saves to <code className="text-sky-700 font-mono">itmarysfybhcrmvnggyy.supabase.co</code> will not appear there until that Netlify HTML file is updated. Use <strong>Connected Live View</strong> above to test live Admin ↔ Customer sync right now.
                    </p>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                previewTab === 'connected' ? fetchLiveStorefrontData() : setIframeKey((k) => k + 1)
              }
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/85 text-xs font-bold text-sky-700 flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStore ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {dbError && previewTab === 'connected' && (
            <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-800">
              Partial Supabase warning: {dbError} (showing cached & live merged items).
            </div>
          )}

          {/* Device Viewport Container */}
          <div
            className={`mx-auto bg-white/85 backdrop-blur-xl rounded-3xl border-2 border-slate-200/85 overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
              deviceMode === 'mobile'
                ? 'w-full max-w-[400px] h-[66vh] min-h-[420px]'
                : 'w-full h-[66vh] min-h-[420px]'
            }`}
          >
            {deviceMode === 'mobile' && (
              <div className="bg-white/85 backdrop-blur-xl py-2 px-4 flex items-center justify-between border-b border-slate-200/85 select-none shrink-0">
                <span className="text-xs font-mono text-slate-600">390px Preview</span>
                <div className="w-16 h-3.5 bg-black rounded-full border border-white/10" />
                <span className="text-xs font-mono text-emerald-600">Live Sync</span>
              </div>
            )}

            {previewTab === 'connected' ? (
              <div className="flex-1 overflow-y-auto">{storefrontBody}</div>
            ) : (
              <iframe
                key={iframeKey}
                src={liveUrl}
                title="Customer External Website"
                className="w-full flex-1 border-0 bg-white/85 backdrop-blur-xl"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200/85 bg-white/85 backdrop-blur-xl flex items-center justify-between flex-wrap gap-2.5">
          <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
            <span>Shareable Storefront Hash URL:</span>
            <a
              href="#showroom"
              onClick={(e) => {
                e.preventDefault();
                setPreviewTab('connected');
              }}
              className="text-sky-700 font-mono hover:underline"
            >
              #showroom
            </a>
            <span className="text-slate-500">|</span>
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-700 font-mono hover:text-slate-900 inline-flex items-center gap-1 break-all"
            >
              <span>{liveUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
