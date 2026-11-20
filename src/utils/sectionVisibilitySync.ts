import type { SupabaseClient } from '@supabase/supabase-js';
import type { SiteSettings, HeroSlideItem } from '../App';

export type WebsiteSectionKey =
  | 'enableInventoryFleet'
  | 'enableBudgetBikesSection'
  | 'enableAccessoriesSection'
  | 'enableWorkshopBooking'
  | 'enableSellBike'
  | 'enableTestRide'
  | 'enableEmiCalculator'
  | 'enableCustomerHub'
  | 'bannerActive'
  | 'enableBranchLocations'
  | 'enableCommunityRides'
  | 'enableInvoicePricePublic'
  | 'enableInvoicePriceView';

export const SECTION_SETTING_KEY_MAP: Record<
  WebsiteSectionKey,
  { showKey: string; sectionKey?: string; label: string }
> = {
  enableInventoryFleet: {
    showKey: 'show_showroom',
    sectionKey: 'section_fleet',
    label: 'Superbikes Fleet',
  },
  enableBudgetBikesSection: {
    showKey: 'show_budget_bikes',
    sectionKey: 'section_budget_bikes',
    label: 'Budget Bikes & Commuters Fleet',
  },
  enableAccessoriesSection: {
    showKey: 'show_accessories',
    sectionKey: 'section_accessories',
    label: 'Superbike Accessories Catalog',
  },
  enableWorkshopBooking: {
    showKey: 'show_workshop',
    sectionKey: 'section_service',
    label: 'Workshop & Dyno Booking',
  },
  enableSellBike: {
    showKey: 'show_sell_bike',
    sectionKey: 'section_sell',
    label: 'Exchange / Sell Bike',
  },
  enableTestRide: {
    showKey: 'show_test_ride',
    sectionKey: 'section_test_ride',
    label: 'Test Ride Booking',
  },
  enableEmiCalculator: {
    showKey: 'show_loan_valuation',
    sectionKey: 'section_finance',
    label: 'Finance & EMI Calculator',
  },
  enableCustomerHub: {
    showKey: 'show_customer_hub',
    sectionKey: 'section_customer_hub',
    label: 'Buyer Ownership Portal',
  },
  bannerActive: {
    showKey: 'show_banner',
    label: 'Top Promo Ticker Banner',
  },
  enableBranchLocations: {
    showKey: 'show_branches',
    sectionKey: 'section_branches',
    label: 'Showroom Locations',
  },
  enableCommunityRides: {
    showKey: 'show_community',
    sectionKey: 'section_community',
    label: 'VIP Riders Community',
  },
  enableInvoicePricePublic: {
    showKey: 'show_invoice_price_public',
    label: 'Digital Invoice Price (Public View)',
  },
  enableInvoicePriceView: {
    showKey: 'show_invoice_price_view',
    label: 'Digital Invoice Price Section (View)',
  },
};

export const SECTION_PHONE_KEY_MAP: Array<{
  field: keyof SiteSettings;
  dbKey: string;
}> = [
  { field: 'salesPhone', dbKey: 'contact_phone' },
  { field: 'whatsapp', dbKey: 'phone_whatsapp' },
  { field: 'superbikesPhone', dbKey: 'phone_superbikes' },
  { field: 'budgetBikesPhone', dbKey: 'phone_budget_bikes' },
  { field: 'accessoriesPhone', dbKey: 'phone_accessories' },
  { field: 'servicePhone', dbKey: 'phone_service' },
  { field: 'tradeInPhone', dbKey: 'phone_trade_in' },
  { field: 'testRidePhone', dbKey: 'phone_test_ride' },
  { field: 'financePhone', dbKey: 'phone_finance' },
  { field: 'billingPhone', dbKey: 'phone_billing' },
  { field: 'branchesPhone', dbKey: 'phone_branches' },
  { field: 'communityPhone', dbKey: 'phone_community' },
  { field: 'rsaPhone', dbKey: 'phone_rsa' },
  { field: 'ownerPhone', dbKey: 'phone_owner' },
];

export type SpecializedLeadCategory =
  | 'exchange_leads'
  | 'loan_leads'
  | 'service_leads'
  | 'accessories_leads';

