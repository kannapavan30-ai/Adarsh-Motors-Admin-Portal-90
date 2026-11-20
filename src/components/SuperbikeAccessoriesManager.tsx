import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Package, Search, Plus, Edit2, Trash2, Eye, EyeOff, Check, X,
  AlertTriangle, Sparkles, ExternalLink, Image as ImageIcon,
  CheckCircle2, Layers, Tag, ShieldCheck, Wrench, RefreshCw, IndianRupee,
  LayoutGrid, List, SlidersHorizontal, ChevronLeft, ChevronRight,
  Upload, Camera, Smartphone, Laptop, ZoomIn, Star, FolderOpen, ArrowUpDown,
  MessageCircle, Bell, TrendingDown, Users
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import PublicVisibilityToggle from './PublicVisibilityToggle';
import EditableSelect from './EditableSelect';
import OwnerSectionPhoneControl from './OwnerSectionPhoneControl';
import {
  normalizeLocalAssetUrl,
  FALLBACK_SHOWROOM_IMAGE,
  broadcastLiveSync,
  buildWhatsAppUrl,
  formatCompactINR,
  purgeAccessoriesFromBikesTable,
} from '../utils/sectionVisibilitySync';

export interface SuperbikeAccessoryItem {
  id: string;
  title: string;
  brand: string;
  category: 'Exhaust & Performance' | 'Riding Gear & Protection' | 'Chassis & Sliders' | 'Carbon & Aerodynamics' | 'Braking & Controls' | 'Luggage & Mounts' | 'Fluids & Maintenance' | (string & {});
  price: number;
  stock_count: number;
  sold_count?: number;
  initial_stock?: number;
  description: string;
  compatibility_models: string[];
  image_url: string;
  gallery_urls?: string[]; // Unlimited photos for sliding carousel
  is_visible_on_portal: boolean;
  warranty_badge?: string;
  sku?: string;
  gst_badge?: string;
  fitment_note?: string;
  material_spec?: string;
  material_detail?: string;
  workshop_title?: string;
  workshop_detail?: string;
  delivery_title?: string;
  delivery_detail?: string;
  authenticity_note?: string;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_ACCESSORY_SHOWCASE = {
  gst_badge: '100% AUTHENTIC IMPORT · GST BILL INCLUDED',
  fitment_note: 'Plug-and-play fitment with zero chassis modification.',
  material_spec: 'Race-Grade Precision Build · Lightweight Performance Hardware',
  material_detail: 'Original race-spec hardware with authentic manufacturer warranty.',
  workshop_title: 'Workshop Fitment Available',
  workshop_detail: 'Professional installation available across all Adarsh Motors bays.',
  delivery_title: 'Express Pan-India Air Delivery',
  delivery_detail: 'Insured air dispatch with live tracking to your doorstep.',
  authenticity_note: '100% Authentic Brand Import with Official Serial Number.',
};

export function resolveAccessoryShowcaseFields(item: Partial<SuperbikeAccessoryItem>) {
  return {
    gst_badge: item.gst_badge?.trim() || DEFAULT_ACCESSORY_SHOWCASE.gst_badge,
    fitment_note: item.fitment_note?.trim() || DEFAULT_ACCESSORY_SHOWCASE.fitment_note,
    material_spec:
      item.material_spec?.trim() ||
      (item.warranty_badge ? `${item.brand || 'OEM'} Spec · ${item.warranty_badge}` : DEFAULT_ACCESSORY_SHOWCASE.material_spec),
    material_detail: item.material_detail?.trim() || DEFAULT_ACCESSORY_SHOWCASE.material_detail,
    workshop_title: item.workshop_title?.trim() || DEFAULT_ACCESSORY_SHOWCASE.workshop_title,
    workshop_detail: item.workshop_detail?.trim() || DEFAULT_ACCESSORY_SHOWCASE.workshop_detail,
    delivery_title: item.delivery_title?.trim() || DEFAULT_ACCESSORY_SHOWCASE.delivery_title,
    delivery_detail: item.delivery_detail?.trim() || DEFAULT_ACCESSORY_SHOWCASE.delivery_detail,
    authenticity_note: item.authenticity_note?.trim() || DEFAULT_ACCESSORY_SHOWCASE.authenticity_note,
  };
}

export const SEED_ACCESSORIES: SuperbikeAccessoryItem[] = [
  {
    id: "acc_1",
    title: "Akrapovič Titanium Slip-On Racing Exhaust",
    brand: "Akrapovič",
    category: "Exhaust & Performance",
    price: 185000,
    stock_count: 4,
    sold_count: 8,
    initial_stock: 12,
    description: "Full titanium silencer with carbon fiber heat shield and end cap. Delivers +4.2 kW power boost, deeper acoustic tone, and 3.8 kg weight reduction.",
    compatibility_models: ["Ducati Diavel V4", "Ducati Panigale V2", "Kawasaki Ninja Z900", "BMW S1000RR M-Sport"],
    image_url: "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png",
    gallery_urls: [
      "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png",
      "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png",
      "/assets/aistudio/image_f4045ab9.png"
    ],
    is_visible_on_portal: true,
    warranty_badge: "Official 2-Year Akrapovič International Warranty",
    sku: "AKR-TIT-V4-RACE",
    gst_badge: "100% AUTHENTIC IMPORT · GST BILL INCLUDED",
    fitment_note: "Plug-and-play fitment with zero chassis modification.",
    material_spec: "Full Titanium Decat · WSBK Spec · 3.8kg Weight Reduction",
    material_detail: "Original race-spec hardware with authentic manufacturer warranty.",
    workshop_title: "Workshop Fitment Available",
    workshop_detail: "Professional installation available across all Adarsh Motors bays.",
    delivery_title: "Express Pan-India Air Delivery",
    delivery_detail: "Insured air dispatch with live tracking to your doorstep.",
    authenticity_note: "100% Authentic Brand Import with Official Serial Number.",
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-10-28T12:00:00Z"
  },
  {
    id: "acc_2",
    title: "Dainese Misano 2 D-Air Wireless Airbag Suit",
    brand: "Dainese",
    category: "Riding Gear & Protection",
    price: 145000,
    stock_count: 2,
    sold_count: 6,
    initial_stock: 8,
    description: "MotoGP-derived kangaroo leather suit with internal intelligent wireless airbag system, titanium shoulder plates, and replaceable knee sliders.",
    compatibility_models: ["Universal Superbike", "Ducati Panigale V2", "BMW S1000RR M-Sport"],
    image_url: "/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png",
    gallery_urls: [
      "/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png",
      "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png"
    ],
    is_visible_on_portal: true,
    warranty_badge: "Dainese D-Air Official FIM Certification",
    sku: "DAI-MIS2-AIR-EU52",
    gst_badge: "100% AUTHENTIC IMPORT · GST BILL INCLUDED",
    fitment_note: "Custom EU size fitting & D-Air activation included at showroom.",
    material_spec: "D-Skin 2.0 Kangaroo Leather · Titanium Shoulder Plates",
    material_detail: "FIM & CE Level 2 airbag protection with official Italian hologram.",
    workshop_title: "Showroom Trial & Fitting",
    workshop_detail: "Try multiple EU sizes in-store with expert riding gear specialists.",
    delivery_title: "Express Pan-India Air Delivery",
    delivery_detail: "Insured air dispatch with live tracking to your doorstep.",
    authenticity_note: "100% Authentic Brand Import with Official Serial Number.",
    created_at: "2026-10-18T14:30:00Z",
    updated_at: "2026-10-25T16:00:00Z"
  },
  {
    id: "acc_3",
    title: "Brembo 19RCS Corsa Corta Radial Brake Master Cylinder",
    brand: "Brembo",
    category: "Braking & Controls",
    price: 36500,
    stock_count: 6,
    sold_count: 4,
    initial_stock: 10,
    description: "Allows the rider to adapt the bite-point calibration (Normal, Sport, Race) via a simple selector switch. Forged aluminum body with micro-switch.",
    compatibility_models: ["Ducati Diavel V4", "Kawasaki Ninja Z900", "KTM 1290 Super Duke R", "BMW S1000RR M-Sport"],
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: [
      "/assets/aistudio/image_f4045ab9.png",
      "/assets/aistudio/image_5cecd00f.png"
    ],
    is_visible_on_portal: true,
    warranty_badge: "Official Brembo Italian Hologram Authenticated",
    sku: "BRM-19RCS-CC",
    gst_badge: "100% AUTHENTIC IMPORT · GST BILL INCLUDED",
    fitment_note: "Direct bolt-on radial master cylinder for 22mm clip-ons.",
    material_spec: "Forged Billet Aluminum · 3-Mode R/S/N Bite Selector",
    material_detail: "Hard-anodized MotoGP braking hardware with QR scratch verification.",
    workshop_title: "Workshop Bleed & Fitment",
    workshop_detail: "Includes RBF660 hydraulic bleed & lever reach setup in our bays.",
    delivery_title: "Express Pan-India Air Delivery",
    delivery_detail: "Insured air dispatch with live tracking to your doorstep.",
    authenticity_note: "100% Authentic Brand Import with Official Serial Number.",
    created_at: "2026-10-20T09:15:00Z",
    updated_at: "2026-10-20T09:15:00Z"
  },
  {
    id: "acc_4",
    title: "Evotech Performance Radiator & Engine Sliders Kit",
    brand: "Evotech Performance",
    category: "Chassis & Sliders",
    price: 24800,
    stock_count: 8,
    sold_count: 5,
    initial_stock: 13,
    description: "CNC machined aircraft-grade aluminum crash bobbins, hexagonal matrix radiator guard, and oil cooler protection without compromising airflow.",
    compatibility_models: ["Kawasaki Ninja Z900", "Kawasaki Ninja 650", "Ducati Diavel V4"],
    image_url: "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png",
    gallery_urls: [
      "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png",
      "/assets/aistudio/image_f4045ab9.png"
    ],
    is_visible_on_portal: true,
    warranty_badge: "1-Year Evotech UK Replacement Warranty",
    sku: "EVO-Z900-PROT",
    gst_badge: "100% AUTHENTIC IMPORT · GST BILL INCLUDED",
    fitment_note: "No fairing cutting required — mounts to OEM frame points.",
    material_spec: "CNC Aircraft Billet Aluminum · Hexagonal Airflow Guard",
    material_detail: "Powder-coated matte black crash protection with stainless hardware.",
    workshop_title: "Workshop Fitment Available",
    workshop_detail: "Torque-calibrated installation across all Adarsh Motors bays.",
    delivery_title: "Express Pan-India Air Delivery",
    delivery_detail: "Insured air dispatch with live tracking to your doorstep.",
    authenticity_note: "100% Authentic Brand Import with Official Serial Number.",
    created_at: "2026-10-22T11:00:00Z",
    updated_at: "2026-10-29T10:45:00Z"
  },
  {
    id: "acc_5",
    title: "Puig High-Impact Double Bubble Racing Windscreen",
    brand: "Puig",
    category: "Carbon & Aerodynamics",
    price: 11200,
    stock_count: 1,
    sold_count: 9,
    initial_stock: 10,
    description: "Developed in virtual wind tunnel testing to reduce aerodynamic drag on rider helmet by 22% during high-speed highway & track runs. Dark smoke finish.",
    compatibility_models: ["BMW S1000RR M-Sport", "Kawasaki Ninja 650", "Ducati Panigale V2"],
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: ["/assets/aistudio/image_f4045ab9.png"],
    is_visible_on_portal: true,
    warranty_badge: "TUV Certified Shatterproof Acrylic",
    sku: "PUIG-S1000RR-DS",
    gst_badge: "100% AUTHENTIC IMPORT · GST BILL INCLUDED",
    fitment_note: "Uses OEM fairing screws for 10-minute clean swap.",
    material_spec: "3mm High-Impact Acrylic · Wind Tunnel Tested (-22% Drag)",
    material_detail: "ABE & TUV safety certified rounded 2mm visor edge.",
    workshop_title: "Workshop Fitment Available",
    workshop_detail: "Quick complimentary windscreen install at all showroom bays.",
    delivery_title: "Express Pan-India Air Delivery",
    delivery_detail: "Insured air dispatch with live tracking to your doorstep.",
    authenticity_note: "100% Authentic Brand Import with Official Serial Number.",
    created_at: "2026-10-25T13:20:00Z",
    updated_at: "2026-10-31T15:10:00Z"
  },
  {
    id: "acc_6",
    title: "Quad Lock Superbike Vibration Dampener & Fork Stem Kit",
    brand: "Quad Lock",
    category: "Luggage & Mounts",
    price: 7800,
    stock_count: 12,
    sold_count: 3,
    initial_stock: 15,
    description: "Patented dual-stage lock with precision tuned silicone elastomer dampers to protect modern smartphone optical image stabilization from engine vibrations.",
    compatibility_models: ["Universal Superbike", "Ducati Diavel V4", "Kawasaki Ninja Z900", "BMW S1000RR M-Sport", "KTM 1290 Super Duke R"],
    image_url: "/assets/aistudio/image_5cecd00f.png",
    gallery_urls: [
      "/assets/aistudio/image_5cecd00f.png",
      "/assets/aistudio/image_f4045ab9.png"
    ],
    is_visible_on_portal: true,
    warranty_badge: "Official Quad Lock Australia Lifetime Warranty",
    sku: "QL-FORK-DAMP-KIT",
    gst_badge: "100% AUTHENTIC IMPORT · GST BILL INCLUDED",
    fitment_note: "Fits 12.7mm – 24mm hollow superbike fork stems effortlessly.",
    material_spec: "CNC Glass-Filled Nylon · 90%+ High-Freq Vibration Reduction",
    material_detail: "Protects smartphone camera OIS modules on high-revving inline-4/V4 bikes.",
    workshop_title: "Workshop Fitment Available",
    workshop_detail: "Fitted & aligned to cockpit angle across all Adarsh Motors bays.",
    delivery_title: "Express Pan-India Air Delivery",
    delivery_detail: "Insured air dispatch with live tracking to your doorstep.",
    authenticity_note: "100% Authentic Brand Import with Official Serial Number.",
    created_at: "2026-10-26T08:00:00Z",
    updated_at: "2026-10-26T08:00:00Z"
  },
  {
    id: "acc_7",
    title: "Motul 300V Factory Line 15W50 Road Racing 4L Pack",
    brand: "Motul",
    category: "Fluids & Maintenance",
    price: 4950,
    stock_count: 0,
    sold_count: 10,
    initial_stock: 10,
    description: "100% Synthetic 4-Stroke motorcycle racing lubricant developed for factory teams. Ester Core technology for maximum power output and clutch response.",
    compatibility_models: ["Universal Superbike", "Ducati Diavel V4", "Kawasaki Ninja Z900", "KTM 1290 Super Duke R"],
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: ["/assets/aistudio/image_f4045ab9.png"],
    is_visible_on_portal: false,
    warranty_badge: "100% Genuine Sealed Factory Import",
    sku: "MOT-300V-15W50-4L",
    gst_badge: "100% AUTHENTIC IMPORT · GST BILL INCLUDED",
    fitment_note: "Ideal for wet-clutch high-RPM superbikes & track machines.",
    material_spec: "100% Synthetic ESTER Core® · API JASO MA2 Race Spec",
    material_detail: "Factory sealed canister with batch code & official hologram.",
    workshop_title: "Workshop Oil Flush Service",
    workshop_detail: "Complete Motul 300V flush + K&N oil filter service at our bays.",
    delivery_title: "Express Pan-India Air Delivery",
    delivery_detail: "Leak-proof insured courier dispatch to your doorstep.",
    authenticity_note: "100% Authentic Brand Import with Official Serial Number.",
    created_at: "2026-10-28T16:00:00Z",
    updated_at: "2026-11-01T09:30:00Z"
  }
];

const CATEGORIES = [
  'ALL',
  'Exhaust & Performance',
  'Riding Gear & Protection',
  'Chassis & Sliders',
  'Carbon & Aerodynamics',
  'Braking & Controls',
  'Luggage & Mounts',
  'Fluids & Maintenance'
] as const;

const AVAILABLE_BIKES = [
  "Ducati Diavel V4",
  "Kawasaki Ninja Z900",
  "BMW S1000RR M-Sport",
  "KTM 1290 Super Duke R",
  "Ducati Panigale V2",
  "Royal Enfield Continental GT 650",
  "Universal Superbike"
];

const PRESET_GALLERY_IMAGES = [
  { label: "Titanium Exhaust", url: "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png" },
  { label: "Dainese Airbag Suit", url: "/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png" },
  { label: "Protective Sliders", url: "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png" },
  { label: "Phone Mount / Hardware", url: "/assets/aistudio/image_5cecd00f.png" },
  { label: "Technical Superbike Part", url: "/assets/aistudio/image_f4045ab9.png" }
];

interface StaffMemberRef {
  id: string | number;
  name: string;
  phone: string;
  role?: string;
  permissions?: string[];
  status?: string;
}

interface Props {
  supabase: SupabaseClient;
  currentUser: { name: string; phone: string; role: 'owner' | 'staff' };
  showToast: (msg: string) => void;
  logAuditAction: (action_type: any, module: any, description: string, target_id?: any, target_name?: string, details?: any) => void;
  isSectionVisible?: boolean;
  onToggleSectionVisibility?: () => void;
  accessoriesDepartmentPhone?: string;
  onSaveSectionPhone?: (nextPhone: string) => Promise<boolean> | boolean;
  staffList?: StaffMemberRef[];
}

const STOCK_META_KEY = 'adarsh_accessories_stock_meta';
const DEPT_HANDLER_KEY = 'adarsh_accessories_dept_handler';

interface AccessoryMetaEntry {
  sold_count?: number;
  initial_stock?: number;
  gst_badge?: string;
  fitment_note?: string;
  material_spec?: string;
  material_detail?: string;
  workshop_title?: string;
  workshop_detail?: string;
  delivery_title?: string;
  delivery_detail?: string;
  authenticity_note?: string;
}

function readStockMetaMap(): Record<string, AccessoryMetaEntry> {
  try {
    const raw = localStorage.getItem(STOCK_META_KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
}

function writeStockMetaMap(list: SuperbikeAccessoryItem[]) {
  try {
    const map: Record<string, AccessoryMetaEntry> = {};
    for (const item of list) {
      const rem = Number(item.stock_count) || 0;
      const sold = Number(item.sold_count) || 0;
      const specs = resolveAccessoryShowcaseFields(item);
      map[String(item.id)] = {
        sold_count: sold,
        initial_stock: Number(item.initial_stock) || rem + sold,
        ...specs,
      };
    }
    localStorage.setItem(STOCK_META_KEY, JSON.stringify(map));
  } catch {}
}

export default function SuperbikeAccessoriesManager({
  supabase,
  currentUser,
  showToast,
  logAuditAction,
  isSectionVisible = true,
  onToggleSectionVisibility,
  accessoriesDepartmentPhone,
  onSaveSectionPhone,
  staffList = [],
}: Props) {
  const isOwner = currentUser?.role === 'owner';
  // Main Accessories Inventory State
  const [accessories, setAccessories] = useState<SuperbikeAccessoryItem[]>(() => {
    const metaMap = readStockMetaMap();
    try {
      const saved = localStorage.getItem('adarsh_accessories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: SuperbikeAccessoryItem) => {
            const meta = metaMap[String(item.id)] || {};
            const stockNum = Number(item.stock_count) || 0;
            const soldNum = item.sold_count !== undefined ? Number(item.sold_count) || 0 : Number(meta.sold_count) || 0;
            return {
              ...item,
              stock_count: stockNum,
              sold_count: soldNum,
              initial_stock: Number(item.initial_stock) || meta.initial_stock || stockNum + soldNum,
              gst_badge: item.gst_badge || meta.gst_badge,
              fitment_note: item.fitment_note || meta.fitment_note,
              material_spec: item.material_spec || meta.material_spec,
              material_detail: item.material_detail || meta.material_detail,
              workshop_title: item.workshop_title || meta.workshop_title,
              workshop_detail: item.workshop_detail || meta.workshop_detail,
              delivery_title: item.delivery_title || meta.delivery_title,
              delivery_detail: item.delivery_detail || meta.delivery_detail,
              authenticity_note: item.authenticity_note || meta.authenticity_note,
              image_url: normalizeLocalAssetUrl(item.image_url, FALLBACK_SHOWROOM_IMAGE),
              gallery_urls: Array.isArray(item.gallery_urls)
                ? item.gallery_urls.map((g) => normalizeLocalAssetUrl(g, FALLBACK_SHOWROOM_IMAGE))
                : [normalizeLocalAssetUrl(item.image_url, FALLBACK_SHOWROOM_IMAGE)],
            };
          });
        }
      }
      writeStockMetaMap(SEED_ACCESSORIES);
      return SEED_ACCESSORIES;
    } catch {
      return SEED_ACCESSORIES;
    }
  });