export function matchesSpecializedLeadCategory(
  lead: any,
  category: SpecializedLeadCategory
): boolean {
  if (!lead) return false;
  const serviceText = `${lead.service_type || ''} ${lead.type || ''}`.toLowerCase();
  const detailText = `${lead.bike_interested || ''} ${lead.bike_model || ''} ${lead.message || ''} ${lead.notes || ''}`.toLowerCase();
  const combined = `${serviceText} ${detailText}`;

  const isExplicitAccessory =
    serviceText.includes('accessor') ||
    serviceText.includes('riding gear') ||
    serviceText.includes('gear') ||
    serviceText.includes('helmet') ||
    serviceText.includes('exhaust');

  if (category === 'accessories_leads') {
    if (isExplicitAccessory) {
      return true;
    }
    return (
      detailText.includes('akrapov') ||
      detailText.includes('dainese') ||
      detailText.includes('brembo') ||
      detailText.includes('evotech') ||
      detailText.includes('puig') ||
      detailText.includes('quad lock') ||
      detailText.includes('riding suit') ||
      detailText.includes('riding jacket') ||
      detailText.includes('helmet') ||
      detailText.includes('gloves') ||
      detailText.includes('frame slider') ||
      detailText.includes('windscreen') ||
      detailText.includes('accessory') ||
      detailText.includes('accessories') ||
      detailText.includes('riding gear')
    );
  }

  if (category === 'exchange_leads') {
    if (
      serviceText.includes('sell') ||
      serviceText.includes('exchange') ||
      serviceText.includes('trade') ||
      serviceText.includes('valuation') ||
      serviceText.includes('extend')
    ) {
      return true;
    }
    return (
      detailText.includes('sell my bike') ||
      detailText.includes('sell / exchange') ||
      detailText.includes('sell/exchange') ||
      detailText.includes('trade-in') ||
      detailText.includes('trade in') ||
      detailText.includes('exchange quotation') ||
      detailText.includes('valuation')
    );
  }

  if (category === 'loan_leads') {
    if (
      serviceText.includes('loan') ||
      serviceText.includes('finance') ||
      serviceText.includes('emi') ||
      serviceText.includes('credit')
    ) {
      return true;
    }
    return (
      combined.includes('loan process') ||
      combined.includes('apply for loan') ||
      combined.includes('down payment') ||
      combined.includes('finance scheme') ||
      combined.includes('emi plan') ||
      combined.includes('hdfc') ||
      combined.includes('icici') ||
      combined.includes('bajaj finserv')
    );
  }

  if (category === 'service_leads') {
    if (isExplicitAccessory) return false;
    if (
      serviceText.includes('service') ||
      serviceText.includes('workshop') ||
      serviceText.includes('dyno') ||
      serviceText.includes('repair') ||
      serviceText.includes('maintenance') ||
      serviceText.includes('tuning') ||
      serviceText.includes('pdi')
    ) {
      return true;
    }
    return (
      detailText.includes('book service') ||
      detailText.includes('service slot') ||
      detailText.includes('dyno') ||
      detailText.includes('oil flush') ||
      detailText.includes('servicing') ||
      detailText.includes('workshop') ||
      detailText.includes('repair')
    );
  }

  return false;
}

export function broadcastLiveSync(
  type: 'settings' | 'branches' | 'bikes' | 'accessories' | 'leads',
  payload?: any
) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('adarsh:live-sync', { detail: { type, payload, ts: Date.now() } })
    );
  } catch {}
  try {
    if ('BroadcastChannel' in window) {
      const ch = new BroadcastChannel('adarsh_live_sync');
      ch.postMessage({ type, payload, ts: Date.now() });
      ch.close();
    }
  } catch {}
}

export function formatTelHref(phone?: string, fallback = '+919014540489'): string {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '');
  if (!cleaned) return `tel:${String(fallback).replace(/[^\d+]/g, '')}`;
  return `tel:${cleaned}`;
}

export function formatCompactINR(rawVal: number | string | null | undefined): string {
  const cleaned = typeof rawVal === 'number'
    ? rawVal
    : parseFloat(String(rawVal ?? '').replace(/[^\d.-]/g, ''));
  const num = Number.isFinite(cleaned) ? cleaned : 0;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 10000000) {
    const cr = abs / 10000000;
    return `${sign}₹${cr >= 10 ? cr.toFixed(1) : cr.toFixed(2).replace(/\.?0+$/, '')}Cr`;
  }
  if (abs >= 100000) {
    const l = abs / 100000;
    return `${sign}₹${l >= 10 ? l.toFixed(1) : l.toFixed(2).replace(/\.?0+$/, '')}L`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}₹${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

export function formatWhatsAppDigits(phone?: string, fallback = '919014540489'): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return fallback;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppUrl(
  phone?: string,
  message?: string,
  fallback = '919014540489'
): string {
  const waDigits = formatWhatsAppDigits(phone, fallback);
  if (message && message.trim()) {
    return `https://wa.me/${waDigits}?text=${encodeURIComponent(message.trim())}`;
  }
  return `https://wa.me/${waDigits}`;
}

export function normalizeBikeCategory(raw?: string | null): string {
  const c = String(raw || '').toLowerCase().trim();
  if (!c) return '';
  if (c === 'mid range' || c === 'midrange' || c === 'mid-range' || c === 'medium range' || c === 'medium-range') {
    return 'mid-range';
  }
  if (c === 'superbikes' || c === 'superbike') return 'superbike';
  if (c === 'cruisers' || c === 'cruiser') return 'cruiser';
  if (c === 'scooters' || c === 'scooter' || c === 'moped') return 'scooter';
  if (c === 'commuters' || c === 'commuter') return 'commuter';
  if (c === 'budget' || c === 'budget bike' || c === 'budget bikes') return 'budget';
  if (c === 'luxury' || c === 'luxury bike' || c === 'luxury bikes') return 'luxury';
  if (c === 'adventure' || c === 'adventure tourer' || c === 'adventure tourers') return 'adventure';
  return c;
}

/**
 * Canonicalizes bike categories to the exact tab names used on the live Customer Website
 * (`Superbikes`, `Cruisers`, `Adventure`, `Luxury`, `Mid-Range`, `Scooters`).
 */
export function canonicalizeBikeCategory(
  raw?: string | null,
  segment?: 'superbikes' | 'budget'
): string {
  const trimmed = String(raw || '').trim();
  const norm = normalizeBikeCategory(trimmed);
  if (!norm) return segment === 'budget' ? 'Mid-Range' : 'Superbikes';
  if (norm === 'superbike') return 'Superbikes';
  if (norm === 'cruiser') return 'Cruisers';
  if (norm === 'adventure') return 'Adventure';
  if (norm === 'luxury') return 'Luxury';
  if (norm === 'scooter') return 'Scooters';
  if (norm === 'mid-range' || norm === 'budget' || norm === 'commuter') return 'Mid-Range';
  return trimmed;
}

export function matchesBikeCategoryFilter(
  bikeCategory?: string | null,
  filterCategory?: string | null
): boolean {
  const filterClean = String(filterCategory || '').trim();
  if (!filterClean || filterClean.toUpperCase() === 'ALL') return true;
  const bNorm = normalizeBikeCategory(bikeCategory);
  const fNorm = normalizeBikeCategory(filterClean);
  if (bNorm === fNorm) return true;
  const midRangeGroup = new Set(['mid-range', 'budget', 'commuter']);
  if (midRangeGroup.has(fNorm) && midRangeGroup.has(bNorm)) return true;
  return false;
}

export async function normalizeExistingBikeCategoriesInSupabase(
  supabase: SupabaseClient,
  rows: any[]
): Promise<void> {
  if (!supabase || !Array.isArray(rows) || rows.length === 0) return;
  try {
    const updates = rows
      .filter((r) => r && r.id != null && !isAccessoryItem(r))
      .map((r) => {
        const current = String(r.category || '').trim();
        const canonical = canonicalizeBikeCategory(current);
        return current !== canonical ? { id: r.id, canonical } : null;
      })
      .filter(Boolean) as Array<{ id: string | number; canonical: string }>;

    if (updates.length === 0) return;
    await Promise.allSettled(
      updates.map((u) =>
        supabase.from('bikes').update({ category: u.canonical }).eq('id', String(u.id))
      )
    );
  } catch (err) {
    console.warn('Background bike category normalization skipped:', err);
  }
}

const ACCESSORY_CATEGORY_KEYWORDS = new Set([
  'accessories',
  'accessory',
  'riding gear',
  'riding gear & protection',
  'exhaust & performance',
  'chassis & sliders',
  'carbon & aerodynamics',
  'braking & controls',
  'luggage & mounts',
  'fluids & maintenance',
]);

export function isAccessoryItem(row: any): boolean {
  if (!row) return false;
  const idStr = String(row.id || '').toLowerCase().trim();
  if (idStr.startsWith('acc_')) return true;

  const cat = String(row.category || '').toLowerCase().trim();
  if (ACCESSORY_CATEGORY_KEYWORDS.has(cat) || cat.includes('accessor')) {
    return true;
  }

  const badge = String(row.badge || '').toUpperCase().trim();
  const km = String(row.km || '').toLowerCase();
  if (badge === 'ACCESSORY') return true;
  if (/\d+\s*remaining\s*[·•-]\s*\d+\s*sold/i.test(km)) return true;
  if ((badge === 'CRITICAL <5' || badge === 'LOW <10') && String(row.fuel || '').toUpperCase() === 'N/A') {
    return true;
  }

  return false;
}

export async function purgeAccessoriesFromBikesTable(
  supabase: SupabaseClient,
  extraIds: string[] = [],
  extraTitles: string[] = []
): Promise<void> {
  if (!supabase) return;
  try {
    // Delete any rows synced into bikes with acc_ prefix, Accessories/Riding Gear category, or ACCESSORY badge
    await Promise.allSettled([
      supabase.from('bikes').delete().ilike('id', 'acc_%'),
      supabase.from('bikes').delete().in('category', [
        'Accessories',
        'accessories',
        'Accessory',
        'accessory',
        'Riding Gear',
        'Riding Gear & Protection',
        'Exhaust & Performance',
        'Chassis & Sliders',
        'Carbon & Aerodynamics',
        'Braking & Controls',
        'Luggage & Mounts',
        'Fluids & Maintenance',
      ]),
      supabase.from('bikes').delete().eq('badge', 'ACCESSORY'),
    ]);

    const cleanIds = Array.from(new Set(extraIds.map((id) => String(id || '').trim()).filter(Boolean)));
    if (cleanIds.length > 0) {
      await supabase.from('bikes').delete().in('id', cleanIds);
    }

    const cleanTitles = Array.from(new Set(extraTitles.map((t) => String(t || '').trim()).filter(Boolean)));
    if (cleanTitles.length > 0) {
      await supabase.from('bikes').delete().in('name', cleanTitles);
    }
  } catch (err) {
    console.warn('Cleanup of accessory rows in bikes table failed:', err);
  }
}

export function isBudgetVehicleCategory(
  category?: string,
  price?: number | string,
  name?: string
): boolean {
  const rawCat = String(category || '').toLowerCase().trim();
  const normCat = normalizeBikeCategory(category);
  const title = String(name || '').toLowerCase().trim();

  if (
    normCat === 'budget' ||
    normCat === 'mid-range' ||
    normCat === 'commuter' ||
    normCat === 'scooter' ||
    rawCat.includes('budget') ||
    rawCat.includes('mid-range') ||
    rawCat.includes('mid range') ||
    rawCat.includes('commuter') ||
    rawCat.includes('scooter')
  ) {
    return true;
  }

  if (
    normCat === 'superbike' ||
    normCat === 'cruiser' ||
    normCat === 'luxury' ||
    normCat === 'adventure' ||
    rawCat.includes('superbike') ||
    rawCat.includes('cruiser') ||
    rawCat.includes('luxury')
  ) {
    return false;
  }

  // Check luxury / superbike keywords in model name if category isn't explicit
  const superbikeKeywords = [
    'superbike',
    'luxury',
    'tenor',
    'tenere',
    'ducati',
    'panigale',
    'diavel',
    'multistrada',
    'bmw',
    's1000',
    'gs',
    'kawasaki',
    'ninja',
    'zx10',
    'z900',
    'hayabusa',
    'triumph',
    'harley',
    'goldwing',
    'fireblade',
    'r1',
    'aprilia',
    'mv agusta',
  ];
  if (superbikeKeywords.some((kw) => title.includes(kw))) {
    return false;
  }

  const budgetKeywords = [
    'budget',
    'mid-range',
    'mid range',
    'commuter',
    'scooter',
    'scooters',
    'activa',
    'access',
    'jupiter',
    'splendor',
    'pulsar',
    'apache',
    'fz',
    'shine',
    'raider',
    'unicorn',
    'sp125',
    'ns160',
    'ns200',
    'mt15',
  ];
  if (budgetKeywords.some((kw) => title.includes(kw))) {
    return true;
  }

  const numPrice =
    typeof price === 'number'
      ? price
      : parseFloat(String(price || '').replace(/[^\d.]/g, ''));
  return !isNaN(numPrice) && numPrice > 0 && numPrice <= 300000;
}

export type EnquirySegment =
  | 'superbike'
  | 'budget'
  | 'accessories'
  | 'service'
  | 'trade_in'
  | 'test_ride'
  | 'finance'
  | 'billing'
  | 'branches'
  | 'community'
  | 'general'
  | (string & {});

export function resolveEnquiryContact(
  settings: Partial<SiteSettings> | undefined,
  segment: EnquirySegment,
  bikeName?: string
): { segment: EnquirySegment; deskLabel: string; phone: string; waUrlPrefix: string } {
  const salesFallback = settings?.salesPhone || '+91 9014540489';

  const knownSegments = new Set([
    'superbike',
    'budget',
    'accessories',
    'service',
    'trade_in',
    'test_ride',
    'finance',
    'billing',
    'branches',
    'community',
    'general',
  ]);

  // Auto-detect segment diversion when general or custom manual text is entered
  let resolvedSegment: EnquirySegment = segment;
  if ((segment === 'general' || !knownSegments.has(segment)) && (bikeName || segment)) {
    const combinedText = [segment !== 'general' ? segment : '', bikeName || ''].filter(Boolean).join(' ');
    resolvedSegment = isBudgetVehicleCategory(undefined, undefined, combinedText)
      ? 'budget'
      : 'superbike';
  }

  const map: Record<string, { deskLabel: string; phone: string }> = {
    superbike: {
      deskLabel: 'Superbikes & Luxury Bikes Desk',
      phone: settings?.superbikesPhone || salesFallback,
    },
    budget: {
      deskLabel: 'Budget Bikes & Commuters Desk',
      phone: settings?.budgetBikesPhone || salesFallback,
    },
    accessories: {
      deskLabel: 'Accessories & Riding Gear Desk',
      phone: settings?.accessoriesPhone || salesFallback,
    },
    service: {
      deskLabel: 'Service, Workshop & Dyno Desk',
      phone: settings?.servicePhone || '+91 9848012345',
    },
    trade_in: {
      deskLabel: 'Sell / Exchange Valuation Desk',
      phone: settings?.tradeInPhone || salesFallback,
    },
    test_ride: {
      deskLabel: 'VIP Test Ride Booking Desk',
      phone: settings?.testRidePhone || salesFallback,
    },
    finance: {
      deskLabel: 'Finance & EMI Approval Desk',
      phone: settings?.financePhone || salesFallback,
    },
    billing: {
      deskLabel: 'RTO, Billing & Ownership Desk',
      phone: settings?.billingPhone || '+91 9849112233',
    },
    branches: {
      deskLabel: 'Showroom Branches Desk',
      phone: settings?.branchesPhone || salesFallback,
    },
    community: {
      deskLabel: 'VIP Riders Club Desk',
      phone: settings?.communityPhone || salesFallback,
    },
    general: {
      deskLabel: 'Official Showroom & WhatsApp Desk',
      phone: settings?.whatsapp || salesFallback,
    },
  };

  const target = map[resolvedSegment] || map.general;
  return {
    segment: resolvedSegment,
    deskLabel: target.deskLabel,
    phone: target.phone,
    waUrlPrefix: buildWhatsAppUrl(target.phone),
  };
}

export const FALLBACK_SHOWROOM_IMAGE = '/assets/aistudio/image_f4045ab9.png';

/**
 * Repairs legacy `/public/assets/...` paths, missing placeholder file names, or blocked remote stock URLs
 * so images always resolve cleanly from Vite's `public/` root.
 */
export function normalizeLocalAssetUrl(raw?: string | null, fallback = FALLBACK_SHOWROOM_IMAGE): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('/public/')) {
    return trimmed.replace(/^\/public/, '');
  }
  if (
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('image_5a6010cd.png') ||
    trimmed.includes('image_f406ab38.png')
  ) {
    return fallback;
  }
  return trimmed;
}