  // Hydrate accessories from Supabase on mount
  useEffect(() => {
    let active = true;
    const fetchAccessories = async () => {
      try {
        const { data, error } = await supabase
          .from('accessories')
          .select('*')
          .order('created_at', { ascending: false });
        if (!active) return;
        if (error) {
          console.warn('Supabase accessories fetch error:', error);
          return;
        }
        if (Array.isArray(data) && data.length > 0) {
          const metaMap = readStockMetaMap();
          const normalized: SuperbikeAccessoryItem[] = data.map((row: any) => {
            let compat: string[] = [];
            if (Array.isArray(row.compatibility_models)) {
              compat = row.compatibility_models;
            } else if (typeof row.compatibility_models === 'string') {
              try { compat = JSON.parse(row.compatibility_models); } catch {}
            }
            let gallery: string[] = [];
            if (Array.isArray(row.gallery_urls)) {
              gallery = row.gallery_urls;
            } else if (typeof row.gallery_urls === 'string') {
              try { gallery = JSON.parse(row.gallery_urls); } catch {}
            }
            const rawGallery = Array.isArray(gallery) && gallery.length > 0 ? gallery : [row.image_url];
            const cleanGallery = rawGallery.map((g: string) =>
              normalizeLocalAssetUrl(g, '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png')
            );
            const img = normalizeLocalAssetUrl(row.image_url, cleanGallery[0] || FALLBACK_SHOWROOM_IMAGE);
            const stockNum = Number(row.stock_count) || 0;
            const meta = metaMap[String(row.id)] || {};
            const soldNum =
              row.sold_count !== undefined && row.sold_count !== null
                ? Number(row.sold_count) || 0
                : Number(meta.sold_count) || 0;
            return {
              id: String(row.id),
              title: String(row.title || 'Superbike Accessory'),
              brand: String(row.brand || 'OEM'),
              category: row.category || 'Exhaust & Performance',
              price: Number(row.price) || 0,
              stock_count: stockNum,
              sold_count: soldNum,
              initial_stock: Number(row.initial_stock) || meta.initial_stock || stockNum + soldNum,
              description: String(row.description || ''),
              compatibility_models: Array.isArray(compat) ? compat : [],
              image_url: img,
              gallery_urls: cleanGallery.length > 0 ? cleanGallery : [img],
              is_visible_on_portal: row.is_visible_on_portal !== false && row.is_visible_on_portal !== 'false',
              warranty_badge: row.warranty_badge || 'Official Warranty',
              sku: row.sku || '',
              gst_badge: row.gst_badge || meta.gst_badge,
              fitment_note: row.fitment_note || meta.fitment_note,
              material_spec: row.material_spec || meta.material_spec,
              material_detail: row.material_detail || meta.material_detail,
              workshop_title: row.workshop_title || meta.workshop_title,
              workshop_detail: row.workshop_detail || meta.workshop_detail,
              delivery_title: row.delivery_title || meta.delivery_title,
              delivery_detail: row.delivery_detail || meta.delivery_detail,
              authenticity_note: row.authenticity_note || meta.authenticity_note,
              created_at: row.created_at || new Date().toISOString(),
              updated_at: row.updated_at || new Date().toISOString()
            };
          });
          setAccessories(normalized);
          writeStockMetaMap(normalized);
          try {
            localStorage.setItem('adarsh_accessories', JSON.stringify(normalized));
          } catch {}
          // Clean up any legacy dual-synced accessories from the `bikes` table so Showroom only displays bikes
          purgeAccessoriesFromBikesTable(
            supabase,
            normalized.map((a) => a.id),
            normalized.map((a) => a.title)
          );
        } else {
          purgeAccessoriesFromBikesTable(supabase);
        }
      } catch (err) {
        console.warn('Supabase accessories fetch exception:', err);
      }
    };
    fetchAccessories();
    return () => {
      active = false;
    };
  }, [supabase]);