export function normalizeHeroSlides(rawSlides: any[], fallbackSlides: HeroSlideItem[]): HeroSlideItem[] {
  if (!Array.isArray(rawSlides) || rawSlides.length === 0) return fallbackSlides;
  return rawSlides.map((s: any, idx: number) => {
    const fallback = fallbackSlides[idx] || fallbackSlides[0];
    const hasSubtitle = s?.subtitle !== undefined && s?.subtitle !== null;
    const hasDesc = s?.description !== undefined && s?.description !== null;
    const subtitle = hasSubtitle
      ? String(s.subtitle)
      : hasDesc
      ? String(s.description)
      : String(fallback?.subtitle ?? '');

    const hasBtnText = s?.buttonText !== undefined && s?.buttonText !== null;
    const hasCtaText = s?.ctaText !== undefined && s?.ctaText !== null;
    const buttonText = hasBtnText
      ? String(s.buttonText)
      : hasCtaText
      ? String(s.ctaText)
      : String(fallback?.buttonText ?? fallback?.ctaText ?? 'Explore Inventory');

    const slug =
      s?.slug !== undefined && s?.slug !== null && String(s.slug).trim() !== ''
        ? String(s.slug)
        : fallback?.slug;

    const secondaryText =
      s?.secondaryText !== undefined && s?.secondaryText !== null
        ? String(s.secondaryText)
        : fallback?.secondaryText;

    return {
      id: Number(s?.id) || idx + 1,
      ...(slug ? { slug } : {}),
      badge: s?.badge !== undefined && s?.badge !== null ? String(s.badge) : String(fallback?.badge ?? 'Certified Fleet · Live Inventory'),
      title: s?.title !== undefined && s?.title !== null ? String(s.title) : String(fallback?.title ?? 'Pure Superbike Excellence.'),
      subtitle,
      description: subtitle,
      image: normalizeLocalAssetUrl(s?.image, fallback?.image || FALLBACK_SHOWROOM_IMAGE),
      buttonText,
      ctaText: buttonText,
      ...(secondaryText !== undefined ? { secondaryText } : {}),
      buttonTarget: s?.buttonTarget !== undefined && s?.buttonTarget !== null ? String(s.buttonTarget) : String(fallback?.buttonTarget ?? '#inventory'),
      isActive: s?.isActive !== false && s?.is_active !== false,
    } as HeroSlideItem;
  });
}

export function buildSectionVisibilityPayload(s: SiteSettings) {
  return {
    enableInventoryFleet: Boolean(s.enableInventoryFleet),
    enableBudgetBikesSection: s.enableBudgetBikesSection !== false,
    enableAccessoriesSection: Boolean(s.enableAccessoriesSection),
    enableWorkshopBooking: Boolean(s.enableWorkshopBooking),
    enableSellBike: Boolean(s.enableSellBike),
    enableExchangeBike: Boolean(s.enableSellBike),
    enableTestRide: Boolean(s.enableTestRide),
    enableEmiCalculator: Boolean(s.enableEmiCalculator),
    enableFinanceEmi: Boolean(s.enableEmiCalculator),
    enableCustomerHub: Boolean(s.enableCustomerHub),
    enableCustomerDocHub: Boolean(s.enableCustomerHub),
    enableBranchLocations: Boolean(s.enableBranchLocations),
    enableShowroomBranches: Boolean(s.enableBranchLocations),
    enableCommunityRides: Boolean(s.enableCommunityRides),
    bannerActive: Boolean(s.bannerActive),
    enablePromoBanner: Boolean(s.bannerActive),
    enableInvoicePricePublic: Boolean(s.enableInvoicePricePublic),
    enableInvoicePriceView: Boolean(s.enableInvoicePriceView),
  };
}