  // Device Detection State (Mobile vs Desktop)
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  useEffect(() => {
    const detectMobile = () => {
      const ua = navigator.userAgent || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isTouch = window.innerWidth < 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setIsMobileDevice(mobileRegex.test(ua) || isTouch);
    };
    detectMobile();
    window.addEventListener('resize', detectMobile);
    return () => window.removeEventListener('resize', detectMobile);
  }, []);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'in_stock' | 'under_10' | 'under_5' | 'low_stock' | 'out_of_stock' | string>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'visible' | 'hidden'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Accessories Department Alert Handler (defaults to Myself who is handling this section)
  const [deptHandlerSelection, setDeptHandlerSelection] = useState<string>(() => {
    try {
      return localStorage.getItem(DEPT_HANDLER_KEY) || 'myself';
    } catch {
      return 'myself';
    }
  });
  const [latestTriggeredUnder5AlertId, setLatestTriggeredUnder5AlertId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DEPT_HANDLER_KEY, deptHandlerSelection);
    } catch {}
  }, [deptHandlerSelection]);

  const accessoriesDeptStaff = useMemo(() => {
    return (staffList || []).filter(
      (s) =>
        s &&
        s.status !== 'Inactive' &&
        (s.role === 'owner' ||
          (Array.isArray(s.permissions) &&
            (s.permissions.includes('accessories') || s.permissions.includes('all'))))
    );
  }, [staffList]);

  const activeDeptHandler = useMemo(() => {
    const sel = String(deptHandlerSelection || 'myself').trim();
    const myPhone = currentUser?.phone || accessoriesDepartmentPhone || '9014540489';
    if (!sel || sel === 'myself') {
      return {
        label: `Myself (${currentUser?.name || 'Accessories Lead'})`,
        phone: myPhone,
        department: 'Accessories Dept (Myself)',
      };
    }
    if (sel === 'dept_desk') {
      return {
        label: 'Accessories Dept Desk',
        phone: accessoriesDepartmentPhone || myPhone,
        department: 'Accessories Department Desk',
      };
    }
    const matchedStaff = (staffList || []).find((s) => `staff:${s.id}` === sel || s.phone === sel);
    if (matchedStaff) {
      return {
        label: `${matchedStaff.name} (Accessories Dept)`,
        phone: matchedStaff.phone,
        department: 'Accessories Department',
      };
    }
    // Manual typed entry (either phone or "Name - Phone")
    const extractedDigits = sel.replace(/\D/g, '');
    return {
      label: sel,
      phone: extractedDigits.length >= 10 ? extractedDigits : myPhone,
      department: 'Accessories Department',
    };
  }, [deptHandlerSelection, currentUser, accessoriesDepartmentPhone, staffList]);

  const buildUnder5WhatsAppUrl = (item: SuperbikeAccessoryItem) => {
    const rem = Number(item.stock_count) || 0;
    const sold = Number(item.sold_count) || 0;
    const total = rem + sold;
    const websiteLabel = item.is_visible_on_portal
      ? rem > 0
        ? `Live on Website (${rem} remaining)`
        : 'Live on Website (OUT OF STOCK - 0 remaining)'
      : 'Hidden from Website';
    const msg = [
      `RED STOCK ALERT (<5 UNITS) — Adarsh Motors Accessories Dept`,
      `Handler: ${activeDeptHandler.label}`,
      `Item: ${item.title} (${item.brand})`,
      item.sku ? `SKU: ${item.sku}` : null,
      `Remaining in Stock: ${rem} units`,
      `Sold Out: ${sold} units`,
      `Total Stocked: ${total} units`,
      `Website Status: ${websiteLabel}`,
      `Action Required: Immediate restock needed before stock hits zero.`,
    ]
      .filter(Boolean)
      .join('\n');
    return buildWhatsAppUrl(activeDeptHandler.phone, msg);
  };

  // Carousel Active Slide Tracker for each Card in the Grid
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

  // Lightbox Modal State for Fullscreen Carousel Preview
  const [lightboxData, setLightboxData] = useState<{ title: string; images: string[]; activeIdx: number } | null>(null);

  // Dedicated Rich Showcase Modal State (Identical to Vehicle Showcase)
  const [selectedAccessoryForShowcase, setSelectedAccessoryForShowcase] = useState<SuperbikeAccessoryItem | null>(null);
  const [showcasePhotoIndex, setShowcasePhotoIndex] = useState<number>(0);
  const [isShowcaseAutoPlaying, setIsShowcaseAutoPlaying] = useState<boolean>(false);

  // Autoplay carousel in accessory showcase modal
  useEffect(() => {
    if (!selectedAccessoryForShowcase || !isShowcaseAutoPlaying) return;
    const photos = selectedAccessoryForShowcase.gallery_urls && selectedAccessoryForShowcase.gallery_urls.length > 0
      ? selectedAccessoryForShowcase.gallery_urls
      : [selectedAccessoryForShowcase.image_url];
    if (photos.length <= 1) return;

    const timer = setInterval(() => {
      setShowcasePhotoIndex(prev => (prev + 1) % photos.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [selectedAccessoryForShowcase, isShowcaseAutoPlaying]);

  const openShowcaseModal = (item: SuperbikeAccessoryItem) => {
    setSelectedAccessoryForShowcase(item);
    setShowcasePhotoIndex(0);
    setIsShowcaseAutoPlaying(false);
  };

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<SuperbikeAccessoryItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SuperbikeAccessoryItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formBrand, setFormBrand] = useState('Akrapovič');
  const [formCategory, setFormCategory] = useState<SuperbikeAccessoryItem['category']>('Exhaust & Performance');
  const [formPrice, setFormPrice] = useState<number>(25000);
  const [formStock, setFormStock] = useState<number>(5);
  const [formSoldCount, setFormSoldCount] = useState<number>(0);
  const [formDescription, setFormDescription] = useState('');
  const [formCompatibility, setFormCompatibility] = useState<string[]>(['Ducati Diavel V4']);
  const [formIsVisible, setFormIsVisible] = useState(true);
  const [formWarranty, setFormWarranty] = useState('Official 1-Year Manufacturer Warranty');
  const [formSku, setFormSku] = useState('');
  const [newCompatibilityInput, setNewCompatibilityInput] = useState('');
  const [formGstBadge, setFormGstBadge] = useState(DEFAULT_ACCESSORY_SHOWCASE.gst_badge);
  const [formFitmentNote, setFormFitmentNote] = useState(DEFAULT_ACCESSORY_SHOWCASE.fitment_note);
  const [formMaterialSpec, setFormMaterialSpec] = useState(DEFAULT_ACCESSORY_SHOWCASE.material_spec);
  const [formMaterialDetail, setFormMaterialDetail] = useState(DEFAULT_ACCESSORY_SHOWCASE.material_detail);
  const [formWorkshopTitle, setFormWorkshopTitle] = useState(DEFAULT_ACCESSORY_SHOWCASE.workshop_title);
  const [formWorkshopDetail, setFormWorkshopDetail] = useState(DEFAULT_ACCESSORY_SHOWCASE.workshop_detail);
  const [formDeliveryTitle, setFormDeliveryTitle] = useState(DEFAULT_ACCESSORY_SHOWCASE.delivery_title);
  const [formDeliveryDetail, setFormDeliveryDetail] = useState(DEFAULT_ACCESSORY_SHOWCASE.delivery_detail);
  const [formAuthenticityNote, setFormAuthenticityNote] = useState(DEFAULT_ACCESSORY_SHOWCASE.authenticity_note);

  // Unlimited Images Form State
  const [formGalleryUrls, setFormGalleryUrls] = useState<string[]>([]);
  const [primaryCoverUrl, setPrimaryCoverUrl] = useState<string>('');
  const [manualUrlInput, setManualUrlInput] = useState<string>('');
  const [showManualUrlBox, setShowManualUrlBox] = useState<boolean>(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState<boolean>(false);

  // Hidden File Inputs Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Canvas Image Compression Helper for Unlimited Photos
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Multiple File Upload Handler (Mobile Gallery / PC Files)
  const handleMultipleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImageFile(files[i]);
        if (compressed) newPhotos.push(compressed);
      } catch (err) {
        console.warn("Could not compress file", files[i].name);
      }
    }

    if (newPhotos.length > 0) {
      setFormGalleryUrls(prev => {
        const merged = [...prev, ...newPhotos];
        if (!primaryCoverUrl || prev.length === 0) {
          setPrimaryCoverUrl(newPhotos[0]);
        }
        return merged;
      });
      showToast(`Imported ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''}! Carousel updated.`);
    }

    setIsProcessingPhotos(false);
    e.target.value = '';
  };

  // Add Single URL via text
  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    const url = manualUrlInput.trim();
    setFormGalleryUrls(prev => {
      const next = [...prev, url];
      if (!primaryCoverUrl || prev.length === 0) {
        setPrimaryCoverUrl(url);
      }
      return next;
    });
    setManualUrlInput('');
    setShowManualUrlBox(false);
    showToast("Added image URL to accessory gallery!");
  };

  // Remove Photo from Gallery
  const handleRemoveGalleryPhoto = (indexToRemove: number) => {
    setFormGalleryUrls(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (primaryCoverUrl === prev[indexToRemove]) {
        setPrimaryCoverUrl(updated[0] || '');
      }
      return updated;
    });
  };

  // Set as Primary Cover
  const handleSetPrimaryCover = (url: string) => {
    setPrimaryCoverUrl(url);
    showToast("Set as primary cover photo!");
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingAccessory(null);
    setFormTitle('');
    setFormBrand('Akrapovič');
    setFormCategory('Exhaust & Performance');
    setFormPrice(25000);
    setFormStock(4);
    setFormSoldCount(0);
    setFormDescription('');
    setFormCompatibility(['Universal Superbike']);
    const initialImages = [PRESET_GALLERY_IMAGES[0].url];
    setFormGalleryUrls(initialImages);
    setPrimaryCoverUrl(initialImages[0]);
    setFormIsVisible(true);
    setFormWarranty('Official 1-Year Manufacturer Warranty');
    setFormSku(`ACC-${Date.now().toString().slice(-4)}`);
    setFormGstBadge(DEFAULT_ACCESSORY_SHOWCASE.gst_badge);
    setFormFitmentNote(DEFAULT_ACCESSORY_SHOWCASE.fitment_note);
    setFormMaterialSpec(DEFAULT_ACCESSORY_SHOWCASE.material_spec);
    setFormMaterialDetail(DEFAULT_ACCESSORY_SHOWCASE.material_detail);
    setFormWorkshopTitle(DEFAULT_ACCESSORY_SHOWCASE.workshop_title);
    setFormWorkshopDetail(DEFAULT_ACCESSORY_SHOWCASE.workshop_detail);
    setFormDeliveryTitle(DEFAULT_ACCESSORY_SHOWCASE.delivery_title);
    setFormDeliveryDetail(DEFAULT_ACCESSORY_SHOWCASE.delivery_detail);
    setFormAuthenticityNote(DEFAULT_ACCESSORY_SHOWCASE.authenticity_note);
    setShowManualUrlBox(false);
    setManualUrlInput('');
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item: SuperbikeAccessoryItem) => {
    const specs = resolveAccessoryShowcaseFields(item);
    setEditingAccessory(item);
    setFormTitle(item.title);
    setFormBrand(item.brand);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormStock(item.stock_count);
    setFormSoldCount(Number(item.sold_count) || 0);
    setFormDescription(item.description);
    setFormCompatibility(item.compatibility_models || []);
    const existingImgs = item.gallery_urls && item.gallery_urls.length > 0
      ? item.gallery_urls
      : [item.image_url];
    setFormGalleryUrls(existingImgs);
    setPrimaryCoverUrl(item.image_url || existingImgs[0] || '');
    setFormIsVisible(item.is_visible_on_portal);
    setFormWarranty(item.warranty_badge || 'Official 1-Year Manufacturer Warranty');
    setFormSku(item.sku || '');
    setFormGstBadge(specs.gst_badge);
    setFormFitmentNote(specs.fitment_note);
    setFormMaterialSpec(specs.material_spec);
    setFormMaterialDetail(specs.material_detail);
    setFormWorkshopTitle(specs.workshop_title);
    setFormWorkshopDetail(specs.workshop_detail);
    setFormDeliveryTitle(specs.delivery_title);
    setFormDeliveryDetail(specs.delivery_detail);
    setFormAuthenticityNote(specs.authenticity_note);
    setShowManualUrlBox(false);
    setManualUrlInput('');
    setShowAddEditModal(true);
  };

  // Persist State Helper
  const persistAccessories = async (
    nextList: SuperbikeAccessoryItem[],
    syncAction?: { type: 'upsert' | 'delete'; item: SuperbikeAccessoryItem }
  ) => {
    setAccessories(nextList);
    writeStockMetaMap(nextList);
    try {
      localStorage.setItem('adarsh_accessories', JSON.stringify(nextList));
    } catch (e) {
      console.warn("localStorage quota or error", e);
    }
    broadcastLiveSync('accessories', nextList);

    if (syncAction) {
      const item = syncAction.item;
      const soldCount = Number(item.sold_count) || 0;
      const initialStock = Number(item.initial_stock) || (Number(item.stock_count) || 0) + soldCount;
      // All possible ID variations to guarantee matching both old and new records
      const rawId = item.id.replace(/^acc_/, '');
      const prefixedId = item.id.startsWith('acc_') ? item.id : `acc_${item.id}`;
      const candidateIds = Array.from(new Set([item.id, rawId, prefixedId]));

      try {
        if (syncAction.type === 'upsert') {
          const basePayload = {
            id: item.id,
            title: item.title,
            brand: item.brand,
            category: item.category,
            price: item.price,
            stock_count: item.stock_count,
            description: item.description,
            compatibility_models: item.compatibility_models,
            image_url: item.image_url,
            gallery_urls: item.gallery_urls,
            is_visible_on_portal: item.is_visible_on_portal,
            warranty_badge: item.warranty_badge,
            sku: item.sku,
            updated_at: new Date().toISOString()
          };
          const specs = resolveAccessoryShowcaseFields(item);
          // 1. Save to dedicated accessories table (try full payload, fallback cleanly if optional columns haven't been added in DB)
          let { error: accErr } = await supabase.from('accessories').upsert({
            ...basePayload,
            sold_count: soldCount,
            initial_stock: initialStock,
            ...specs,
          }, { onConflict: 'id' });

          if (accErr && /sold_count|initial_stock|fitment_note|material_spec|workshop_title|delivery_title|gst_badge|authenticity_note|schema cache|column/i.test(accErr.message || '')) {
            const retry = await supabase.from('accessories').upsert(basePayload, { onConflict: 'id' });
            accErr = retry.error;
          }

          if (accErr) {
            console.error('Supabase accessories upsert error:', accErr);
            showToast(`Saved locally — Supabase accessories sync error: ${accErr.message}`);
          }

          // 2. Accessories belong strictly in `accessories` — purge any legacy copy from `bikes`
          // so accessories never leak into Bike Inventory or Showroom.
          await purgeAccessoriesFromBikesTable(
            supabase,
            candidateIds,
            item.title ? [item.title] : []
          );
        } else if (syncAction.type === 'delete') {
          // Delete from accessories table
          const { error: accDelErr } = await supabase.from('accessories').delete().in('id', candidateIds);
          if (accDelErr) {
            console.error('Supabase accessories delete error:', accDelErr);
            showToast(`Delete sync warning: ${accDelErr.message}`);
          }
          if (item.title) {
            await supabase.from('accessories').delete().eq('title', item.title);
          }
          // Ensure any legacy copy in `bikes` is also removed
          await purgeAccessoriesFromBikesTable(
            supabase,
            candidateIds,
            item.title ? [item.title] : []
          );
        }
      } catch (err: any) {
        console.error("Supabase accessories sync error:", err);
        showToast(`Saved locally — Supabase sync error: ${err?.message || 'Network error'}`);
      }
    }
  };

  // Helper to log & announce low/critical stock alerts
  const notifyLowStockThresholds = (updated: SuperbikeAccessoryItem, previousStock?: number) => {
    const rem = Number(updated.stock_count) || 0;
    if (rem < 5) {
      setLatestTriggeredUnder5AlertId(updated.id);
      if (previousStock === undefined || previousStock >= 5 || rem < previousStock) {
        showToast(
          `CRITICAL RED ALERT (<5): "${updated.title}" has only ${rem} left! WhatsApp alert ready for ${activeDeptHandler.label} (${activeDeptHandler.phone}).`
        );
        logAuditAction(
          'inventory_edit',
          'Inventory',
          `CRITICAL UNDER-5 RED ALERT: "${updated.title}" dropped to ${rem} units (${Number(updated.sold_count) || 0} sold). Routed WhatsApp alert to ${activeDeptHandler.label} (${activeDeptHandler.phone}).`,
          updated.id,
          updated.title,
          { field: 'under_5_whatsapp_alert', stock_count: rem, handler: activeDeptHandler }
        );
      }
    } else if (rem < 10) {
      if (previousStock === undefined || previousStock >= 10 || rem < previousStock) {
        showToast(
          `RED STOCK ALERT (<10): "${updated.title}" has ${rem} remaining. Flagged for ${activeDeptHandler.department}.`
        );
      }
    }
  };

  // Save / Submit Form (Create or Update)
  const handleSaveAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter an accessory title.');
      return;
    }

    const finalGallery = formGalleryUrls.length > 0
      ? formGalleryUrls
      : [PRESET_GALLERY_IMAGES[0].url];
    const finalCover = primaryCoverUrl && formGalleryUrls.includes(primaryCoverUrl)
      ? primaryCoverUrl
      : finalGallery[0];

    const nextStock = Math.max(0, Number(formStock) || 0);
    const nextSold = Math.max(0, Number(formSoldCount) || 0);

    const showcasePayload = {
      gst_badge: formGstBadge.trim() || DEFAULT_ACCESSORY_SHOWCASE.gst_badge,
      fitment_note: formFitmentNote.trim() || DEFAULT_ACCESSORY_SHOWCASE.fitment_note,
      material_spec: formMaterialSpec.trim() || DEFAULT_ACCESSORY_SHOWCASE.material_spec,
      material_detail: formMaterialDetail.trim() || DEFAULT_ACCESSORY_SHOWCASE.material_detail,
      workshop_title: formWorkshopTitle.trim() || DEFAULT_ACCESSORY_SHOWCASE.workshop_title,
      workshop_detail: formWorkshopDetail.trim() || DEFAULT_ACCESSORY_SHOWCASE.workshop_detail,
      delivery_title: formDeliveryTitle.trim() || DEFAULT_ACCESSORY_SHOWCASE.delivery_title,
      delivery_detail: formDeliveryDetail.trim() || DEFAULT_ACCESSORY_SHOWCASE.delivery_detail,
      authenticity_note: formAuthenticityNote.trim() || DEFAULT_ACCESSORY_SHOWCASE.authenticity_note,
    };

    if (editingAccessory) {
      // UPDATE
      const updated: SuperbikeAccessoryItem = {
        ...editingAccessory,
        title: formTitle.trim(),
        brand: formBrand.trim(),
        category: formCategory,
        price: Number(formPrice) || 0,
        stock_count: nextStock,
        sold_count: nextSold,
        initial_stock: nextStock + nextSold,
        description: formDescription.trim(),
        compatibility_models: formCompatibility,
        image_url: finalCover,
        gallery_urls: finalGallery,
        is_visible_on_portal: formIsVisible,
        warranty_badge: formWarranty.trim(),
        sku: formSku.trim() || editingAccessory.sku,
        ...showcasePayload,
        updated_at: new Date().toISOString()
      };

      const nextList = accessories.map(a => a.id === updated.id ? updated : a);
      await persistAccessories(nextList, { type: 'upsert', item: updated });
      showToast(`Updated accessory "${updated.title}" (${nextStock} remaining, ${nextSold} sold out)!`);
      notifyLowStockThresholds(updated, editingAccessory.stock_count);
      logAuditAction(
        'inventory_edit',
        'Inventory',
        `${currentUser.name} updated superbike accessory "${updated.title}" (${formatINR(updated.price)}, ${nextStock} remaining, ${nextSold} sold)`,
        updated.id,
        updated.title,
        { field: 'accessory_edit', after: updated }
      );
    } else {
      // CREATE
      const newAcc: SuperbikeAccessoryItem = {
        id: 'acc_' + Date.now(),
        title: formTitle.trim(),
        brand: formBrand.trim(),
        category: formCategory,
        price: Number(formPrice) || 0,
        stock_count: nextStock,
        sold_count: nextSold,
        initial_stock: nextStock + nextSold,
        description: formDescription.trim(),
        compatibility_models: formCompatibility,
        image_url: finalCover,
        gallery_urls: finalGallery,
        is_visible_on_portal: formIsVisible,
        warranty_badge: formWarranty.trim(),
        sku: formSku.trim() || `ACC-${Date.now().toString().slice(-4)}`,
        ...showcasePayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const nextList = [newAcc, ...accessories];
      await persistAccessories(nextList, { type: 'upsert', item: newAcc });
      showToast(`Added new accessory "${newAcc.title}" (${nextStock} remaining, ${nextSold} sold)!`);
      notifyLowStockThresholds(newAcc);
      logAuditAction(
        'inventory_add',
        'Inventory',
        `${currentUser.name} created superbike accessory "${newAcc.title}" in ${newAcc.category}`,
        newAcc.id,
        newAcc.title,
        { field: 'accessory_create', after: newAcc }
      );
    }

    setShowAddEditModal(false);
  };

  // Toggle Visibility directly on Portal
  const handleToggleVisibility = async (item: SuperbikeAccessoryItem) => {
    const nextVisibility = !item.is_visible_on_portal;
    const updated: SuperbikeAccessoryItem = {
      ...item,
      is_visible_on_portal: nextVisibility,
      updated_at: new Date().toISOString()
    };

    const nextList = accessories.map(a => a.id === updated.id ? updated : a);
    await persistAccessories(nextList, { type: 'upsert', item: updated });
    showToast(`"${item.title}" is now ${nextVisibility ? 'VISIBLE' : 'HIDDEN'} on customer portal!`);
    logAuditAction(
      'inventory_edit',
      'Inventory',
      `${currentUser.name} changed portal visibility of "${item.title}" to ${nextVisibility ? 'Visible' : 'Hidden'}`,
      item.id,
      item.title
    );
  };

  // Quick Stock Adjustment (+1 Restock / -1 Sold Out)
  const handleAdjustStock = async (item: SuperbikeAccessoryItem, delta: number) => {
    const prevStock = Number(item.stock_count) || 0;
    const newStock = Math.max(0, prevStock + delta);
    const actualChange = newStock - prevStock;
    const currentSold = Number(item.sold_count) || 0;
    // Decreasing stock records sold units; increasing stock restocks inventory
    const nextSold = actualChange < 0 ? currentSold + Math.abs(actualChange) : currentSold;
    const updated: SuperbikeAccessoryItem = {
      ...item,
      stock_count: newStock,
      sold_count: nextSold,
      initial_stock: newStock + nextSold,
      updated_at: new Date().toISOString()
    };

    const nextList = accessories.map(a => a.id === updated.id ? updated : a);
    await persistAccessories(nextList, { type: 'upsert', item: updated });
    if (newStock >= 10) {
      showToast(`Updated "${item.title}": ${newStock} remaining · ${nextSold} sold out`);
    }
    notifyLowStockThresholds(updated, prevStock);
  };

  // Delete Accessory
  const handleDeleteAccessory = async () => {
    if (!deleteConfirmItem) return;
    const itemToDelete = deleteConfirmItem;
    const nextList = accessories.filter(a => a.id !== itemToDelete.id);
    await persistAccessories(nextList, { type: 'delete', item: itemToDelete });
    setDeleteConfirmItem(null);
    showToast(`Deleted accessory "${itemToDelete.title}" from inventory.`);
    logAuditAction(
      'inventory_delete',
      'Inventory',
      `${currentUser.name} deleted superbike accessory "${itemToDelete.title}"`,
      itemToDelete.id,
      itemToDelete.title
    );
  };

  // Carousel Next Slide for a Card
  const handleCarouselNext = (e: React.MouseEvent, itemId: string, totalImages: number) => {
    e.stopPropagation();
    setCarouselIndices(prev => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: (current + 1) % totalImages };
    });
  };

  // Carousel Prev Slide for a Card
  const handleCarouselPrev = (e: React.MouseEvent, itemId: string, totalImages: number) => {
    e.stopPropagation();
    setCarouselIndices(prev => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: (current - 1 + totalImages) % totalImages };
    });
  };

  // Add Compatibility Model Tag
  const handleAddCompatibilityTag = (model: string) => {
    if (!model.trim() || formCompatibility.includes(model.trim())) return;
    setFormCompatibility(prev => [...prev, model.trim()]);
    setNewCompatibilityInput('');
  };

  // Remove Compatibility Model Tag
  const handleRemoveCompatibilityTag = (model: string) => {
    setFormCompatibility(prev => prev.filter(m => m !== model));
  };

  // Filtered List
  const filteredAccessories = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return accessories.filter(item => {
      if (!item) return false;
      const title = String(item.title || '').toLowerCase();
      const brand = String(item.brand || '').toLowerCase();
      const sku = String(item.sku || '').toLowerCase();
      const desc = String(item.description || '').toLowerCase();
      const compat = Array.isArray(item.compatibility_models) ? item.compatibility_models : [];
      const matchesSearch = !q ||
        title.includes(q) ||
        brand.includes(q) ||
        sku.includes(q) ||
        desc.includes(q) ||
        compat.some(m => String(m || '').toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

      const stockClean = String(stockFilter || '').trim().toLowerCase();
      const remQty = Number(item.stock_count) || 0;
      const matchesStock =
        !stockClean ||
        stockClean === 'all' ||
        (stockFilter === 'in_stock' && remQty >= 10) ||
        (stockFilter === 'under_10' && remQty < 10) ||
        (stockFilter === 'under_5' && remQty < 5) ||
        (stockFilter === 'low_stock' && remQty > 0 && remQty < 10) ||
        (stockFilter === 'out_of_stock' && remQty === 0) ||
        (/^\d+$/.test(stockClean) && remQty === Number(stockClean)) ||
        (stockClean.includes('<5') && remQty < 5) ||
        (stockClean.includes('<10') && remQty < 10) ||
        (stockClean.includes('in') && remQty >= 10) ||
        (stockClean.includes('low') && remQty > 0 && remQty < 10) ||
        (stockClean.includes('out') && remQty === 0);

      const visClean = String(visibilityFilter || '').trim().toLowerCase();
      const matchesVisibility =
        !visClean ||
        visClean === 'all' ||
        (visibilityFilter === 'visible' && item.is_visible_on_portal) ||
        (visibilityFilter === 'hidden' && !item.is_visible_on_portal) ||
        ((visClean.includes('vis') || visClean.includes('live') || visClean === 'on') && item.is_visible_on_portal) ||
        ((visClean.includes('hid') || visClean === 'off') && !item.is_visible_on_portal);

      return matchesSearch && matchesCategory && matchesStock && matchesVisibility;
    });
  }, [accessories, searchQuery, selectedCategory, stockFilter, visibilityFilter]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    const totalCount = accessories.length;
    const totalValue = accessories.reduce((acc, curr) => acc + (curr.price * curr.stock_count), 0);
    const totalRemainingUnits = accessories.reduce((acc, curr) => acc + (Number(curr.stock_count) || 0), 0);
    const totalSoldUnits = accessories.reduce((acc, curr) => acc + (Number(curr.sold_count) || 0), 0);
    const under10Count = accessories.filter(a => a.stock_count > 0 && a.stock_count < 10).length;
    const under5Count = accessories.filter(a => a.stock_count < 5).length;
    const outOfStockCount = accessories.filter(a => a.stock_count === 0).length;
    const visibleOnPortalCount = accessories.filter(a => a.is_visible_on_portal).length;
    return {
      totalCount,
      totalValue,
      totalRemainingUnits,
      totalSoldUnits,
      under10Count,
      under5Count,
      outOfStockCount,
      visibleOnPortalCount
    };
  }, [accessories]);

  const under5Items = useMemo(
    () => accessories.filter((a) => (Number(a.stock_count) || 0) < 5),
    [accessories]
  );

  const triggeredUnder5Item = useMemo(
    () => (latestTriggeredUnder5AlertId ? accessories.find((a) => a.id === latestTriggeredUnder5AlertId && a.stock_count < 5) || null : null),
    [accessories, latestTriggeredUnder5AlertId]
  );

  const formatINR = (val: any) => {
    if (val === null || val === undefined || val === '') return '₹0';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('₹') && /\d/.test(trimmed)) return trimmed;
      const digits = trimmed.replace(/[^\d.]/g, '');
      const parsed = parseFloat(digits);
      if (!isNaN(parsed)) return '₹' + Math.round(parsed).toLocaleString('en-IN');
      return '₹0';
    }
    const num = Number(val);
    if (isNaN(num)) return '₹0';
    return '₹' + Math.round(num).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn pb-6 sm:pb-12">
      {/* Hidden File Inputs for Device-Adaptive Gallery / Camera Choosers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleMultipleFilesChosen}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleMultipleFilesChosen}
        className="hidden"
      />

      {/* Top Header Banner */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 relative z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                Accessories Inventory
              </span>
              <span className="hidden sm:inline text-xs text-slate-600 font-mono">
                Unlimited Photos &amp; Multi-Device Importer
              </span>
            </div>
            <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0" />
              <span className="truncate">Superbike Accessories</span>
            </h2>
            <p className="hidden sm:block text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed font-medium">
              Complete CRUD management for high-performance superbike exhausts, riding suits, carbon parts, crash protection, and fluids.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            {onToggleSectionVisibility && (
              <PublicVisibilityToggle
                compact
                label="Accessories"
                isVisible={isSectionVisible}
                onToggle={onToggleSectionVisibility}
              />
            )}
            <button
              type="button"
              onClick={openCreateModal}
              className={`min-h-[38px] sm:min-h-[40px] px-3 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer ${!onToggleSectionVisibility ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Add Accessory</span>
            </button>
          </div>
        </div>

        {/* Owner-Only Section Call & WhatsApp Helpline Bar (Hidden from Workers) */}
        {isOwner && onSaveSectionPhone && (
          <div className="relative z-10">
            <OwnerSectionPhoneControl
              isOwner={isOwner}
              sectionLabel="Accessories Call & WhatsApp"
              phoneValue={accessoriesDepartmentPhone || ''}
              accentColor="amber"
              onSavePhone={onSaveSectionPhone}
            />
          </div>
        )}
      </div>

      {/* 4 Stat Metric Cards (2x2 Clean Grid on Mobile, 4-Across on Laptop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5">
        {/* Total SKUs */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-600 mb-1 sm:mb-1.5">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider truncate">
              Accessory SKUs
            </span>
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tabular-nums leading-tight truncate">{stats.totalCount}</div>
          <div className="text-[11px] text-sky-700 font-medium mt-0.5 sm:mt-1 truncate">
            Across 7 categories
          </div>
        </div>

        {/* Total Inventory Stock Value */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-600 mb-1 sm:mb-1.5">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider truncate">
              Stock Value
            </span>
            <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tabular-nums leading-tight truncate">
            <span className="sm:hidden">{formatCompactINR(stats.totalValue)}</span>
            <span className="hidden sm:inline">{formatINR(stats.totalValue)}</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5 sm:mt-1 truncate">
            Inventory valuation
          </div>
        </div>

        {/* Remaining / Sold Summary */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-slate-600 mb-1 sm:mb-1.5">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider truncate">
              Website &amp; Sold
            </span>
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tabular-nums leading-tight truncate">
            {stats.totalRemainingUnits} <span className="text-[11px] sm:text-xs font-bold text-slate-600">Rem</span> · {stats.totalSoldUnits} <span className="text-[11px] sm:text-xs font-bold text-amber-700">Sold</span>
          </div>
          <div className="text-[11px] text-purple-700 font-medium mt-0.5 sm:mt-1 truncate">
            {stats.visibleOnPortalCount} SKUs live online
          </div>
        </div>

        {/* Stock Status Red Alert (<10 & <5) */}
        <div className={`rounded-2xl p-2.5 sm:p-4 border shadow-sm min-w-0 ${
          stats.under5Count > 0 || stats.under10Count > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between gap-1 text-slate-600 mb-1 sm:mb-1.5">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider truncate">
              Red Alerts (&lt;10/&lt;5)
            </span>
            <AlertTriangle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${stats.under5Count > 0 || stats.under10Count > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-lg sm:text-2xl font-black font-mono tabular-nums leading-tight truncate ${
            stats.under5Count > 0 || stats.under10Count > 0 ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {stats.under5Count + accessories.filter(a => a.stock_count >= 5 && a.stock_count < 10).length}
          </div>
          <div className="text-[11px] text-red-700 font-semibold mt-0.5 sm:mt-1 truncate">
            {stats.under5Count} critical (&lt;5 WA) · {stats.under10Count} &lt;10
          </div>
        </div>
      </div>

      {/* Control Filter Bar + Accessories Dept Alert Handler Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accessory, brand, or bike model..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          {/* Stock, Visibility & View Mode Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] lg:flex items-center gap-2 min-w-0">
            {/* Stock Filter Dropdown */}
            <EditableSelect
              compact
              value={stockFilter}
              onChange={(val) => setStockFilter((val || 'ALL') as any)}
              containerClassName="min-w-0 lg:w-48"
              manualPlaceholder="Qty or <10 / <5..."
              options={[
                { value: 'ALL', label: 'All Stock Levels' },
                { value: 'in_stock', label: 'Healthy Stock (≥10)' },
                { value: 'under_10', label: 'Red Alert: Under 10 (<10)' },
                { value: 'under_5', label: 'Critical Red + WhatsApp (<5)' },
                { value: 'out_of_stock', label: 'Out of Stock (0)' },
              ]}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center gap-2 sm:contents min-w-0">
              {/* Visibility Filter */}
              <EditableSelect
                compact
                value={visibilityFilter}
                onChange={(val) => setVisibilityFilter((val || 'ALL') as any)}
                containerClassName="flex-1 min-w-0 lg:w-40 lg:flex-none"
                manualPlaceholder="Visible / Hidden..."
                options={[
                  { value: 'ALL', label: 'All Visibility' },
                  { value: 'visible', label: 'Visible on Portal' },
                  { value: 'hidden', label: 'Hidden from Portal' },
                ]}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
              />

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${viewMode === 'table' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Accessories Department Alert Handler & Under-5 WhatsApp Dispatch Bar */}
        <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3 ${
          under5Items.length > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-red-700">
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
              <span>Dept Alert (&lt;10 Red · &lt;5 WA):</span>
            </div>
            {isOwner ? (
              <EditableSelect
                compact
                value={deptHandlerSelection}
                onChange={(val) => setDeptHandlerSelection(val || 'myself')}
                containerClassName="w-full sm:w-72"
                manualPlaceholder="Write name & WhatsApp number..."
                options={[
                  {
                    value: 'myself',
                    label: `Myself (${currentUser?.name || 'Owner'} · ${currentUser?.phone || '9014540489'})`,
                  },
                  {
                    value: 'dept_desk',
                    label: `Accessories Dept Desk (${accessoriesDepartmentPhone || '+91 9014540489'})`,
                  },
                  ...accessoriesDeptStaff.map((s) => ({
                    value: `staff:${s.id}`,
                    label: `${s.name} · ${s.phone} (Accessories Dept)`,
                  })),
                ]}
                className="px-2.5 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
              />
            ) : (
              <select
                value={
                  ['myself', 'dept_desk', ...accessoriesDeptStaff.map((s) => `staff:${s.id}`)].includes(deptHandlerSelection)
                    ? deptHandlerSelection
                    : 'dept_desk'
                }
                onChange={(e) => setDeptHandlerSelection(e.target.value || 'dept_desk')}
                className="w-full sm:w-72 px-2.5 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="dept_desk">
                  Accessories Dept Desk ({accessoriesDepartmentPhone || '+91 9014540489'})
                </option>
                <option value="myself">
                  Myself ({currentUser?.name || 'Staff'})
                </option>
                {accessoriesDeptStaff.map((s) => (
                  <option key={s.id} value={`staff:${s.id}`}>
                    {s.name} (Accessories Dept)
                  </option>
                ))}
              </select>
            )}
          </div>

          {under5Items.length > 0 && (
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-red-700">
                {under5Items.length} item{under5Items.length > 1 ? 's' : ''} &lt;5 qty!
              </span>
              <a
                href={buildWhatsAppUrl(
                  activeDeptHandler.phone,
                  [
                    `URGENT ACCESSORIES STOCK ALERT (<5 UNITS) — Adarsh Motors`,
                    `Attention: ${activeDeptHandler.label}`,
                    ...under5Items.map(
                      (i) =>
                        `• ${i.title}: ${i.stock_count} remaining (${Number(i.sold_count) || 0} sold out)`
                    ),
                  ].join('\n')
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>WA Alert {activeDeptHandler.label.split('(')[0].trim()}</span>
              </a>
            </div>
          )}
        </div>

        {/* Immediate Highlighted Alert if Stock Just Dropped Under 5 */}
        {triggeredUnder5Item && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-700 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                STOCK ALERT (&lt;5): &quot;{triggeredUnder5Item.title}&quot; has {triggeredUnder5Item.stock_count} remaining ({Number(triggeredUnder5Item.sold_count) || 0} sold). Notify {activeDeptHandler.label} on WhatsApp:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={buildUnder5WhatsAppUrl(triggeredUnder5Item)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send WhatsApp Alert Now</span>
              </a>
              <button
                type="button"
                onClick={() => setLatestTriggeredUnder5AlertId(null)}
                className="p-1 text-red-700 hover:text-slate-900 cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pt-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Accessory Inventory View: SHOWROOM REFERENCE CARD GRID */}
      {viewMode === 'grid' ? (
        filteredAccessories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-600 shadow-sm">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-400 mb-3" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">No accessories matched your filter</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Try resetting the search keyword or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredAccessories.map((item) => {
              const galleryImages = (item.gallery_urls && item.gallery_urls.length > 0)
                ? item.gallery_urls
                : [item.image_url];
              const totalImages = galleryImages.length;
              const currentSlideIdx = (carouselIndices[item.id] || 0) % totalImages;
              const currentDisplayImage = normalizeLocalAssetUrl(
                galleryImages[currentSlideIdx] || item.image_url,
                FALLBACK_SHOWROOM_IMAGE
              );
              const shortCategory = item.category.split(' ')[0];

              const remQty = Number(item.stock_count) || 0;
              const soldQty = Number(item.sold_count) || 0;
              const totalStocked = remQty + soldQty;
              const isUnder10 = remQty < 10;
              const isUnder5 = remQty < 5;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 flex flex-col justify-between group ${
                    isUnder5
                      ? 'bg-white border-red-300 ring-1 ring-red-500/20'
                      : isUnder10
                      ? 'bg-white border-red-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Edge-to-Edge Top Image Stage */}
                    <div
                      onClick={() => openShowcaseModal(item)}
                      className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden select-none cursor-pointer group/img border-b border-slate-200"
                      title={`Click to open full showcase & high-res angles for ${item.title}`}
                    >
                      <img
                        src={currentDisplayImage}
                        alt={`${item.title} - photo ${currentSlideIdx + 1}`}
                        className="w-full h-full object-cover transition duration-300 group-hover/img:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/20 pointer-events-none"></div>

                      {/* Top Corner Badges (Non-Overlapping Left Category & Right Brand) */}
                      <div className="absolute top-2 inset-x-2 z-10 flex items-start justify-between gap-1.5 pointer-events-none">
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-black uppercase tracking-wider bg-red-600/95 text-white border border-red-400/50 shadow truncate max-w-[48%]">
                          {shortCategory}
                        </span>
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold bg-black/85 backdrop-blur-md text-white border border-white/20 shadow truncate max-w-[48%]">
                          {item.brand}
                        </span>
                      </div>

                      {/* Carousel Slider Chevrons */}
                      {totalImages > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleCarouselPrev(e, item.id, totalImages)}
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 transition cursor-pointer"
                            title="Previous Photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCarouselNext(e, item.id, totalImages)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 transition cursor-pointer"
                            title="Next Photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Bottom Compact Bar: Portal Live/Hidden Switch + Slide Dots + Quick Showcase Icon */}
                      <div
                        className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(item)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border shadow-sm transition cursor-pointer ${
                            item.is_visible_on_portal
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-900/85 border-white/25 text-slate-200 hover:text-white'
                          }`}
                          title={item.is_visible_on_portal ? "Visible on Customer Website (Click to Hide)" : "Hidden from Customer Website (Click to Publish)"}
                        >
                          {item.is_visible_on_portal ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-200" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>

                        {totalImages > 1 && (
                          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-black/75 backdrop-blur-sm border border-white/15">
                            {galleryImages.slice(0, 5).map((_, dotIdx) => (
                              <span
                                key={dotIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCarouselIndices(prev => ({ ...prev, [item.id]: dotIdx }));
                                }}
                                className={`cursor-pointer rounded-full transition-all ${
                                  dotIdx === currentSlideIdx
                                    ? 'w-3 h-1.5 bg-red-500'
                                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => openShowcaseModal(item)}
                          className="p-1.5 rounded-lg bg-black/80 backdrop-blur-md text-slate-200 hover:text-white border border-white/20 transition cursor-pointer shrink-0"
                          title="View Fullscreen Showcase"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body: Brand/Category -> Bold Title -> Wrench Fitment */}
                    <div className="p-3 sm:p-4 pb-0 sm:pb-0">
                      <div className="text-xs font-black uppercase tracking-wider text-red-600 truncate mb-0.5">
                        {item.brand} · {shortCategory}
                      </div>

                      <h3
                        onClick={() => openShowcaseModal(item)}
                        className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight line-clamp-2 min-h-[2.75rem] leading-snug cursor-pointer hover:text-red-600 transition"
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      <div className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 truncate">
                        <Wrench className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="truncate">
                          {item.compatibility_models?.[0] || 'Universal Superbike Fit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Divider -> OFFER PRICE + Stock & Sold Ledger + Red Dept & WhatsApp Alert -> Admin Strip */}
                  <div className="p-2.5 sm:p-4 pt-2.5 sm:pt-3">
                    <div className="pt-2.5 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        OFFER PRICE
                      </div>

                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="text-base sm:text-xl font-black text-slate-900 font-mono tracking-tight truncate tabular-nums">
                          {formatINR(item.price)}
                        </div>
                        {remQty === 0 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold uppercase bg-red-600 text-white border border-red-600 shrink-0">
                            OUT (0 LEFT)
                          </span>
                        ) : isUnder5 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold uppercase bg-red-600 text-white border border-red-600 shrink-0">
                            CRITICAL &lt;5 ({remQty})
                          </span>
                        ) : isUnder10 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold uppercase bg-red-50 text-red-700 border border-red-200 shrink-0">
                            LOW &lt;10 ({remQty})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            IN STOCK ({remQty})
                          </span>
                        )}
                      </div>

                      {/* Complete Remaining / Sold Out / Website Quantity Breakdown (Right Here Only) */}
                      <div className={`mt-2.5 grid grid-cols-2 gap-1.5 p-2 rounded-xl border text-xs ${
                        isUnder10
                          ? 'bg-red-50 border-red-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-600">Still Remains</span>
                          <span className={`font-mono font-black text-sm tabular-nums ${
                            isUnder10 ? 'text-red-700' : 'text-emerald-700'
                          }`}>
                            {remQty} in stock
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-600">Sold Out</span>
                          <span className="font-mono font-black text-sm text-amber-800 tabular-nums">
                            {soldQty} sold
                          </span>
                        </div>
                        <div className="flex flex-col pt-1 border-t border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-600">Website Qty</span>
                          <span className={`font-mono font-bold text-xs ${
                            !item.is_visible_on_portal
                              ? 'text-slate-500'
                              : isUnder10
                              ? 'text-red-700'
                              : 'text-sky-700'
                          }`}>
                            {item.is_visible_on_portal
                              ? remQty > 0
                                ? `${remQty} Live`
                                : '0 (Out)'
                              : 'Hidden'}
                          </span>
                        </div>
                        <div className="flex flex-col text-right pt-1 border-t border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-600">Total Stocked</span>
                          <span className="font-mono font-bold text-xs text-slate-700 tabular-nums">
                            {totalStocked} units
                          </span>
                        </div>
                      </div>

                      {/* Department Red Alert (<10) & WhatsApp Alert (<5) */}
                      {isUnder10 && (
                        <div className="mt-2 p-2.5 rounded-xl border space-y-2 bg-red-50 border-red-200 text-red-700">
                          <div className="flex items-start gap-1.5 text-xs font-bold leading-snug">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="uppercase tracking-wide font-black text-red-700">
                                {remQty === 0
                                  ? 'RED ALERT · OUT OF STOCK (0)'
                                  : isUnder5
                                  ? `RED ALERT · UNDER 5 (${remQty} LEFT)`
                                  : `RED ALERT · UNDER 10 (${remQty} LEFT)`}
                              </div>
                              <div className="text-[11px] font-medium text-red-700 mt-0.5">
                                Dept Alert: {activeDeptHandler.label}
                              </div>
                            </div>
                          </div>

                          {isUnder5 && (
                            <a
                              href={buildUnder5WhatsAppUrl(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">WhatsApp Alert ({activeDeptHandler.phone})</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Full-Width Primary Action */}
                      <button
                        type="button"
                        onClick={() => openShowcaseModal(item)}
                        className="w-full min-h-[44px] mt-3 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98] cursor-pointer"
                      >
                        <Eye className="w-4 h-4 shrink-0" />
                        <span className="truncate">Open Showcase</span>
                      </button>

                      {/* Touch-Friendly Admin Controls */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2">
                        <div className={`flex items-center justify-between rounded-xl px-3 py-1.5 border ${
                          isUnder10
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`text-xs font-semibold ${isUnder10 ? 'text-red-700' : 'text-slate-700'}`}>
                            Stock Qty
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item, -1)}
                              className="w-9 h-9 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-base active:scale-95 transition cursor-pointer"
                              title="Mark 1 Sold / Decrease Stock"
                            >
                              -
                            </button>
                            <span className={`font-mono font-black min-w-[1.75rem] text-center text-sm tabular-nums ${
                              isUnder10 ? 'text-red-700' : 'text-slate-900'
                            }`}>
                              {remQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item, 1)}
                              className="w-9 h-9 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-base active:scale-95 transition cursor-pointer"
                              title="Restock +1 Unit"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="min-h-[42px] py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 text-sm font-semibold"
                            title="Edit Accessory & Manage Carousel Photos"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            className="min-h-[42px] py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer flex items-center justify-center gap-1.5 text-sm font-semibold"
                            title="Delete Accessory from Inventory & Customer Portal"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Accessory Title &amp; Brand</th>
                  <th className="py-3.5 px-4">Photos (Carousel)</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Compatibility</th>
                  <th className="py-3.5 px-4 text-right">Price (INR)</th>
                  <th className="py-3.5 px-4 text-center">Remaining / Sold</th>
                  <th className="py-3.5 px-4 text-center">Website Qty</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAccessories.map((item) => {
                  const galleryImages = (item.gallery_urls && item.gallery_urls.length > 0)
                    ? item.gallery_urls
                    : [item.image_url];
                  const remQty = Number(item.stock_count) || 0;
                  const soldQty = Number(item.sold_count) || 0;
                  const isUnder10 = remQty < 10;
                  const isUnder5 = remQty < 5;

                  return (
                    <tr key={item.id} className={`transition ${isUnder5 ? 'bg-red-50 hover:bg-red-100/80' : isUnder10 ? 'bg-red-50/60 hover:bg-red-100/60' : 'hover:bg-slate-50'}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={normalizeLocalAssetUrl(item.image_url, '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png')}
                            alt={item.title}
                            className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png";
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate max-w-xs">{item.title}</div>
                            <div className="text-xs text-slate-700 font-mono flex items-center gap-2">
                              <span className="text-red-600 font-semibold">{item.brand}</span>
                              {item.sku && <span>SKU: {item.sku}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setLightboxData({ title: item.title, images: galleryImages, activeIdx: 0 })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sky-700 font-mono font-bold text-xs transition cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{galleryImages.length} Slides</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 text-xs sm:text-sm">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(item.compatibility_models || []).slice(0, 2).map((m, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono">
                              {m}
                            </span>
                          ))}
                          {(item.compatibility_models || []).length > 2 && (
                            <span className="text-xs text-slate-600 font-mono">
                              +{item.compatibility_models.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-mono text-sm tabular-nums">
                        {formatINR(item.price)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item, -1)}
                              className="w-7 h-7 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-sm cursor-pointer"
                              title="Mark 1 Sold / Reduce"
                            >
                              -
                            </button>
                            <span className={`font-mono font-black w-8 text-center text-sm tabular-nums ${isUnder10 ? 'text-red-700' : 'text-emerald-700'}`}>
                              {remQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item, 1)}
                              className="w-7 h-7 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-sm cursor-pointer"
                              title="Restock +1"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-[11px] font-mono text-amber-800">
                            {soldQty} sold · Total {remQty + soldQty}
                          </div>
                          {isUnder5 && (
                            <a
                              href={buildUnder5WhatsAppUrl(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp &lt;5</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(item)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                            item.is_visible_on_portal
                              ? isUnder10
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.is_visible_on_portal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{item.is_visible_on_portal ? `${remQty} Live` : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openShowcaseModal(item)}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer"
                            title="Open Full Showcase Modal"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer"
                            title="Edit Accessory"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer"
                            title="Delete Accessory"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT SUPERBIKE ACCESSORY                     */}
      {/* ========================================================= */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-lg relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
            {/* Pinned Modal Header */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="truncate">{editingAccessory ? 'Edit Superbike Accessory' : 'Add Superbike Accessory'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 truncate">
                  Enter stock, specs, verified fitment, workshop &amp; air delivery details shown on the customer website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center shrink-0 cursor-pointer transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="accessory-upsert-form" onSubmit={handleSaveAccessory} className="p-4 sm:p-6 space-y-5 text-sm overflow-y-auto flex-1">
              {/* SECTION 1: BASIC ACCESSORY INFO & STOCK */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="text-xs font-black uppercase tracking-wider text-red-600">
                  1. Basic Details &amp; Stock Ledger
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Accessory Title / Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Akrapovič Evolution Titanium Full System"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Brand / Manufacturer *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Akrapovič, Dainese"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                    <EditableSelect
                      value={formCategory}
                      onChange={(val) => setFormCategory(val as any)}
                      manualPlaceholder="Write custom category..."
                      options={[
                        { value: 'Exhaust & Performance', label: 'Exhaust & Performance' },
                        { value: 'Riding Gear & Protection', label: 'Riding Gear & Protection' },
                        { value: 'Chassis & Sliders', label: 'Chassis & Sliders' },
                        { value: 'Carbon & Aerodynamics', label: 'Carbon & Aerodynamics' },
                        { value: 'Braking & Controls', label: 'Braking & Controls' },
                        { value: 'Luggage & Mounts', label: 'Luggage & Mounts' },
                        { value: 'Fluids & Maintenance', label: 'Fluids & Maintenance' },
                      ]}
                      className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price (INR) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Remaining Stock {formStock < 10 ? <span className="text-red-600">({formStock < 5 ? '<5 WA Alert' : '<10 Red'})</span> : null}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm text-slate-900 font-mono tabular-nums focus:outline-none border ${
                        formStock < 10
                          ? 'bg-red-50 border-red-200 focus:border-red-500'
                          : 'bg-white border-slate-200 focus:border-red-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sold Out Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={formSoldCount}
                      onChange={(e) => setFormSoldCount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description &amp; Overview *</label>
                    <textarea
                      rows={2}
                      required
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Material specs, weight saving, sound profile, homologation..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SKU / Part Code</label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="e.g. AKR-EVO-ZX10R"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CUSTOMER SHOWCASE DETAILS (VERIFIED FITMENT, BUILD, WORKSHOP, AIR DELIVERY) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-sky-700">
                      2. Customer Showcase Card Details (Shown on Website)
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      These exact details appear in the customer showcase pop-up grid when buyers view this accessory.
                    </p>
                  </div>
                </div>

                {/* Compatibility Models Tags + Verified Fitment Note */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Verified Fitment — Compatible Bike Models ({formCompatibility.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl min-h-[44px]">
                    {formCompatibility.map((mod) => (
                      <span
                        key={mod}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-900 font-mono text-xs border border-slate-200"
                      >
                        <span>{mod}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompatibilityTag(mod)}
                          className="text-slate-600 hover:text-red-600 ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {formCompatibility.length === 0 && (
                      <span className="text-slate-600 text-xs sm:text-sm">No models selected yet</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCompatibilityInput}
                      onChange={(e) => setNewCompatibilityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCompatibilityTag(newCompatibilityInput);
                        }
                      }}
                      placeholder="Add bike model (e.g. Kawasaki Ninja ZX-10R / Z900)"
                      className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCompatibilityTag(newCompatibilityInput)}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs sm:text-sm shrink-0 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                    <span className="text-slate-600 font-semibold">Quick add:</span>
                    {AVAILABLE_BIKES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleAddCompatibilityTag(b)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-mono cursor-pointer text-xs"
                      >
                        + {b}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Verified Fitment Note
                    </label>
                    <input
                      type="text"
                      value={formFitmentNote}
                      onChange={(e) => setFormFitmentNote(e.target.value)}
                      placeholder="e.g. Plug-and-play fitment with zero chassis modification."
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Technical Build & Material */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-amber-800 uppercase mb-1">
                      Technical Build &amp; Material Headline
                    </label>
                    <input
                      type="text"
                      value={formMaterialSpec}
                      onChange={(e) => setFormMaterialSpec(e.target.value)}
                      placeholder="e.g. Full Titanium Decat · WSBK Spec · 4.8kg Weight Reduction"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-800 uppercase mb-1">
                      Build &amp; Warranty Detail
                    </label>
                    <input
                      type="text"
                      value={formMaterialDetail}
                      onChange={(e) => setFormMaterialDetail(e.target.value)}
                      placeholder="e.g. Original race-spec hardware with authentic manufacturer warranty."
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Workshop Fitment & Express Pan-India Air Delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">
                        Workshop Fitment Heading
                      </label>
                      <input
                        type="text"
                        value={formWorkshopTitle}
                        onChange={(e) => setFormWorkshopTitle(e.target.value)}
                        placeholder="e.g. Workshop Fitment Available"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Workshop Fitment Note
                      </label>
                      <input
                        type="text"
                        value={formWorkshopDetail}
                        onChange={(e) => setFormWorkshopDetail(e.target.value)}
                        placeholder="e.g. Professional installation available across all Adarsh Motors bays."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-bold text-blue-700 uppercase mb-1">
                        Delivery &amp; Dispatch Heading
                      </label>
                      <input
                        type="text"
                        value={formDeliveryTitle}
                        onChange={(e) => setFormDeliveryTitle(e.target.value)}
                        placeholder="e.g. Express Pan-India Air Delivery"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Delivery &amp; Tracking Note
                      </label>
                      <input
                        type="text"
                        value={formDeliveryDetail}
                        onChange={(e) => setFormDeliveryDetail(e.target.value)}
                        placeholder="e.g. Insured air dispatch with live tracking to your doorstep."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* GST Tag, Warranty & Authenticity Serial Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">
                      Authentic Import &amp; GST Tag
                    </label>
                    <input
                      type="text"
                      value={formGstBadge}
                      onChange={(e) => setFormGstBadge(e.target.value)}
                      placeholder="100% AUTHENTIC IMPORT · GST BILL INCLUDED"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-emerald-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Warranty Badge / Certification
                    </label>
                    <input
                      type="text"
                      value={formWarranty}
                      onChange={(e) => setFormWarranty(e.target.value)}
                      placeholder="e.g. 2-Year Official Akrapovič Warranty"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Bottom Serial / Authenticity Note
                    </label>
                    <input
                      type="text"
                      value={formAuthenticityNote}
                      onChange={(e) => setFormAuthenticityNote(e.target.value)}
                      placeholder="100% Authentic Brand Import with Official Serial Number."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: UNLIMITED ACCESSORY PHOTOS & CAROUSEL IMPORTER */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-red-500" />
                      <span>3. Unlimited Photos &amp; Sliding Carousel</span>
                    </label>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Import multiple photos from Mobile Gallery or PC files for smooth customer zoom &amp; preview.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 shrink-0 self-start sm:self-auto">
                    {formGalleryUrls.length} Photo{formGalleryUrls.length === 1 ? '' : 's'} Selected
                  </span>
                </div>

                {/* Device-Adaptive Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhotos}
                    className="min-h-[44px] p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    {isMobileDevice ? (
                      <>
                        <Smartphone className="w-4 h-4 text-white shrink-0" />
                        <span>Choose from Mobile Gallery / Files</span>
                      </>
                    ) : (
                      <>
                        <Laptop className="w-4 h-4 text-white shrink-0" />
                        <span>Choose Files from PC / Computer</span>
                      </>
                    )}
                  </button>

                  {isMobileDevice ? (
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="min-h-[44px] p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Snap Live with Camera</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[44px] p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Import Unlimited Photos</span>
                    </button>
                  )}
                </div>

                {/* Showroom Presets & Manual Web URL Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-700 font-semibold">Showroom Presets:</span>
                    {PRESET_GALLERY_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (!formGalleryUrls.includes(img.url)) {
                            setFormGalleryUrls(prev => [...prev, img.url]);
                            if (!primaryCoverUrl) setPrimaryCoverUrl(img.url);
                            showToast(`Added ${img.label} preset!`);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-900 transition cursor-pointer"
                      >
                        + {img.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowManualUrlBox(!showManualUrlBox)}
                    className="text-sky-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showManualUrlBox ? 'Hide URL Box' : '+ Paste Web Image URL'}</span>
                  </button>
                </div>

                {showManualUrlBox && (
                  <div className="flex gap-2 pt-1 animate-fadeIn">
                    <input
                      type="url"
                      value={manualUrlInput}
                      onChange={(e) => setManualUrlInput(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualUrl}
                      className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shrink-0 cursor-pointer"
                    >
                      Add Photo
                    </button>
                  </div>
                )}

                {formGalleryUrls.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span>Carousel Slide Order (Hover/Tap star to set cover):</span>
                      <button
                        type="button"
                        onClick={() => setFormGalleryUrls([])}
                        className="text-red-700 hover:underline text-xs font-semibold cursor-pointer"
                      >
                        Clear All Photos
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                      {formGalleryUrls.map((url, idx) => {
                        const isPrimary = (url === primaryCoverUrl) || (!primaryCoverUrl && idx === 0);
                        return (
                          <div
                            key={idx}
                            className={`relative aspect-square rounded-xl overflow-hidden border group transition ${
                              isPrimary ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {isPrimary && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[10px] uppercase tracking-wider shadow">
                                Cover
                              </div>
                            )}

                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[10px]">
                              #{idx + 1}
                            </div>

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryCover(url)}
                                  className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer"
                                  title="Set as Primary Cover Photo"
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryPhoto(idx)}
                                className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition cursor-pointer"
                                title="Remove Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customer Portal Visibility */}
                <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm">Customer Portal Visibility</div>
                    <div className="text-xs text-slate-600">Show in public showroom &amp; accessory catalog</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsVisible(!formIsVisible)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      formIsVisible ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                        formIsVisible ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </form>

            {/* Pinned Modal Footer */}
            <div className="px-4 py-3.5 sm:px-6 border-t border-slate-200 bg-white grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold cursor-pointer text-sm border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="accessory-upsert-form"
                disabled={isProcessingPhotos}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm cursor-pointer disabled:opacity-50 text-sm"
              >
                {editingAccessory ? 'Save Changes' : 'Create Accessory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULLSCREEN CAROUSEL LIGHTBOX MODAL */}
      {lightboxData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="w-full max-w-4xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white mb-2">
              <div>
                <h3 className="font-black text-lg text-white">{lightboxData.title}</h3>
                <span className="text-sm text-slate-300 font-mono">
                  Slide {lightboxData.activeIdx + 1} of {lightboxData.images.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxData(null)}
                className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center">
              <img
                src={lightboxData.images[lightboxData.activeIdx]}
                alt="Fullscreen slide"
                className="max-w-full max-h-full object-contain"
              />

              {lightboxData.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setLightboxData(prev => prev ? ({
                      ...prev,
                      activeIdx: (prev.activeIdx - 1 + prev.images.length) % prev.images.length
                    }) : null)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLightboxData(prev => prev ? ({
                      ...prev,
                      activeIdx: (prev.activeIdx + 1) % prev.images.length
                    }) : null)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {lightboxData.images.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full p-2 bg-black/50 rounded-xl border border-white/15">
                {lightboxData.images.map((imgUrl, thumbIdx) => (
                  <button
                    key={thumbIdx}
                    type="button"
                    onClick={() => setLightboxData(prev => prev ? ({ ...prev, activeIdx: thumbIdx }) : null)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border transition shrink-0 cursor-pointer ${
                      thumbIdx === lightboxData.activeIdx
                        ? 'border-red-500 ring-2 ring-red-500/50 scale-105'
                        : 'border-white/25 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER ACCESSORY SHOWCASE (2-Column Responsive Split on Laptop, Clean Stack on Mobile) */}
      {selectedAccessoryForShowcase && (() => {
        const specs = resolveAccessoryShowcaseFields(selectedAccessoryForShowcase);
        const photos =
          selectedAccessoryForShowcase.gallery_urls && selectedAccessoryForShowcase.gallery_urls.length > 0
            ? selectedAccessoryForShowcase.gallery_urls
            : [selectedAccessoryForShowcase.image_url];
        const activeIndex = Math.min(showcasePhotoIndex, photos.length - 1);
        const currentPhoto = photos[activeIndex] || selectedAccessoryForShowcase.image_url;
        const remQty = Number(selectedAccessoryForShowcase.stock_count) || 0;
        const soldQty = Number(selectedAccessoryForShowcase.sold_count) || 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg my-auto flex flex-col max-h-[92vh]">
              {/* Top Sticky Header */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-700 truncate">
                    {specs.gst_badge}
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate mt-0.5">
                    {selectedAccessoryForShowcase.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const item = selectedAccessoryForShowcase;
                      setSelectedAccessoryForShowcase(null);
                      openEditModal(item);
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Edit Specs & Photos"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                    <span className="hidden sm:inline">Edit Specs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAccessoryForShowcase(null)}
                    className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                    aria-label="Close showcase"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Balanced Scrollable Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Clean Contained Photo Stage + Thumbnails + Stock Summary */}
                  <div className="lg:col-span-5 space-y-3">
                    <div
                      onClick={() =>
                        setLightboxData({
                          title: selectedAccessoryForShowcase.title,
                          images: photos,
                          activeIdx: activeIndex,
                        })
                      }
                      className="relative w-full h-[220px] sm:h-[270px] lg:h-[300px] rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center cursor-zoom-in group"
                    >
                      <img
                        src={normalizeLocalAssetUrl(currentPhoto, '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png')}
                        alt={`${selectedAccessoryForShowcase.title} angle ${activeIndex + 1}`}
                        className="max-w-full max-h-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png';
                        }}
                      />

                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/80 border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1 pointer-events-none">
                        <ZoomIn className="w-3.5 h-3.5 text-sky-300" />
                        <span>Tap for big zoom</span>
                      </span>

                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowcasePhotoIndex((activeIndex - 1 + photos.length) % photos.length);
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 transition cursor-pointer"
                            aria-label="Previous photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowcasePhotoIndex((activeIndex + 1) % photos.length);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 transition cursor-pointer"
                            aria-label="Next photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip & Slideshow Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      {photos.length > 1 ? (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                          {photos.map((pUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setShowcasePhotoIndex(idx)}
                              className={`relative rounded-lg overflow-hidden w-14 h-11 shrink-0 border-2 transition cursor-pointer ${
                                idx === activeIndex
                                  ? 'border-red-500 shadow-sm'
                                  : 'border-slate-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={pUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-slate-500">1 Studio Image</span>
                      )}

                      {photos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setIsShowcaseAutoPlaying(!isShowcaseAutoPlaying)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 border cursor-pointer ${
                            isShowcaseAutoPlaying
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                          }`}
                        >
                          {isShowcaseAutoPlaying ? 'Auto: ON' : 'Auto: OFF'}
                        </button>
                      )}
                    </div>

                    {/* Stock & SKU Summary Row */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Remaining</div>
                        <div className={`text-sm font-black font-mono tabular-nums ${remQty < 10 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {remQty} Units
                        </div>
                      </div>
                      <div className="min-w-0 border-x border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Sold Out</div>
                        <div className="text-sm font-black font-mono tabular-nums text-amber-800">
                          {soldQty} Units
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-slate-500">SKU</div>
                        <div className="text-xs font-bold font-mono text-slate-900 truncate px-1">
                          {selectedAccessoryForShowcase.sku || 'ACC-OEM'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Price + 2x2 Structured Showcase Specs + Description */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Price & Status Banner */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-wider text-red-600">
                          {selectedAccessoryForShowcase.brand} · {selectedAccessoryForShowcase.category}
                        </div>
                        <div className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
                          {selectedAccessoryForShowcase.warranty_badge || 'Official Brand Warranty'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
                          {formatINR(selectedAccessoryForShowcase.price)}
                        </div>
                        <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          remQty === 0
                            ? 'bg-red-600 text-white'
                            : remQty < 5
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {remQty === 0 ? 'Out of Stock' : remQty < 5 ? `Only ${remQty} Left` : `${remQty} In Stock`}
                        </span>
                      </div>
                    </div>

                    {/* 2x2 Showcase Highlight Grid Matching Customer Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Box 1: Verified Fitment */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-wider text-red-600">
                            VERIFIED FITMENT
                          </div>
                          <div className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                            {selectedAccessoryForShowcase.compatibility_models?.length
                              ? selectedAccessoryForShowcase.compatibility_models.slice(0, 3).join(' / ')
                              : 'Universal Superbike Fit'}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {specs.fitment_note}
                          </p>
                        </div>
                      </div>

                      {/* Box 2: Technical Build & Material */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                            TECHNICAL BUILD &amp; MATERIAL
                          </div>
                          <div className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                            {specs.material_spec}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {specs.material_detail}
                          </p>
                        </div>
                      </div>

                      {/* Box 3: Workshop Fitment */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 leading-snug">
                            {specs.workshop_title}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {specs.workshop_detail}
                          </p>
                        </div>
                      </div>

                      {/* Box 4: Express Delivery */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 leading-snug">
                            {specs.delivery_title}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {specs.delivery_detail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description & All Compatible Tags */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {selectedAccessoryForShowcase.description || 'Official Adarsh Motors imported superbike accessory and race hardware.'}
                      </p>
                      {selectedAccessoryForShowcase.compatibility_models && selectedAccessoryForShowcase.compatibility_models.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedAccessoryForShowcase.compatibility_models.map((mod, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-sky-700">
                              {mod}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Showcase Footer */}
              <div className="px-4 py-3.5 sm:px-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="truncate">{specs.authenticity_note}</span>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Hi Adarsh Motors, I am interested in ${selectedAccessoryForShowcase.title} (${formatINR(selectedAccessoryForShowcase.price)}).`;
                      window.open(buildWhatsAppUrl(accessoriesDepartmentPhone || '9014540489', text), '_blank', 'noopener,noreferrer');
                    }}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAccessoryForShowcase(null)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-semibold transition cursor-pointer border border-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Delete Accessory?</h3>
            <p className="text-sm text-slate-600 mt-1.5 mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmItem.title}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-sm cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccessory}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