function parseBoolFlag(raw: any): boolean | undefined {
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true' || raw === 1 || raw === '1') return true;
  if (raw === 'false' || raw === 0 || raw === '0') return false;
  if (raw && typeof raw === 'object' && 'enabled' in raw) {
    return Boolean(raw.enabled);
  }
  return undefined;
}

function parseScalarString(raw: any): string | undefined {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'number') return String(raw);
  if (raw && typeof raw === 'object' && typeof raw.value === 'string' && raw.value.trim()) {
    return raw.value.trim();
  }
  return undefined;
}

export function hydrateSettingsFromRows(
  rows: any[],
  baseSettings: SiteSettings
): SiteSettings {
  if (!Array.isArray(rows) || rows.length === 0) return baseSettings;

  let merged: SiteSettings = { ...baseSettings };

  const findRow = (key: string) =>
    rows.find((r) => String(r?.key || '') === key);

  const parseJson = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return typeof val === 'object' ? val : null;
  };

  let hasConfigSlides = false;
  const applyConfigRow = (row: any) => {
    if (!row) return;
    const valObj = parseJson(row.value);
    if (valObj) {
      merged = { ...merged, ...valObj };
      if (Array.isArray(valObj.heroSlides) && valObj.heroSlides.length > 0) {
        hasConfigSlides = true;
      }
      if (typeof valObj.enableExchangeBike === 'boolean' && valObj.enableSellBike === undefined) {
        merged.enableSellBike = valObj.enableExchangeBike;
      }
      if (typeof valObj.enableFinanceEmi === 'boolean' && valObj.enableEmiCalculator === undefined) {
        merged.enableEmiCalculator = valObj.enableFinanceEmi;
      }
      if (typeof valObj.enableCustomerDocHub === 'boolean' && valObj.enableCustomerHub === undefined) {
        merged.enableCustomerHub = valObj.enableCustomerDocHub;
      }
      if (typeof valObj.enablePromoBanner === 'boolean' && valObj.bannerActive === undefined) {
        merged.bannerActive = valObj.enablePromoBanner;
      }
      if (typeof valObj.enableShowroomBranches === 'boolean' && valObj.enableBranchLocations === undefined) {
        merged.enableBranchLocations = valObj.enableShowroomBranches;
      }
    }
    if (row.phone) merged.salesPhone = String(row.phone);
    if (row.instagram) merged.instagram = String(row.instagram);
    const slides = parseJson(row.hero_slides);
    if (Array.isArray(slides) && slides.length > 0) {
      hasConfigSlides = true;
      merged.heroSlides = normalizeHeroSlides(slides, baseSettings.heroSlides);
    }
  };

  // Apply global_config / site_config / general ordered by updated_at ascending so the newest row wins
  const configRows = [
    findRow('site_config'),
    findRow('global_config'),
    findRow('general'),
  ]
    .filter(Boolean)
    .sort((a: any, b: any) => {
      const ta = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
      return ta - tb;
    });

  configRows.forEach(applyConfigRow);

  // Per-section phone rows (authoritative if newer or explicitly stored)
  const latestConfigTs = configRows.reduce((max, r: any) => {
    const t = r?.updated_at ? new Date(r.updated_at).getTime() : 0;
    return t > max ? t : max;
  }, 0);

  SECTION_PHONE_KEY_MAP.forEach(({ field, dbKey }) => {
    const row = findRow(dbKey);
    if (!row) return;
    const rowTs = row?.updated_at ? new Date(row.updated_at).getTime() : 0;
    const parsed = parseScalarString(row.value);
    if (parsed && (rowTs >= latestConfigTs || !(merged as any)[field])) {
      (merged as any)[field] = parsed;
    }
  });

  // Backfill new per-section phone fields from salesPhone if missing
  if (!merged.superbikesPhone) merged.superbikesPhone = merged.salesPhone;
  if (!merged.budgetBikesPhone) merged.budgetBikesPhone = merged.salesPhone;
  if (!merged.accessoriesPhone) merged.accessoriesPhone = merged.salesPhone;
  if (!merged.testRidePhone) merged.testRidePhone = merged.salesPhone;
  if (!merged.financePhone) merged.financePhone = merged.salesPhone;
  if (!merged.branchesPhone) merged.branchesPhone = merged.salesPhone;
  if (!merged.communityPhone) merged.communityPhone = merged.salesPhone;

  // Dedicated hero_slides row (use whichever is newer between hero_slides row and configRows)
  const heroRow = findRow('hero_slides');
  const heroVal = parseJson(heroRow?.value);
  const heroRowTs = heroRow?.updated_at ? new Date(heroRow.updated_at).getTime() : 0;
  if (Array.isArray(heroVal) && heroVal.length > 0 && (!hasConfigSlides || heroRowTs >= latestConfigTs)) {
    merged.heroSlides = normalizeHeroSlides(heroVal, baseSettings.heroSlides);
  } else {
    merged.heroSlides = normalizeHeroSlides(merged.heroSlides, baseSettings.heroSlides);
  }

  // section_visibility map row
  const visRow = findRow('section_visibility');
  const visVal = parseJson(visRow?.value);
  if (visVal) {
    (Object.keys(SECTION_SETTING_KEY_MAP) as WebsiteSectionKey[]).forEach(
      (secKey) => {
        if (secKey in visVal) {
          const parsed = parseBoolFlag(visVal[secKey]);
          if (parsed !== undefined) {
            merged[secKey] = parsed;
          }
        }
      }
    );
  }

  // Individual show_* and section_* rows override safely
  (Object.keys(SECTION_SETTING_KEY_MAP) as WebsiteSectionKey[]).forEach(
    (secKey) => {
      const mapping = SECTION_SETTING_KEY_MAP[secKey];
      const showRow = findRow(mapping.showKey);
      if (showRow !== undefined) {
        const parsed = parseBoolFlag(showRow.value);
        if (parsed !== undefined) merged[secKey] = parsed;
      }
      if (mapping.sectionKey) {
        const altRow = findRow(mapping.sectionKey);
        if (altRow !== undefined && showRow === undefined) {
          const parsed = parseBoolFlag(altRow.value);
          if (parsed !== undefined) merged[secKey] = parsed;
        }
      }
    }
  );

  return merged;
}

export async function syncSectionVisibilityToSupabase(
  supabase: SupabaseClient,
  nextSettings: SiteSettings,
  changedKey?: WebsiteSectionKey,
  nextValue?: boolean
): Promise<{ ok: boolean; errorMessage?: string }> {
  const normalizedSettings: SiteSettings = {
    ...nextSettings,
    heroSlides: normalizeHeroSlides(nextSettings.heroSlides, nextSettings.heroSlides),
  };

  try {
    localStorage.setItem('adarsh_settings', JSON.stringify(normalizedSettings));
  } catch {}
  broadcastLiveSync('settings', normalizedSettings);

  const now = new Date().toISOString();
  const visibilityObj = buildSectionVisibilityPayload(normalizedSettings);
  const fullPayload = { ...normalizedSettings, ...visibilityObj };

  const upsertRows: Array<Record<string, any>> = [
    {
      key: 'global_config',
      phone: normalizedSettings.salesPhone,
      instagram: normalizedSettings.instagram,
      hero_slides: normalizedSettings.heroSlides,
      value: fullPayload,
      updated_at: now,
    },
    {
      key: 'general',
      phone: normalizedSettings.salesPhone,
      instagram: normalizedSettings.instagram,
      hero_slides: normalizedSettings.heroSlides,
      value: fullPayload,
      updated_at: now,
    },
    { key: 'section_visibility', value: visibilityObj, updated_at: now },
    { key: 'hero_slides', value: normalizedSettings.heroSlides, updated_at: now },
  ];

  // Add per-section phone number rows
  SECTION_PHONE_KEY_MAP.forEach(({ field, dbKey }) => {
    const val = String((normalizedSettings as any)[field] || '').trim();
    upsertRows.push({ key: dbKey, value: val, updated_at: now });
  });

  // Add all show_* and section_* individual rows so customer site listeners on any key update immediately
  (Object.keys(SECTION_SETTING_KEY_MAP) as WebsiteSectionKey[]).forEach(
    (secKey) => {
      const mapping = SECTION_SETTING_KEY_MAP[secKey];
      const enabled = Boolean(normalizedSettings[secKey]);
      upsertRows.push({ key: mapping.showKey, value: enabled, updated_at: now });
      if (mapping.sectionKey) {
        upsertRows.push({
          key: mapping.sectionKey,
          value: enabled,
          updated_at: now,
        });
      }
    }
  );

  const errors: string[] = [];

  try {
    const { error: batchErr } = await supabase
      .from('site_settings')
      .upsert(upsertRows, { onConflict: 'key' });
    if (batchErr) {
      errors.push(batchErr.message);
    }

    // Accessories belong strictly in the dedicated `accessories` table, never in `bikes`.
    if (changedKey === 'enableAccessoriesSection') {
      await purgeAccessoriesFromBikesTable(supabase);
    }
  } catch (err: any) {
    errors.push(err?.message || 'Network error syncing site settings');
  }

  if (errors.length > 0) {
    return { ok: false, errorMessage: errors[0] };
  }
  return { ok: true };
}
