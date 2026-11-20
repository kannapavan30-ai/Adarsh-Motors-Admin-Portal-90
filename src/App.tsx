/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ResponsiveContainer,
  BarChart,
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
  Pie
} from 'recharts';
import {
  ShieldCheck, Phone, KeyRound, ArrowRight, Crown, UserCheck,
  LayoutDashboard, Bike, PhoneCall, Receipt, MapPin, Sliders,
  Users, LogOut, Search, Plus, RefreshCw, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, IndianRupee, UserPlus, CheckCircle, AlertCircle,
  Bell, MessageCircle, PackageOpen, Pencil, Trash2, Printer,
  X, Save, Copy, Database, Menu, Navigation, Eye, EyeOff,
  Upload, Image as ImageIcon, Camera, FolderOpen, Download,
  FileText, FileCheck, Zap, Check, ExternalLink, Sparkles, Car, FileBadge,
  History, Fuel, Calendar, Gauge, Timer, Layers, ChevronLeft, ChevronRight,
  CheckCircle2, Calculator, Wallet, Percent, BarChart3, AlertTriangle, PieChart as PieChartIcon, Edit2, Lock, DollarSign,
  LayoutGrid, List, Info, Globe, Share2, Clock, Headphones, Compass, ToggleLeft, ToggleRight, Building, MessageSquare, Wrench, ArrowRightLeft
} from 'lucide-react';
import CustomerPaperTransferManager from './components/CustomerPaperTransferManager';
import SuperbikeAccessoriesManager from './components/SuperbikeAccessoriesManager';
import WebsiteSectionVisibilityManager from './components/WebsiteSectionVisibilityManager';
import CustomerLiveWebsitePreviewModal from './components/CustomerLiveWebsitePreviewModal';
import PublicVisibilityToggle from './components/PublicVisibilityToggle';
import EditableSelect from './components/EditableSelect';
import {
  AuditActivityFeed,
  extractReadableAuditChanges,
  formatActionBadge,
} from './components/AuditActivityFeed';
import LeadsCrmSection from './components/LeadsCrmSection';
import SpecializedLeadsSection from './components/SpecializedLeadsSection';
import DigitalBillingSection from './components/DigitalBillingSection';
import PnlAnalyticsSection from './components/PnlAnalyticsSection';
import BranchManagerSection from './components/BranchManagerSection';
import SocialChannelsPanel from './components/SocialChannelsPanel';
import BikeInventorySection from './components/BikeInventorySection';
import OwnerAndStaffAccessSection, { type OwnerAccount } from './components/OwnerAndStaffAccessSection';
import {
  DeliveryNoteSheet,
  DeliveryNoteDetails,
  generateDeliveryNoteHtml,
  formatDeliveryDate,
  formatDeliveryTime
} from './components/DeliveryNoteInvoice';
import { UNIFIED_SUPABASE_SCHEMA_SQL } from './utils/supabaseSchema';
import {
  syncSectionVisibilityToSupabase,
  hydrateSettingsFromRows,
  broadcastLiveSync,
  buildWhatsAppUrl,
  formatTelHref,
  canonicalizeBikeCategory,
  isAccessoryItem,
  isBudgetVehicleCategory,
  normalizeBikeCategory,
  normalizeExistingBikeCategoriesInSupabase,
  matchesSpecializedLeadCategory,
  purgeAccessoriesFromBikesTable,
  WebsiteSectionKey,
  SECTION_SETTING_KEY_MAP,
  normalizeLocalAssetUrl,
  normalizeHeroSlides,
  FALLBACK_SHOWROOM_IMAGE,
  formatCompactINR
} from './utils/sectionVisibilitySync';
import { parseGoogleMapsLocation } from './utils/googleMapsLocation';
import { fetchAllBikesSafe } from './utils/fetchBikesSafe';

import {
  sendPhoneOtp,
  verifyPhoneOtp,
  getSavedOtpOperatorConfig,
  saveOtpOperatorConfig,
  OtpOperatorConfig,
  OtpOperatorMode,
} from './utils/otpService';

// SUPABASE CONFIGURATION
export const SUPABASE_URL = "https://itmarysfybhcrmvnggyy.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bWFyeXNmeWJoY3Jtdm5nZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4ODIyOTUsImV4cCI6MjEwOTQ1ODI5NX0.1CaJDVO727VVbMNoh8O9Yx_khb7_TMMCp7UkZEIt9Uc";

// Centralized Supabase Client - Supports both CDN SDK (<script> in index.html) and @supabase/supabase-js
export const supabase = (typeof window !== 'undefined' && (window as any).supabase?.createClient)
  ? (window as any).supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OWNER_PHONE = "9014540489";

interface UserSession {
  name: string;
  phone: string;
  role: 'owner' | 'staff';
  permissions: string[];
}

export interface BikeColorway {
  name: string;
  hex: string;
}

export interface BikeItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  year: number;
  km: number;
  image_url: string;
  gallery_urls?: string[];
  status: 'Available' | 'Booked' | 'Sold' | 'Hidden' | (string & {});
  // Specifications from customer showroom website (Screenshots 1, 2, 3)
  displacement_cc?: string; // e.g. "1158 cc", "948 cc", "999 cc"
  engine_type?: string;     // e.g. "V4 Granturismo", "Inline-4", "ShiftCam Boxer"
  engine?: string;          // Customer schema alias
  max_power?: string;       // e.g. "168 hp", "205 hp", "125 hp"
  hp?: string;              // Customer schema alias
  acceleration?: string;    // e.g. "3.1s", "2.9s", "3.4s"
  fuel_type?: string;       // e.g. "Petrol", "Unleaded Super 98", "Electric"
  fuel?: string;            // Customer schema alias
  badge?: string;           // Customer schema alias
  price_raw?: number;       // Raw numeric price
  location?: string;        // e.g. "Hyderabad – Main Showroom", "Hyderabad – Banjara Hills", "Bengaluru Branch"
  tagline?: string;         // e.g. "Muscular stance with superbike heart."
  colorways?: BikeColorway[];
  addon_gear_name?: string; // e.g. "Ducati Corse Riding Leather"
  addon_gear_price?: number;// e.g. 38500
  warranty_badge?: string;  // e.g. "Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty."
  // Dealership Financial Procurement & Margin Controls (Owner Confidential)
  purchase_cost?: number;   // Procurement / Purchase cost in INR
  repair_cost?: number;     // Workshop repairs & refurbishment charges in INR
  procurement_date?: string;// Inward procurement date YYYY-MM-DD
  repairs_note?: string;    // Notes on mechanical repairs & parts replaced
  created_at?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  staff_name: string;
  staff_phone: string;
  role: 'owner' | 'staff';
  action_type: 'login' | 'lead_view' | 'lead_status' | 'inventory_add' | 'inventory_edit' | 'inventory_delete' | 'billing_create' | 'settings_edit' | 'staff_edit' | 'branch_edit';
  module: 'Auth' | 'Leads CRM' | 'Inventory' | 'Billing' | 'Branches' | 'CMS Settings' | 'Staff Access';
  description: string;
  target_id?: string | number;
  target_name?: string;
  details?: {
    field?: string;
    before?: any;
    after?: any;
    notes?: string;
  };
}

interface LeadItem {
  id: number | string;
  customer_name: string;
  name?: string;
  phone: string;
  email?: string;
  bike_interested: string;
  bike_model?: string;
  service_type?: string;
  notes?: string;
  type?: string;
  message: string;
  status: 'New' | 'Contacted' | 'Closed' | 'Follow-up' | (string & {});
  registration_number?: string;
  preferred_date?: string;
  branch?: string;
  license_status?: string;
  year?: string;
  km?: string;
  expected_price?: string;
  condition?: string;
  loan_amount?: string;
  tenure?: string;
  employment_type?: string;
  employment?: string;
  created_at: string;
}

export interface InvoiceDoc {
  id?: string;
  name: string;
  url: string;
  type: string; // 'rc' | 'insurance' | 'puc' | 'photo' | 'echarger' | 'other'
  size?: string;
}

export interface InvoiceItem {
  id: number;
  invoice_number: string;
  customer_name: string;
  mobile: string;
  vehicle: string;
  reg_number: string; // MANDATORY: Permanent / Temporary Vehicle Registration Number
  price: number;
  payment_mode: string;
  has_echarger?: boolean;
  echarger_details?: string;
  documents?: InvoiceDoc[];
  delivery_note?: DeliveryNoteDetails;
  show_price_view?: boolean;
  show_price_public?: boolean;
  notes: string;
  created_at: string;
}

interface BranchItem {
  id: number | string;
  city: string;
  branch_name: string;
  address: string;
  timings?: string;
  phone: string;
  maps_url: string;
  status: string;
}

interface StaffItem {
  id: number;
  name: string;
  phone: string;
  pin: string;
  role: string;
  permissions: string[];
  status: string;
}

export interface HeroSlideItem {
  id: number;
  slug?: string;
  badge: string;
  title: string;
  subtitle: string;
  description?: string;
  image: string;
  buttonText: string;
  ctaText?: string;
  secondaryText?: string;
  buttonTarget: string;
  isActive: boolean;
}

export interface SiteSettings {
  // Helplines & Direct Calling numbers (All phone numbers on customer site — one per section)
  salesPhone: string;          // Main Showroom / Sales hotline: +91 9014540489
  whatsapp: string;            // Official WhatsApp: 9014540489
  superbikesPhone: string;     // Superbikes Collection Section hotline
  budgetBikesPhone: string;    // Budget Bikes & Commuters Section hotline
  accessoriesPhone: string;    // Accessories & Riding Gear Section hotline
  servicePhone: string;        // Workshop & Dyno Helpline: +91 9848012345
  rsaPhone: string;            // 24x7 Roadside Assistance: 1800-425-9999 / +91 9123456780
  tradeInPhone: string;        // Sell Bike / Valuation: +91 9014540489
  testRidePhone: string;       // Test Ride Booking Section hotline
  financePhone: string;        // Finance & EMI Calculator Section hotline
  billingPhone: string;        // Accounts / RTO Paperwork / Ownership Hub: +91 9849112233
  branchesPhone: string;       // Showroom Branches & Locations Section hotline
  communityPhone: string;      // VIP Riders Community Section hotline
  ownerPhone: string;          // VIP Concierge / Escalation Direct: +91 9014540489
  whatsappGreeting: string;    // Pre-filled greeting template

  // Social Media Channels
  instagram: string;           // adarshmotors.in / https://instagram.com/adarshmotors.in
  youtube: string;             // https://youtube.com/@adarshmotors
  facebook: string;            // https://facebook.com/adarshmotorshyderabad
  twitter: string;             // https://x.com/adarshmotors
  telegram: string;            // https://t.me/adarshmotorsvip
  threads: string;             // https://threads.net/@adarshmotors.in

  // Dealership Information & Public Identity
  dealershipName: string;      // ADARSH MOTORS DEALERSHIP PVT LTD
  tagline: string;             // PERFORMANCE. REFINED.
  subtitle: string;            // Hyderabad's Premier Certified Pre-Owned Superbike Studio & Dyno Hub since 2001
  address: string;             // Plot 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033
  googleMapsUrl: string;       // https://maps.google.com/?q=Jubilee+Hills+Hyderabad
  email: string;               // contact@adarshmotors.in
  salesEmail: string;          // sales@adarshmotors.in
  serviceEmail: string;        // workshop@adarshmotors.in
  gstin: string;               // 36AADCA1234F1Z8
  workingHours: string;        // Mon - Sat: 9:30 AM - 8:30 PM | Sunday: 10:00 AM - 6:00 PM
  customerSiteUrl: string;     // https://adarsh-motors-site.netlify.app/

  // Top Promo Announcement Banner
  bannerActive: boolean;
  bannerText: string;
  bannerBadge: string;
  bannerCtaText: string;
  bannerCtaLink: string;

  // Hero Carousel Slides (5 front page slides)
  heroSlides: HeroSlideItem[];

  // Customer Website Section Visibility Controller (Full On/Off Control)
  enableInventoryFleet: boolean;      // Superbikes Fleet Showcase
  enableBudgetBikesSection: boolean;  // Budget Bikes & Commuters Showcase
  enableAccessoriesSection: boolean;  // Superbike Accessories & Riding Gear Catalog
  enableWorkshopBooking: boolean;     // Workshop & Dyno Hub Booking
  enableSellBike: boolean;            // Exchange / Trade-In Bike & Instant Valuation
  enableTestRide: boolean;            // VIP Weekend Test Ride Scheduler
  enableEmiCalculator: boolean;       // Low-Rate Superbike Finance & EMI Calculator
  enableCustomerHub: boolean;         // Customer Vehicle Ownership & Document Hub
  enableBranchLocations: boolean;     // Pan-India Showrooms & Studios Location Map
  enableCommunityRides: boolean;      // VIP Riders Community & Sunday Breakfast Rides
  enableInvoicePricePublic: boolean;  // Public View visibility of Price Section on Digital Invoices
  enableInvoicePriceView: boolean;    // Staff/Invoice View visibility of Price Section on Digital Invoices
  defaultEmiInterestRate: number;
  defaultMaxEmiTenureMonths: number;
  freeRsaPromo: boolean;
}

const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 1,
    slug: "buy",
    badge: "Certified Fleet · Live Inventory",
    title: "Pure Superbike Excellence.",
    subtitle: "South India's premier showcase of inspected, pedigree superbikes. Clean titles, dyno-verified engines, ready for instant delivery.",
    description: "South India's premier showcase of inspected, pedigree superbikes. Clean titles, dyno-verified engines, ready for instant delivery.",
    image: "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png",
    buttonText: "Explore Inventory",
    ctaText: "Explore Inventory",
    secondaryText: "WhatsApp Desk",
    buttonTarget: "#inventory",
    isActive: true
  },
  {
    id: 2,
    slug: "sell",
    badge: "Fastest Two-Wheeler Valuation",
    title: "Sell Your Bike in 15 Mins.",
    subtitle: "Best market price guaranteed. Submit your vehicle photos for quick valuation, instant bank transfer, and zero brokerage.",
    description: "Best market price guaranteed. Submit your vehicle photos for quick valuation, instant bank transfer, and zero brokerage.",
    image: "/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png",
    buttonText: "Get Instant Valuation",
    ctaText: "Get Instant Valuation",
    secondaryText: "Chat Valuation",
    buttonTarget: "#sell-modal",
    isActive: true
  },
  {
    id: 3,
    slug: "service",
    badge: "Factory-Trained Superbike Care",
    title: "Get Your Superbike Serviced.",
    subtitle: "Specialized ECU diagnostics, suspension tuning, genuine OEM spares, and track-ready dyno service by certified master techs.",
    description: "Specialized ECU diagnostics, suspension tuning, genuine OEM spares, and track-ready dyno service by certified master techs.",
    image: "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png",
    buttonText: "Book Service Slot",
    ctaText: "Book Service Slot",
    secondaryText: "Service Menu",
    buttonTarget: "#workshop",
    isActive: true
  },
  {
    id: 4,
    slug: "loan",
    badge: "Up to 90% Funding · Lowest Interest",
    title: "Get Loan on Your Vehicle.",
    subtitle: "Turn your dream ride into reality with customized low-EMI superbike financing. Fast 2-hour spot approval with minimal documents.",
    description: "Turn your dream ride into reality with customized low-EMI superbike financing. Fast 2-hour spot approval with minimal documents.",
    image: "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png",
    buttonText: "Apply for Vehicle Loan",
    ctaText: "Apply for Vehicle Loan",
    secondaryText: "WhatsApp Finance Desk",
    buttonTarget: "#finance",
    isActive: true
  },
  {
    id: 5,
    slug: "legacy",
    badge: "South India's Premier Superbike Destination · Estd 2001",
    title: "25+ Years Legacy",
    subtitle: "Almost 25+ years in the market. Over 50,000+ machines delivered to passionate riders across India. Built on strict 150-point inspections, ironclad warranties, and zero hidden clauses.",
    description: "Almost 25+ years in the market. Over 50,000+ machines delivered to passionate riders across India. Built on strict 150-point inspections, ironclad warranties, and zero hidden clauses.",
    image: "/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png",
    buttonText: "Discover Our Legacy",
    ctaText: "Discover Our Legacy",
    secondaryText: "Visit Showroom",
    buttonTarget: "#legacy",
    isActive: true
  }
];

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  salesPhone: "+91 9014540489",
  whatsapp: "9014540489",
  superbikesPhone: "+91 9014540489",
  budgetBikesPhone: "+91 9014540489",
  accessoriesPhone: "+91 9014540489",
  servicePhone: "+91 9848012345",
  rsaPhone: "1800-425-9999",
  tradeInPhone: "+91 9014540489",
  testRidePhone: "+91 9014540489",
  financePhone: "+91 9014540489",
  billingPhone: "+91 9849112233",
  branchesPhone: "+91 9014540489",
  communityPhone: "+91 9014540489",
  ownerPhone: "+91 9014540489",
  whatsappGreeting: "Hello Adarsh Motors, I am interested in viewing certified superbikes at your Hyderabad showroom.",

  instagram: "adarshmotors.in",
  youtube: "https://youtube.com/@adarshmotors",
  facebook: "https://facebook.com/adarshmotorshyderabad",
  twitter: "https://x.com/adarshmotors",
  telegram: "https://t.me/adarshmotorsvip",
  threads: "https://threads.net/@adarshmotors.in",

  dealershipName: "ADARSH MOTORS DEALERSHIP PVT LTD",
  tagline: "PERFORMANCE. REFINED.",
  subtitle: "Hyderabad's Premier Certified Pre-Owned Superbike Studio & Dyno Hub since 2001.",
  address: "Plot 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033",
  googleMapsUrl: "https://maps.google.com/?q=Jubilee+Hills+Hyderabad",
  email: "contact@adarshmotors.in",
  salesEmail: "sales@adarshmotors.in",
  serviceEmail: "workshop@adarshmotors.in",
  gstin: "36AADCA1234F1Z8",
  workingHours: "Mon - Sat: 9:30 AM - 8:30 PM | Sunday: 10:00 AM - 6:00 PM",
  customerSiteUrl: "https://adarsh-motors-site.netlify.app/",

  bannerActive: true,
  bannerText: "⚡ Festive Superbike Carnival: 0% Processing Fee on Kawasaki & BMW models this week! Free 1-Year RSA.",
  bannerBadge: "FESTIVE CARNIVAL",
  bannerCtaText: "Explore Offers",
  bannerCtaLink: "https://adarsh-motors-site.netlify.app/#inventory",

  heroSlides: DEFAULT_HERO_SLIDES,

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
  enableInvoicePricePublic: false,
  enableInvoicePriceView: false,
  defaultEmiInterestRate: 8.5,
  defaultMaxEmiTenureMonths: 60,
  freeRsaPromo: true
};

const SEED_BIKES: BikeItem[] = [
  {
    id: 1,
    name: "Ducati Diavel V4",
    brand: "Ducati",
    category: "Superbikes",
    price: 2890000,
    year: 2024,
    km: 1112,
    image_url: "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png",
    gallery_urls: [
      "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png",
      "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png",
      "/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png"
    ],
    status: "Available",
    displacement_cc: "1158 cc",
    engine_type: "V4 1158 cc Granturismo",
    max_power: "168 hp",
    acceleration: "3.1s",
    fuel_type: "Petrol",
    location: "Hyderabad – Main Showroom",
    tagline: "Muscular stance with superbike heart.",
    colorways: [
      { name: "Solar Orange", hex: "#EA580C" },
      { name: "Ducati Red", hex: "#DC2626" },
      { name: "Dark Stealth", hex: "#334155" },
      { name: "Pearl White", hex: "#F8FAFC" },
      { name: "Racing Blue", hex: "#2563EB" }
    ],
    addon_gear_name: "Ducati Corse Riding Leather",
    addon_gear_price: 38500,
    warranty_badge: "Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty."
  },
  {
    id: 2,
    name: "Kawasaki Ninja Z900",
    brand: "Kawasaki",
    category: "Superbikes",
    price: 920000,
    year: 2024,
    km: 1456,
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: [
      "/assets/aistudio/image_f4045ab9.png",
      "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png"
    ],
    status: "Available",
    displacement_cc: "948 cc",
    engine_type: "948 cc Inline-4",
    max_power: "125 hp",
    acceleration: "3.4s",
    fuel_type: "Petrol",
    location: "Hyderabad – Main Showroom",
    tagline: "Aggressive sugomi streetfighter presence with screaming 4-cylinder acoustics.",
    colorways: [
      { name: "Lime Green", hex: "#16A34A" },
      { name: "Metallic Spark Black", hex: "#0F172A" },
      { name: "Candy Crimson", hex: "#DC2626" }
    ],
    addon_gear_name: "KRT Dainese Racing Gloves",
    addon_gear_price: 14500,
    warranty_badge: "Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty."
  },
  {
    id: 3,
    name: "BMW S1000RR M-Sport",
    brand: "BMW",
    category: "Superbikes",
    price: 2350000,
    year: 2024,
    km: 3200,
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: [
      "/assets/aistudio/image_f4045ab9.png",
      "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png"
    ],
    status: "Available",
    displacement_cc: "999 cc",
    engine_type: "999 cc ShiftCam",
    max_power: "205 hp",
    acceleration: "2.9s",
    fuel_type: "Petrol",
    location: "Hyderabad – Banjara Hills",
    tagline: "Motorsport winglets and dynamic traction with racetrack apex telemetry.",
    colorways: [
      { name: "M Light White Motorsport", hex: "#F8FAFC" },
      { name: "Black Storm Metallic", hex: "#1E293B" },
      { name: "Racing Red", hex: "#EF4444" }
    ],
    addon_gear_name: "BMW Motorrad Carbon Full Face Helmet",
    addon_gear_price: 52000,
    warranty_badge: "Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty."
  },
  {
    id: 4,
    name: "KTM 1290 Super Duke R",
    brand: "KTM",
    category: "Superbikes",
    price: 1850000,
    year: 2023,
    km: 1845,
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: [
      "/assets/aistudio/image_f4045ab9.png",
      "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png"
    ],
    status: "Available",
    displacement_cc: "1301 cc",
    engine_type: "1301 cc LC8 V-Twin",
    max_power: "180 hp",
    acceleration: "3.2s",
    fuel_type: "Unleaded",
    location: "Bengaluru Branch",
    tagline: "The Beast: uncompromising torque with ultra-light trellis frame.",
    colorways: [
      { name: "Electric Orange", hex: "#F97316" },
      { name: "Stealth Matt Black", hex: "#18181B" }
    ],
    addon_gear_name: "KTM PowerParts Carbon Akrapovič Slip-On",
    addon_gear_price: 68000,
    warranty_badge: "Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty."
  },
  {
    id: 5,
    name: "Ducati Panigale V2",
    brand: "Ducati",
    category: "Superbikes",
    price: 2000000,
    year: 2024,
    km: 1800,
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: ["/assets/aistudio/image_f4045ab9.png"],
    status: "Available",
    displacement_cc: "955 cc",
    engine_type: "Superquadro Twin 955 cc",
    max_power: "155 hp",
    acceleration: "3.3s",
    fuel_type: "Petrol",
    location: "Hyderabad – Main Showroom",
    tagline: "Unmistakable Italian aerodynamic silhouette with pure cornering poise.",
    colorways: [
      { name: "Ducati Red", hex: "#DC2626" },
      { name: "White Star Silk", hex: "#F1F5F9" }
    ],
    addon_gear_name: "Ducati Corse Alpinestars Boots",
    addon_gear_price: 26000,
    warranty_badge: "Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty."
  },
  {
    id: 6,
    name: "Honda Activa 6G Premium",
    brand: "Honda",
    category: "Scooter",
    price: 85000,
    year: 2026,
    km: 1800,
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: ["/assets/aistudio/image_f4045ab9.png"],
    status: "Sold",
    displacement_cc: "110 cc",
    engine_type: "PGM-FI 4-Stroke",
    max_power: "7.8 hp",
    acceleration: "7.9s",
    fuel_type: "Petrol",
    location: "Hyderabad – Main Showroom",
    tagline: "India's highest selling reliable smart scooter with eSP technology.",
    colorways: [
      { name: "Matte Axis Grey", hex: "#475569" },
      { name: "Pearl Siren Blue", hex: "#1E40AF" },
      { name: "Decent Blue", hex: "#3B82F6" }
    ],
    addon_gear_name: "Studds Ninja Elite Flip-up Helmet",
    addon_gear_price: 2400,
    warranty_badge: "Adarsh Verified: 50-Point Inspection & 6-Month Dealership Warranty."
  },
  {
    id: 7,
    name: "Royal Enfield Continental GT 650",
    brand: "Royal Enfield",
    category: "Cruiser",
    price: 340000,
    year: 2023,
    km: 6200,
    image_url: "/assets/aistudio/image_f4045ab9.png",
    gallery_urls: ["/assets/aistudio/image_f4045ab9.png"],
    status: "Available",
    displacement_cc: "648 cc",
    engine_type: "Parallel Twin 4-Stroke Air-Oil Cooled",
    max_power: "47 hp",
    acceleration: "5.4s",
    fuel_type: "Petrol",
    location: "Hyderabad – Main Showroom",
    tagline: "Authentic British cafe racer attitude with twin-cylinder acoustic rumble.",
    colorways: [
      { name: "Apex Grey", hex: "#64748B" },
      { name: "British Racing Green", hex: "#14532D" }
    ],
    addon_gear_name: "RE Bar End Mirrors & Flyscreen",
    addon_gear_price: 6500,
    warranty_badge: "Adarsh Verified: 80-Point Inspection & Clear Title."
  },
  {
    id: 8,
    name: "Dainese Misano 2 D-Air Race Suit",
    brand: "Dainese",
    category: "Riding Gear",
    price: 145000,
    year: 2024,
    km: 0,
    image_url: "/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png",
    gallery_urls: ["/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png"],
    status: "Available",
    displacement_cc: "N/A",
    engine_type: "Full Kangaroo Leather",
    max_power: "Level 2 Armor",
    acceleration: "D-Air Wireless Bag",
    fuel_type: "Gear",
    location: "Hyderabad – Main Showroom",
    tagline: "FIM certified MotoGP airbag race suit with titanium shoulder plates.",
    colorways: [
      { name: "Black / Fluo Red", hex: "#EF4444" },
      { name: "Stealth Black", hex: "#0F172A" }
    ],
    addon_gear_name: "Axial D1 Air Race Boots",
    addon_gear_price: 42000,
    warranty_badge: "Official Dainese Warranty & Certification."
  }
];

const SEED_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    staff_name: "Suresh Kumar",
    staff_phone: "9876543210",
    role: "staff",
    action_type: "lead_status",
    module: "Leads CRM",
    description: "Changed lead Kiran Varma status from 'New' to 'Contacted'",
    target_id: 1,
    target_name: "Kiran Varma",
    details: { field: "status", before: "New", after: "Contacted", notes: "Called customer regarding Kawasaki Ninja Z900 green color availability." }
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    staff_name: "Suresh Kumar",
    staff_phone: "9876543210",
    role: "staff",
    action_type: "lead_view",
    module: "Leads CRM",
    description: "Inspected customer personal phone number & enquiry note for Kiran Varma",
    target_id: 1,
    target_name: "Kiran Varma (9848012345)",
    details: { notes: "Customer requested down payment and immediate delivery details." }
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    staff_name: "Ramesh Naidu",
    staff_phone: "9849112233",
    role: "staff",
    action_type: "billing_create",
    module: "Billing",
    description: "Generated official GST Invoice #AM-2026-101 for Ananya Deshmukh",
    target_id: "AM-2026-101",
    target_name: "TS 09 EQ 4200 (₹85,000 via UPI)",
    details: { notes: "Uploaded 4 vehicle documents including RC Card, Insurance & E-Charger warranty." }
  },
  {
    id: "log_4",
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    staff_name: "Suresh Kumar",
    staff_phone: "9876543210",
    role: "staff",
    action_type: "inventory_edit",
    module: "Inventory",
    description: "Updated technical specifications for Ducati Diavel V4 (1158 cc Granturismo, 168 hp)",
    target_id: 1,
    target_name: "Ducati Diavel V4",
    details: { field: "specifications", before: "Basic Listing", after: "1158 cc, 168 hp, 3.1s 0-100, Riding Gear add-on ₹38,500" }
  },
  {
    id: "log_5",
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    staff_name: "Ramesh Naidu",
    staff_phone: "9849112233",
    role: "staff",
    action_type: "login",
    module: "Auth",
    description: "Staff member Ramesh Naidu authenticated via PIN into Digital Billing",
    details: { notes: "Session started from showroom iPad / counter desktop." }
  },
  {
    id: "log_6",
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    staff_name: "Suresh Kumar",
    staff_phone: "9876543210",
    role: "staff",
    action_type: "login",
    module: "Auth",
    description: "Staff member Suresh Kumar authenticated via PIN into Leads CRM & Inventory",
    details: { notes: "Showroom morning duty check-in." }
  },
  {
    id: "log_7",
    timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    staff_name: "Pavan Kumar (Owner)",
    staff_phone: "9014540489",
    role: "owner",
    action_type: "settings_edit",
    module: "CMS Settings",
    description: "Updated showroom promotional banner text: Festive Superbike Carnival 0% processing fee",
    details: { field: "bannerText", before: "Standard Welcome", after: "⚡ Festive Superbike Carnival: 0% Processing Fee" }
  }
];

const SEED_LEADS: LeadItem[] = [
  {
    id: 1,
    customer_name: "Kiran Varma",
    phone: "9848012345",
    bike_interested: "Kawasaki Ninja Z900",
    service_type: "Test Ride & Finance",
    message: "Enquiring about down payment and immediate delivery for green color.",
    status: "New",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    customer_name: "Vikramaditya Reddy",
    phone: "9849055443",
    bike_interested: "Kawasaki Ninja Z900",
    service_type: "Purchase Booking",
    message: "Interested in taking a weekend test ride at Jubilee Hills showroom. Ready with 50% token.",
    status: "Contacted",
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: 3,
    customer_name: "Arjun Mehta",
    phone: "9700088991",
    bike_interested: "BMW S1000RR M-Sport",
    service_type: "Finance Quotation",
    message: "Looking for 50% down payment finance scheme with HDFC Bank and official BMW warranty.",
    status: "Contacted",
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    id: 4,
    customer_name: "Aditya Singhania",
    phone: "9820011223",
    bike_interested: "BMW S1000RR M-Sport",
    service_type: "Superbike Inspection",
    message: "Ready for immediate inspection at showroom. Cash deal if vehicle passes dyno test.",
    status: "New",
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: 5,
    customer_name: "Srikanth Rao",
    phone: "9121234345",
    bike_interested: "Ducati Diavel V4",
    service_type: "Exchange Quotation",
    message: "Wants to trade in 2021 Triumph Street Triple RS. Requested showroom callback.",
    status: "Follow-up",
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  },
  {
    id: 6,
    customer_name: "Rahul Nair",
    phone: "9940123450",
    bike_interested: "Ducati Diavel V4",
    service_type: "Test Ride & Finance",
    message: "Inquired about Akrapovič exhaust option and comprehensive zero-dep insurance.",
    status: "Contacted",
    created_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString()
  },
  {
    id: 7,
    customer_name: "Pradeep Teja",
    phone: "9550012398",
    bike_interested: "KTM 1290 Super Duke R",
    service_type: "Test Ride",
    message: "Is test ride permitted this Sunday morning at Gachibowli experience center?",
    status: "New",
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString()
  },
  {
    id: 8,
    customer_name: "Ananya Deshmukh",
    phone: "9123456789",
    bike_interested: "Honda Activa 6G Premium",
    service_type: "Purchase Booking",
    message: "Token paid via UPI, scheduled delivery for Saturday at Jubilee Hills.",
    status: "Closed",
    created_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString()
  },
  {
    id: 9,
    customer_name: "Venkat Raman",
    phone: "9441122334",
    bike_interested: "Honda Activa 6G Premium",
    service_type: "Commercial Enquiry",
    message: "Needs 2 Activa scooters for family business delivery. Please share best on-road price.",
    status: "New",
    created_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
  },
  {
    id: 10,
    customer_name: "Rohit Sharma",
    phone: "9811122334",
    bike_interested: "Kawasaki Ninja ZX-10R",
    service_type: "Superbike Inspection",
    message: "Asking for track telemetry and full official Kawasaki service history records.",
    status: "Follow-up",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 11,
    customer_name: "Harish Kalyan",
    phone: "9632145678",
    bike_interested: "Royal Enfield Continental GT 650",
    service_type: "Exchange Quotation",
    message: "Loved the Mr Clean chrome finish. Enquiring about EMI options and test ride.",
    status: "Contacted",
    created_at: new Date(Date.now() - 55 * 3600 * 1000).toISOString()
  },
  {
    id: 12,
    customer_name: "Mohammed Farhan",
    phone: "9885544332",
    bike_interested: "Dainese Misano 2 D-Air Race Suit",
    service_type: "Riding Gear Fitting",
    message: "Enquiring about European size 52 availability and fitting session at workshop.",
    status: "New",
    created_at: new Date(Date.now() - 60 * 3600 * 1000).toISOString()
  }
];

const SEED_INVOICES: InvoiceItem[] = [
  {
    id: 1,
    invoice_number: "4347",
    customer_name: "Ananya Deshmukh",
    mobile: "9123456789",
    vehicle: "Honda Activa 6G Premium (Matte Axis Grey)",
    reg_number: "TS 09 EQ 4200",
    price: 85000,
    payment_mode: "UPI",
    has_echarger: true,
    echarger_details: "Activa Smart Fast Charger (3.3kW Portable Kit)",
    show_price_view: false,
    show_price_public: false,
    delivery_note: {
      note_no: "4347",
      delivery_time: "11:30 AM",
      delivery_date: "12/11/2026",
      vehicle_category: "Scooter",
      owner_name: "Ananya Deshmukh",
      owner_so: "D/o. Prakash Deshmukh",
      owner_ro: "Madhapur, Hyderabad",
      class_of_vehicle: "Scooter (2-Wheeler)",
      chassis_number: "ME4JF505AM8124901",
      engine_number: "JF50E81124901",
      makers_name: "Honda Motorcycle & Scooter India",
      mfg_month_year: "08/2025",
      body_type: "Solo Scooter",
      colour: "Matte Axis Grey",
      seller_name: "Adarsh Motors",
      seller_so: "Showroom Stock",
      seller_ro: "S.R. Nagar, Hyderabad",
      seller_phone: "23709972",
      dealer_name: "Adarsh Motors",
      dealer_ms: "Adarsh Motors Auto Consultants",
      purchaser_name: "Ananya Deshmukh",
      purchaser_so: "D/o. Prakash Deshmukh",
      purchaser_address: "Flat 402, Signature Towers, Madhapur, Hyderabad"
    },
    documents: [
      { name: "RC_Card_TS09EQ4200.jpg", url: "/assets/aistudio/image_f4045ab9.png", type: "rc", size: "380 KB" },
      { name: "Bajaj_Allianz_Policy_2026.pdf", url: "/assets/aistudio/image_f4045ab9.png", type: "insurance", size: "620 KB" },
      { name: "Vehicle_Handover_Keys_Photo.jpg", url: "/assets/aistudio/image_b40a39bd.png", type: "photo", size: "910 KB" },
      { name: "ECharger_Warranty_Card.jpg", url: "/assets/aistudio/image_f4045ab9.png", type: "echarger", size: "290 KB" }
    ],
    notes: "Delivery kit, EV charger & helmet provided.",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 2,
    invoice_number: "4348",
    customer_name: "Rajesh Goud",
    mobile: "9440122334",
    vehicle: "Royal Enfield Hunter 350 Dapper Ash",
    reg_number: "TS 07 HK 1122",
    price: 175000,
    payment_mode: "Bank Transfer",
    has_echarger: false,
    show_price_view: false,
    show_price_public: false,
    delivery_note: {
      note_no: "4348",
      delivery_time: "03:45 PM",
      delivery_date: "10/11/2026",
      vehicle_category: "M.Cycle",
      owner_name: "Rajesh Goud",
      owner_so: "S/o. Mallesh Goud",
      owner_ro: "Jubilee Hills, Hyderabad",
      class_of_vehicle: "M.Cycle (Solo)",
      chassis_number: "ME3J3B5FBK2098741",
      engine_number: "J3A5FB2098741",
      makers_name: "Royal Enfield",
      mfg_month_year: "05/2025",
      body_type: "Motorcycle",
      colour: "Dapper Ash",
      seller_name: "Kiran Kumar",
      seller_so: "S/o. Satyanarayana",
      seller_ro: "Ameerpet, Hyderabad",
      seller_phone: "9848011223",
      dealer_name: "Adarsh Motors",
      dealer_ms: "Adarsh Motors Auto Consultants",
      purchaser_name: "Rajesh Goud",
      purchaser_so: "S/o. Mallesh Goud",
      purchaser_address: "House 12-4/A, Jubilee Enclave, Road No. 36, Hyderabad"
    },
    documents: [
      { name: "RTO_Form_29_30_SmartRC.pdf", url: "/assets/aistudio/image_f4045ab9.png", type: "rc", size: "450 KB" },
      { name: "National_Comprehensive_Insurance.pdf", url: "/assets/aistudio/image_f4045ab9.png", type: "insurance", size: "510 KB" },
      { name: "Delivery_Ceremony_Photo.jpg", url: "/assets/aistudio/image_b40a39bd.png", type: "photo", size: "840 KB" }
    ],
    notes: "RTO transfer process initiated.",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 3,
    invoice_number: "4349",
    customer_name: "Gautam Kashyap",
    mobile: "9849556677",
    vehicle: "Kawasaki Ninja 650 KRT Edition",
    reg_number: "TS 08 FJ 8899",
    price: 680000,
    payment_mode: "Finance",
    has_echarger: false,
    show_price_view: false,
    show_price_public: false,
    delivery_note: {
      note_no: "4349",
      delivery_time: "05:15 PM",
      delivery_date: "06/11/2026",
      vehicle_category: "M.Cycle",
      owner_name: "Gautam Kashyap",
      owner_so: "S/o. Ramesh Kashyap",
      owner_ro: "Nanakramguda, Hyderabad",
      class_of_vehicle: "M.Cycle (Superbike)",
      chassis_number: "JKBEXEM16PA045312",
      engine_number: "ER650AE45312",
      makers_name: "India Kawasaki Motors",
      mfg_month_year: "03/2025",
      body_type: "Sports Fairing",
      colour: "Lime Green KRT",
      seller_name: "Siddharth Rao",
      seller_so: "S/o. Venkat Rao",
      seller_ro: "Banjara Hills, Hyderabad",
      seller_phone: "9014540489",
      dealer_name: "Adarsh Motors",
      dealer_ms: "Adarsh Motors Auto Consultants",
      purchaser_name: "Gautam Kashyap",
      purchaser_so: "S/o. Ramesh Kashyap",
      purchaser_address: "Villa 18, Palm Meadows, Nanakramguda, Hyderabad"
    },
    documents: [
      { name: "Kawasaki_Original_RC.jpg", url: "/assets/aistudio/image_f4045ab9.png", type: "rc", size: "410 KB" },
      { name: "HDFC_Finance_NOC_Approval.pdf", url: "/assets/aistudio/image_f4045ab9.png", type: "other", size: "320 KB" }
    ],
    notes: "HDFC Two Wheeler Finance sanctioned.",
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  }
];

const SEED_BRANCHES: BranchItem[] = [
  {
    id: 1,
    city: "Hyderabad",
    branch_name: "Hyderabad — Main Flagship Showroom",
    address: "Plot 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033",
    phone: "+91 9014540489",
    maps_url: "https://maps.google.com/?q=Jubilee+Hills+Hyderabad",
    status: "Active"
  },
  {
    id: 2,
    city: "Hyderabad",
    branch_name: "Hyderabad — Madhapur Tech-Hub Studio",
    address: "Opp. Cyber Towers, Hitec City, Madhapur, Hyderabad, Telangana 500081",
    phone: "+91 9014540489",
    maps_url: "https://maps.google.com/?q=Madhapur+Hyderabad",
    status: "Active"
  },
  {
    id: 3,
    city: "Bengaluru",
    branch_name: "Bengaluru — Indiranagar Experience Center",
    address: "100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
    phone: "+91 9876543210",
    maps_url: "https://maps.google.com/?q=Indiranagar+Bengaluru",
    status: "Active"
  },
  {
    id: 4,
    city: "Mumbai",
    branch_name: "Mumbai — Bandra West Studio",
    address: "Hill Road, Bandra West, Mumbai, Maharashtra 400050",
    phone: "+91 9876543210",
    maps_url: "https://maps.google.com/?q=Bandra+West+Mumbai",
    status: "Coming Soon"
  }
];

const SEED_OWNERS: OwnerAccount[] = [
  {
    id: 'owner_primary',
    name: 'Pavan Kumar',
    phone: OWNER_PHONE,
    relation: 'Primary Owner',
    email: 'kannapavan30@gmail.com',
    altPhone: '+91 9014540489',
    address: 'Plot 48, Road No. 36, Jubilee Hills, Hyderabad',
    personalNotes: 'Managing Director & Primary Super Admin',
    status: 'Active',
    isPrimary: true,
  },
];

const normalizePhone10 = (p: any): string => {
  const digits = p ? String(p).replace(/\D/g, '') : '';
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

const dedupeStaffByPhone = (items: StaffItem[]): StaffItem[] => {
  const byPhone = new Map<string, StaffItem>();
  const noPhone: StaffItem[] = [];
  for (const item of items) {
    const p10 = normalizePhone10(item?.phone);
    if (!p10) {
      noPhone.push(item);
      continue;
    }
    const existing = byPhone.get(p10);
    if (!existing) {
      byPhone.set(p10, { ...item, phone: p10 });
      continue;
    }
    const existingActive = String(existing.status || 'Active') !== 'Inactive';
    const nextActive = String(item.status || 'Active') !== 'Inactive';
    if ((!existingActive && nextActive) || (existingActive === nextActive && (item.permissions?.length || 0) >= (existing.permissions?.length || 0))) {
      byPhone.set(p10, { ...item, phone: p10 });
    }
  }
  return [...Array.from(byPhone.values()), ...noPhone];
};

const STAFF_PRIORITY_TABS = [
  'leads',
  'exchange_leads',
  'loan_leads',
  'service_leads',
  'accessories_leads',
  'inventory',
  'budget_bikes',
  'accessories',
  'billing',
  'customers',
  'branches',
  'settings',
  'section_controls',
  'pnl',
  'overview',
] as const;

const hasUserAccess = (user: UserSession | null, module: string): boolean => {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (module === 'staff' || module === 'audit') return false;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes(module) || perms.includes('all');
};

const getFirstAllowedTab = (user: UserSession | null): typeof STAFF_PRIORITY_TABS[number] | null => {
  if (!user) return null;
  if (user.role === 'owner') return 'overview';
  for (const tab of STAFF_PRIORITY_TABS) {
    if (hasUserAccess(user, tab)) return tab;
  }
  return null;
};

const SEED_STAFF: StaffItem[] = [
  {
    id: 1,
    name: "Suresh Kumar",
    phone: "9876543210",
    pin: "2026",
    role: "staff",
    permissions: ["leads", "inventory"],
    status: "Active"
  },
  {
    id: 2,
    name: "Ramesh Naidu",
    phone: "9849112233",
    pin: "4321",
    role: "staff",
    permissions: ["leads", "billing", "budget_bikes"],
    status: "Active"
  }
];

export default function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('adarsh_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation State with History Stack for Mobile & Hardware Back Button
  const [activeTab, setActiveTabRaw] = useState<'overview' | 'inventory' | 'budget_bikes' | 'accessories' | 'customers' | 'leads' | 'exchange_leads' | 'loan_leads' | 'service_leads' | 'accessories_leads' | 'billing' | 'branches' | 'settings' | 'section_controls' | 'staff' | 'audit' | 'pnl'>('overview');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['overview']);
  const lastBackPressTimeRef = React.useRef<number>(0);

  // Auto-scrolling capsule navigation reference & center helper
  const capsuleNavRef = React.useRef<HTMLDivElement>(null);

  const centerCapsuleTab = (tabKey: string, smooth: boolean = true) => {
    if (!capsuleNavRef.current) return;
    const container = capsuleNavRef.current;
    const tabEl = container.querySelector<HTMLElement>(`[data-tab="${tabKey}"]`);
    if (!tabEl) return;
    const containerWidth = container.clientWidth;
    const tabLeft = tabEl.offsetLeft;
    const tabWidth = tabEl.offsetWidth;
    const targetScrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);
    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  useEffect(() => {
    // Delay slightly to ensure tab layout & dimensions are settled
    const timer = setTimeout(() => {
      centerCapsuleTab(activeTab, true);
    }, 60);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const setActiveTab = (tab: any) => {
    const targetTab = currentUser && !hasUserAccess(currentUser, tab)
      ? (getFirstAllowedTab(currentUser) || tab)
      : tab;
    setActiveTabRaw(prev => {
      if (prev === targetTab) return prev;
      setNavigationHistory(h => (h[h.length - 1] === targetTab ? h : [...h, targetTab]));
      try {
        window.history.pushState({ tab: targetTab }, '', `#${targetTab}`);
      } catch {}
      return targetTab;
    });
    setTimeout(() => {
      centerCapsuleTab(targetTab, true);
    }, 15);
  };
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Profit & Loss (P&L) Dashboard State
  const [pnlDateFilter, setPnlDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'fy' | 'custom'>('all');
  const [pnlStatusFilter, setPnlStatusFilter] = useState<'ALL' | 'Sold' | 'Booked' | 'Available' | 'all' | 'available' | 'sold'>('all');
  const [pnlMarginBandFilter, setPnlMarginBandFilter] = useState<string>('all');
  const [pnlSearch, setPnlSearch] = useState('');
  const [pnlCustomStart, setPnlCustomStart] = useState('');
  const [pnlCustomEnd, setPnlCustomEnd] = useState('');
  const [pnlChartMode, setPnlChartMode] = useState<'bar' | 'area' | 'line' | 'comparison' | 'distribution'>('bar');
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [editingProcurementBike, setEditingProcurementBike] = useState<BikeItem | null>(null);
  const [showPrintPnlModal, setShowPrintPnlModal] = useState(false);

  // Login Form & OTP Operator State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminOtpStep, setAdminOtpStep] = useState<'phone' | 'otp'>('phone');
  const [adminOtpCode, setAdminOtpCode] = useState('');
  const [adminOtpNotice, setAdminOtpNotice] = useState('');
  const [adminOtpDemoCode, setAdminOtpDemoCode] = useState('');
  const [adminOtpCooldown, setAdminOtpCooldown] = useState(0);
  const [isSendingAdminOtp, setIsSendingAdminOtp] = useState(false);
  const [resolvedAuthTarget, setResolvedAuthTarget] = useState<{
    id?: number;
    name: string;
    phone: string;
    role: 'owner' | 'staff';
    permissions: string[];
  } | null>(null);
  const [otpOperatorConfig, setOtpOperatorConfig] = useState<OtpOperatorConfig>(() => getSavedOtpOperatorConfig());

  useEffect(() => {
    if (adminOtpCooldown <= 0) return;
    const t = window.setTimeout(() => setAdminOtpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [adminOtpCooldown]);

  // Helper to reliably parse numbers from strings with currency symbols or commas (prevents NaN)
  const cleanNumber = (val: any, fallback: number = 0): number => {
    if (val === null || val === undefined || val === '') return fallback;
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    const cleaned = String(val).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : num;
  };

  // Helper to ensure all rich specs and financial fields exist on any bike
  const mergeBikeDefaults = (b: any): BikeItem => {
    const priceNum = cleanNumber(b.price_raw, cleanNumber(b.price, 920000));
    const purchaseNum = (b.purchase_cost !== undefined && b.purchase_cost !== null && cleanNumber(b.purchase_cost, 0) > 0)
      ? cleanNumber(b.purchase_cost)
      : Math.round(priceNum * 0.81);
    const repairNum = (b.repair_cost !== undefined && b.repair_cost !== null && cleanNumber(b.repair_cost, 0) > 0)
      ? cleanNumber(b.repair_cost)
      : 30000;

    let parsedGallery: string[] = [];
    if (Array.isArray(b.gallery_urls)) {
      parsedGallery = b.gallery_urls;
    } else if (typeof b.gallery_urls === 'string') {
      try {
        const g = JSON.parse(b.gallery_urls);
        if (Array.isArray(g)) parsedGallery = g;
      } catch {}
    }

    let parsedColorways: BikeColorway[] = [];
    if (Array.isArray(b.colorways)) {
      parsedColorways = b.colorways;
    } else if (typeof b.colorways === 'string') {
      try {
        const c = JSON.parse(b.colorways);
        if (Array.isArray(c)) parsedColorways = c;
      } catch {}
    }

    return {
      id: b.id || Date.now(),
      name: b.name || "Custom Superbike",
      brand: b.brand || "Ducati",
      category: b.category || "Superbikes",
      price: priceNum,
      price_raw: priceNum,
      year: cleanNumber(b.year, 2024),
      km: cleanNumber(b.km, 1200),
      image_url: normalizeLocalAssetUrl(b.image_url, "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png"),
      gallery_urls: parsedGallery.length > 0
        ? parsedGallery.map((g) => normalizeLocalAssetUrl(g, FALLBACK_SHOWROOM_IMAGE))
        : [
            normalizeLocalAssetUrl(b.image_url, "/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png"),
            "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png",
            "/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png"
          ],
      status: b.status || "Available",
      displacement_cc: b.displacement_cc || (b.name?.includes('900') ? "948 cc" : b.name?.includes('1000') ? "999 cc" : "1158 cc"),
      engine_type: b.engine_type || b.engine || (b.name?.includes('900') ? "948 cc Inline-4" : b.name?.includes('1000') ? "999 cc ShiftCam" : "V4 1158 cc Granturismo"),
      engine: b.engine || b.engine_type || "V4 1158 cc Granturismo",
      max_power: b.max_power || b.hp || (b.name?.includes('1000') ? "205 hp" : b.name?.includes('900') ? "125 hp" : "168 hp"),
      hp: b.hp || b.max_power || "168 hp",
      acceleration: b.acceleration || (b.name?.includes('1000') ? "2.9s" : b.name?.includes('900') ? "3.4s" : "3.1s"),
      fuel_type: b.fuel_type || b.fuel || "Petrol",
      fuel: b.fuel || b.fuel_type || "Petrol",
      badge: b.badge || "VERIFIED",
      location: b.location || "Hyderabad – Main Showroom",
      tagline: b.tagline || (b.name?.includes('900') ? "Aggressive sugomi streetfighter presence." : "Muscular stance with superbike heart."),
      colorways: parsedColorways.length > 0 ? parsedColorways : [
        { name: "Solar Orange", hex: "#EA580C" },
        { name: "Ducati Red", hex: "#DC2626" },
        { name: "Dark Stealth", hex: "#334155" },
        { name: "Pearl White", hex: "#F8FAFC" },
        { name: "Racing Blue", hex: "#2563EB" }
      ],
      addon_gear_name: b.addon_gear_name || b.addon_name || "Ducati Corse Riding Leather",
      addon_gear_price: cleanNumber(b.addon_gear_price ?? b.addon_price, 38500),
      warranty_badge: b.warranty_badge || "Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty.",
      // Financial Procurement & Profit Margin Fields (Guaranteed valid numbers)
      purchase_cost: purchaseNum,
      repair_cost: repairNum,
      procurement_date: b.procurement_date || (b.created_at ? String(b.created_at).slice(0, 10) : '2026-10-15'),
      repairs_note: b.repairs_note || 'Workshop 120-pt fluid flush, brake pads, dyno diagnostics & clear title check',
      created_at: b.created_at
    };
  };

  // Helper to ensure all fields are normalized for leads (bridges customer site and admin portal)
  const mergeLeadDefaults = (l: any): LeadItem => {
    if (!l) {
      return {
        id: Date.now(),
        customer_name: 'Customer',
        phone: '',
        bike_interested: 'Vehicle Inquiry',
        service_type: 'Inquiry',
        message: '',
        status: 'New',
        created_at: new Date().toISOString()
      };
    }
    const rawStatus = String(l.status || 'New').trim();
    let status: 'New' | 'Contacted' | 'Closed' | 'Follow-up' = 'New';
    if (rawStatus === 'Contacted' || rawStatus.toLowerCase().includes('contact')) {
      status = 'Contacted';
    } else if (rawStatus === 'Closed' || rawStatus.toLowerCase().includes('close')) {
      status = 'Closed';
    } else if (rawStatus === 'Follow-up' || rawStatus.toLowerCase().includes('follow')) {
      status = 'Follow-up';
    } else {
      status = 'New';
    }

    return {
      id: l.id || Date.now(),
      customer_name: String(l.customer_name || l.name || 'Valued Customer').trim(),
      name: l.name ? String(l.name).trim() : undefined,
      phone: String(l.phone || '').trim(),
      email: l.email ? String(l.email).trim() : undefined,
      bike_interested: String(l.bike_interested || l.bike_model || 'Vehicle Inquiry').trim(),
      bike_model: l.bike_model ? String(l.bike_model).trim() : undefined,
      service_type: String(l.service_type || l.type || 'Inquiry').trim(),
      type: l.type ? String(l.type).trim() : undefined,
      message: String(l.message || l.notes || '').trim(),
      notes: l.notes ? String(l.notes).trim() : undefined,
      status,
      registration_number: l.registration_number ? String(l.registration_number).trim() : undefined,
      preferred_date: l.preferred_date ? String(l.preferred_date).trim() : undefined,
      branch: l.branch ? String(l.branch).trim() : undefined,
      license_status: l.license_status ? String(l.license_status).trim() : undefined,
      year: l.year ? String(l.year).trim() : undefined,
      km: l.km ? String(l.km).trim() : undefined,
      expected_price: l.expected_price ? String(l.expected_price).trim() : undefined,
      condition: l.condition ? String(l.condition).trim() : undefined,
      loan_amount: l.loan_amount ? String(l.loan_amount).trim() : undefined,
      tenure: l.tenure ? String(l.tenure).trim() : undefined,
      employment_type: l.employment_type ? String(l.employment_type).trim() : undefined,
      employment: l.employment ? String(l.employment).trim() : undefined,
      created_at: l.created_at || new Date().toISOString()
    };
  };

  // Helper to ensure all fields are normalized for branches
  const mergeBranchDefaults = (b: any): BranchItem => {
    if (!b) {
      return {
        id: Date.now(),
        city: 'Hyderabad',
        branch_name: 'Adarsh Motors Branch',
        address: '',
        timings: 'Mon–Sat: 10 AM – 8 PM',
        phone: '+91 9014540489',
        maps_url: '',
        status: 'Active'
      };
    }
    return {
      id: b.id || Date.now(),
      city: String(b.city || 'Hyderabad').trim(),
      branch_name: String(b.branch_name || b.name || 'Adarsh Motors Branch').trim(),
      address: String(b.address || '').trim(),
      timings: String(b.timings || 'Mon–Sat: 10 AM – 8 PM').trim(),
      phone: String(b.phone || '+91 9014540489').trim(),
      maps_url: String(b.maps_url || b.maps_query || '').trim(),
      status: String(b.status || 'Active').trim()
    };
  };

  // Helper to ensure all fields are normalized for invoices
  const mergeInvoiceDefaults = (inv: any): InvoiceItem => {
    if (!inv) {
      return {
        id: Date.now(),
        invoice_number: `43${Date.now().toString().slice(-2)}`,
        customer_name: 'Customer',
        mobile: '',
        vehicle: '',
        reg_number: '',
        price: 0,
        payment_mode: 'Not Disclosed',
        has_echarger: false,
        echarger_details: '',
        documents: [],
        delivery_note: {},
        show_price_view: false,
        show_price_public: false,
        notes: '',
        created_at: new Date().toISOString()
      };
    }

    const rawDocs = Array.isArray(inv.documents) ? inv.documents : [];
    const metaDoc = rawDocs.find((d: any) => d?.type === '__dn_meta' || d?.id === '__dn_meta');
    let parsedMeta: any = null;
    if (metaDoc?.size) {
      try {
        parsedMeta = JSON.parse(metaDoc.size);
      } catch {}
    }
    const visibleDocs = rawDocs.filter((d: any) => d?.type !== '__dn_meta' && d?.id !== '__dn_meta');

    return {
      id: inv.id || Date.now(),
      invoice_number: String(inv.invoice_number || inv.invoice_id || `43${Date.now().toString().slice(-2)}`).trim(),
      customer_name: String(inv.customer_name || inv.owner || 'Customer').trim(),
      mobile: String(inv.mobile || inv.phone || '').trim(),
      vehicle: String(inv.vehicle || '').trim(),
      reg_number: String(inv.reg_number || inv.reg_no || '').trim(),
      price: cleanNumber(inv.price, 0),
      payment_mode: String(inv.payment_mode || 'Not Disclosed').trim(),
      has_echarger: Boolean(inv.has_echarger),
      echarger_details: String(inv.echarger_details || '').trim(),
      documents: visibleDocs,
      delivery_note: inv.delivery_note || parsedMeta?.delivery_note || undefined,
      show_price_view: Boolean(inv.show_price_view ?? parsedMeta?.show_price_view ?? false),
      show_price_public: Boolean(inv.show_price_public ?? parsedMeta?.show_price_public ?? false),
      notes: String(inv.notes || '').trim(),
      created_at: inv.created_at || new Date().toISOString()
    };
  };

  // Data States (Initialized from localStorage or live DB — never inject demo SEED_BIKES over real DB inventory)
  const [bikes, setBikes] = useState<BikeItem[]>(() => {
    try {
      const saved = localStorage.getItem('adarsh_bikes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter((b: any) => {
            if (isAccessoryItem(b)) return false;
            const isLegacyDemoSeed =
              typeof b?.id === 'number' &&
              b.id >= 1 &&
              b.id <= 18 &&
              SEED_BIKES.some((s) => s.id === b.id && s.name === b.name);
            return !isLegacyDemoSeed;
          });
          return realOnly.map((b: any) => ({
            ...mergeBikeDefaults(b),
            category: canonicalizeBikeCategory(b?.category),
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [leads, setLeads] = useState<LeadItem[]>(() => {
    try {
      const saved = localStorage.getItem('adarsh_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(mergeLeadDefaults);
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [invoices, setInvoices] = useState<InvoiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('adarsh_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(mergeInvoiceDefaults);
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [branches, setBranches] = useState<BranchItem[]>(() => {
    try {
      const saved = localStorage.getItem('adarsh_branches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(mergeBranchDefaults);
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [ownerAccounts, setOwnerAccounts] = useState<OwnerAccount[]>(() => {
    try {
      const saved = localStorage.getItem('adarsh_owners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SEED_OWNERS;
    } catch {
      return SEED_OWNERS;
    }
  });

  const [staff, setStaff] = useState<StaffItem[]>(() => {
    try {
      const saved = localStorage.getItem('adarsh_staff');
      const parsed = saved ? JSON.parse(saved) : SEED_STAFF;
      return dedupeStaffByPhone(Array.isArray(parsed) ? parsed : SEED_STAFF);
    } catch {
      return SEED_STAFF;
    }
  });

  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('adarsh_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const LEGACY_DEFAULT_TITLES = new Set([
          'BUY YOUR DREAM SUPERBIKE',
          'SELL YOUR BIKE IN 15 MINUTES',
          'DYNO TUNING & SUPERBIKE SPA',
          '0% PROCESSING FEE & 8.5% EMI',
          'EXCLUSIVE SUNDAY SUPERBIKE RIDES',
        ]);
        const rawSlides = Array.isArray(parsed.heroSlides) ? parsed.heroSlides : [];
        const isLegacyDefaults =
          rawSlides.length > 0 &&
          rawSlides.every((s: any) => LEGACY_DEFAULT_TITLES.has(String(s?.title || '').trim()));
        const hydratedSlides = isLegacyDefaults
          ? DEFAULT_HERO_SLIDES.map((def, idx) => ({
              ...def,
              image: rawSlides[idx]?.image || def.image,
            }))
          : normalizeHeroSlides(parsed.heroSlides, DEFAULT_HERO_SLIDES);
        return {
          ...DEFAULT_SITE_SETTINGS,
          ...parsed,
          heroSlides: hydratedSlides,
        };
      }
      return DEFAULT_SITE_SETTINGS;
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  });

  // CMS Sub-Tab & Hero Slider editing state (helplines strictly reserved for Owner)
  const [cmsActiveSubTab, setCmsActiveSubTab] = useState<'helplines' | 'social' | 'hero' | 'banner' | 'dealership' | 'features'>(() =>
    currentUser?.role === 'owner' ? 'helplines' : 'social'
  );
  useEffect(() => {
    if (currentUser && currentUser.role !== 'owner' && cmsActiveSubTab === 'helplines') {
      setCmsActiveSubTab('social');
    }
  }, [currentUser, cmsActiveSubTab]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [editingHeroSlide, setEditingHeroSlide] = useState<HeroSlideItem | null>(null);
  const [showSlideEditModal, setShowSlideEditModal] = useState<boolean>(false);
  const [cmsSaveLoading, setCmsSaveLoading] = useState<boolean>(false);
  const [savingPhoneField, setSavingPhoneField] = useState<string | null>(null);
  const [savedPhoneField, setSavedPhoneField] = useState<string | null>(null);
  const [cmsAutoSyncState, setCmsAutoSyncState] = useState<'synced' | 'syncing' | 'error'>('synced');
  const skipNextSettingsAutoSyncRef = useRef<boolean>(true);
  const lastLocalSettingsSyncAtRef = useRef<number>(0);

  const [alerts, setAlerts] = useState<{ id: number; type: string; title: string; detail: string; time: string }[]>([
    { id: 1, type: 'lead', title: 'New enquiry received', detail: 'Kiran Varma for Kawasaki Ninja Z900', time: '15m ago' },
    { id: 2, type: 'inventory', title: 'Stock status updated', detail: 'KTM Duke 390 marked as Booked', time: '1h ago' },
    { id: 3, type: 'invoice', title: 'Invoice #AM-2026-101 billed', detail: '₹85,000 via UPI (Ananya Deshmukh)', time: '1d ago' }
  ]);

  // Modals & UI Controls
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [showLiveCustomerWebsiteModal, setShowLiveCustomerWebsiteModal] = useState(false);
  const [isCustomerStorefrontRoute, setIsCustomerStorefrontRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash === '#showroom' || new URLSearchParams(window.location.search).get('view') === 'storefront';
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone?: 'danger' | 'emerald';
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [showMobileNavDrawer, setShowMobileNavDrawer] = useState(false);
  const [isRefreshingLeads, setIsRefreshingLeads] = useState(false);
  const [editingBike, setEditingBike] = useState<BikeItem | null>(null);
  const [bikeModalImage, setBikeModalImage] = useState<string>('');
  const [showGalleryPicker, setShowGalleryPicker] = useState<boolean>(false);
  const [useUrlFallback, setUseUrlFallback] = useState<boolean>(false);

  useEffect(() => {
    const syncRoute = () => {
      const isStorefront = window.location.hash === '#showroom' || new URLSearchParams(window.location.search).get('view') === 'storefront';
      setIsCustomerStorefrontRoute(isStorefront);
    };
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const compressBikeImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) {
          resolve('');
          return;
        }
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1080;
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
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (file: File) => {
    if (!file) return;
    const compressed = await compressBikeImageFile(file);
    if (compressed) {
      setBikeModalImage(compressed);
      showToast('Photo uploaded & optimized from device!');
    }
  };
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceItem | null>(null);
  const [showPrintInvoiceModal, setShowPrintInvoiceModal] = useState<InvoiceItem | null>(null);
  const [printInvoicePublicMode, setPrintInvoicePublicMode] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [branchForm, setBranchForm] = useState({
    city: '',
    branch_name: '',
    address: '',
    timings: 'Mon–Sat: 10 AM – 8 PM',
    status: 'Active',
    phone: '+91 9014540489',
    maps_url: ''
  });
  const [isLocatingBranch, setIsLocatingBranch] = useState(false);
  const [isSavingBranch, setIsSavingBranch] = useState(false);

  const openBranchModal = (br?: BranchItem | null) => {
    setEditingBranch(br || null);
    setBranchForm({
      city: br?.city || '',
      branch_name: br?.branch_name || '',
      address: br?.address || '',
      timings: br?.timings || 'Mon–Sat: 10 AM – 8 PM',
      status: br?.status || 'Active',
      phone: br?.phone || '+91 9014540489',
      maps_url: br?.maps_url || ''
    });
    setShowBranchModal(true);
  };

  const handleBranchMapsInputChange = (val: string) => {
    const parsed = parseGoogleMapsLocation(val);
    setBranchForm(prev => ({
      ...prev,
      maps_url: val,
      address: !prev.address.trim() && parsed.placeLabel ? parsed.placeLabel : prev.address,
      city: !prev.city.trim() && parsed.cityHint ? parsed.cityHint : prev.city
    }));
  };

  const handleCaptureBranchGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('GPS geolocation not supported in this browser. Open Google Maps to select your pin.');
      return;
    }
    setIsLocatingBranch(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const gpsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        setBranchForm(prev => ({ ...prev, maps_url: gpsUrl }));
        setIsLocatingBranch(false);
        showToast(`Captured store GPS pin: ${lat}, ${lng}`);
      },
      (err) => {
        setIsLocatingBranch(false);
        showToast(`Location access unavailable (${err.message}). Use "Open in Google Maps" and paste link.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
  const [staffModalError, setStaffModalError] = useState('');
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<OwnerAccount | null>(null);
  const [ownerModalError, setOwnerModalError] = useState('');
  const [bikeModalSegment, setBikeModalSegment] = useState<'superbikes' | 'budget'>('superbikes');

  // Digital Billing States & Document Uploads
  const [invoiceFormDocs, setInvoiceFormDocs] = useState<InvoiceDoc[]>([]);
  const [invoiceHasEcharger, setInvoiceHasEcharger] = useState<boolean>(false);
  const [invoiceEchargerDetails, setInvoiceEchargerDetails] = useState<string>('7.4kW Fast Home Charging Unit (S/N: CHG-2026-904)');
  const [invoiceDocType, setInvoiceDocType] = useState<string>('rc');
  const [invoiceFormShowPriceView, setInvoiceFormShowPriceView] = useState<boolean>(false);
  const [invoiceFormShowPricePublic, setInvoiceFormShowPricePublic] = useState<boolean>(false);
  const [invoiceFormCategory, setInvoiceFormCategory] = useState<'Car' | 'M.Cycle' | 'Scooter' | 'Registered'>('M.Cycle');
  const [billingSearch, setBillingSearch] = useState<string>('');

  // Customer / Buyer Ownership Portal States (Phone + OTP Protected)
  const [authViewMode, setAuthViewMode] = useState<'admin' | 'customer'>('admin');
  const [customerSearchInput, setCustomerSearchInput] = useState<string>('');
  const [customerRegFilter, setCustomerRegFilter] = useState<string>('');
  const [customerOtpStep, setCustomerOtpStep] = useState<'phone' | 'otp'>('phone');
  const [customerOtpCode, setCustomerOtpCode] = useState<string>('');
  const [customerOtpNotice, setCustomerOtpNotice] = useState<string>('');
  const [customerOtpDemoCode, setCustomerOtpDemoCode] = useState<string>('');
  const [customerOtpCooldown, setCustomerOtpCooldown] = useState<number>(0);
  const [isSendingCustomerOtp, setIsSendingCustomerOtp] = useState<boolean>(false);
  const [customerLookupResult, setCustomerLookupResult] = useState<InvoiceItem | null>(null);
  const [customerLookupError, setCustomerLookupError] = useState<string>('');
  const [showCustomerHubModal, setShowCustomerHubModal] = useState<InvoiceItem | null>(null);
  const [previewDocModal, setPreviewDocModal] = useState<InvoiceDoc | null>(null);

  useEffect(() => {
    if (customerOtpCooldown <= 0) return;
    const t = window.setTimeout(() => setCustomerOtpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [customerOtpCooldown]);

  // Staff Activity & Audit Log States
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('adarsh_audit_logs');
      return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS;
    } catch {
      return SEED_AUDIT_LOGS;
    }
  });
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditStaffFilter, setAuditStaffFilter] = useState<string>('ALL');
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('ALL');
  const [auditRoleFilter, setAuditRoleFilter] = useState<'ALL' | 'staff' | 'owner'>('ALL');
  const [showRawAuditJson, setShowRawAuditJson] = useState<boolean>(false);

  // Dedicated Vehicle Interested Leads Modal & Form States
  const [selectedBikeForLeads, setSelectedBikeForLeads] = useState<BikeItem | null>(null);
  const [showAddLeadForBike, setShowAddLeadForBike] = useState<boolean>(false);
  const [newLeadName, setNewLeadName] = useState<string>('');
  const [newLeadPhone, setNewLeadPhone] = useState<string>('');
  const [newLeadServiceType, setNewLeadServiceType] = useState<string>('Test Ride & Finance');
  const [newLeadMessage, setNewLeadMessage] = useState<string>('');
  const [newLeadStatus, setNewLeadStatus] = useState<LeadItem['status']>('New');

  // Customer Showroom Live Preview States (Exact Customer Website View from Screenshots)
  const [customerPreviewBike, setCustomerPreviewBike] = useState<BikeItem | null>(null);
  const [previewAngleIndex, setPreviewAngleIndex] = useState<number>(0);
  const [previewColorwayIndex, setPreviewColorwayIndex] = useState<number>(0);
  const [previewAddonSelected, setPreviewAddonSelected] = useState<boolean>(true);
  const [isAutoPlayAngles, setIsAutoPlayAngles] = useState<boolean>(false);
  const [bikeToDelete, setBikeToDelete] = useState<BikeItem | null>(null);
  const [isDeletingBike, setIsDeletingBike] = useState<boolean>(false);
  const [newImageUrlInput, setNewImageUrlInput] = useState<string>('');

  // Autoplay for customer preview vehicle angles (photo slideshow)
  useEffect(() => {
    if (!customerPreviewBike || !isAutoPlayAngles) return;
    const gallery = customerPreviewBike.gallery_urls && customerPreviewBike.gallery_urls.length > 0
      ? customerPreviewBike.gallery_urls
      : [customerPreviewBike.image_url];
    if (gallery.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewAngleIndex(prev => (prev + 1) % gallery.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [customerPreviewBike, isAutoPlayAngles]);

  // Expanded Bike Modal Specification Form States (Matching Screenshots 1, 2, 3)
  const [activeBikeModalTab, setActiveBikeModalTab] = useState<'core' | 'specs' | 'marketing' | 'photos'>('core');
  const [bikeModalDisplacement, setBikeModalDisplacement] = useState<string>('1158 cc');
  const [bikeModalEngineType, setBikeModalEngineType] = useState<string>('V4 1158 cc Granturismo');
  const [bikeModalPower, setBikeModalPower] = useState<string>('168 hp');
  const [bikeModalAcceleration, setBikeModalAcceleration] = useState<string>('3.1s');
  const [bikeModalFuel, setBikeModalFuel] = useState<string>('Petrol');
  const [bikeModalLocation, setBikeModalLocation] = useState<string>('Hyderabad – Main Showroom');
  const [bikeModalTagline, setBikeModalTagline] = useState<string>('Muscular stance with superbike heart.');
  const [bikeModalColorways, setBikeModalColorways] = useState<BikeColorway[]>([
    { name: "Solar Orange", hex: "#EA580C" },
    { name: "Ducati Red", hex: "#DC2626" },
    { name: "Dark Stealth", hex: "#334155" },
    { name: "Pearl White", hex: "#F8FAFC" },
    { name: "Racing Blue", hex: "#2563EB" }
  ]);
  const [bikeModalAddonName, setBikeModalAddonName] = useState<string>('Ducati Corse Riding Leather');
  const [bikeModalAddonPrice, setBikeModalAddonPrice] = useState<number>(38500);
  const [bikeModalWarranty, setBikeModalWarranty] = useState<string>('Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty.');
  const [bikeModalAngleImages, setBikeModalAngleImages] = useState<string[]>([
    '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png',
    '/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png',
    '/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png'
  ]);

  // Multi-image upload handler (choose multiple photos from laptop or phone with compression)
  const handleMultipleImageFiles = async (files: FileList) => {
    const filesArray = Array.from(files);
    if (filesArray.length === 0) return;

    const compressedList = await Promise.all(
      filesArray.map((f) => compressBikeImageFile(f))
    );
    const newUrls = compressedList.filter(Boolean);

    if (newUrls.length > 0) {
      setBikeModalAngleImages(prev => {
        const updated = [...prev, ...newUrls];
        if (!bikeModalImage && updated.length > 0) {
          setBikeModalImage(updated[0]);
        }
        return updated;
      });
      showToast(`Added ${newUrls.length} optimized photo(s) to gallery!`);
    }
  };

  // Open Bike Add Modal with rich defaults tailored to Superbikes or Budget Bikes
  const openAddBikeModal = (segment: 'superbikes' | 'budget' = 'superbikes') => {
    setEditingBike(null);
    setBikeModalSegment(segment);
    if (segment === 'budget') {
      setBikeModalImage('/assets/aistudio/image_f4045ab9.png');
      setBikeModalDisplacement('125 cc');
      setBikeModalEngineType('125 cc Fuel-Injected Single');
      setBikeModalPower('11.2 hp');
      setBikeModalAcceleration('5.4s');
      setBikeModalFuel('Petrol');
      setBikeModalLocation(branches[0]?.branch_name || 'Hyderabad – Main Showroom');
      setBikeModalTagline('Reliable commuter inspected and ready for instant delivery.');
      setBikeModalColorways([
        { name: "Matte Axis Grey", hex: "#475569" },
        { name: "Pearl Siren Blue", hex: "#1E40AF" },
        { name: "Spark Black", hex: "#0F172A" }
      ]);
      setBikeModalAddonName('Studds Ninja Elite Helmet');
      setBikeModalAddonPrice(2400);
      setBikeModalWarranty('Adarsh Verified: 80-Point Inspection, Clear Title & 6-Month Engine Warranty.');
      setBikeModalAngleImages(['/assets/aistudio/image_f4045ab9.png']);
    } else {
      setBikeModalImage('/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png');
      setBikeModalDisplacement('1158 cc');
      setBikeModalEngineType('V4 1158 cc Granturismo');
      setBikeModalPower('168 hp');
      setBikeModalAcceleration('3.1s');
      setBikeModalFuel('Petrol');
      setBikeModalLocation(branches[0]?.branch_name || 'Hyderabad – Main Showroom');
      setBikeModalTagline('Muscular stance with superbike heart.');
      setBikeModalColorways([
        { name: "Solar Orange", hex: "#EA580C" },
        { name: "Ducati Red", hex: "#DC2626" },
        { name: "Dark Stealth", hex: "#334155" },
        { name: "Pearl White", hex: "#F8FAFC" },
        { name: "Racing Blue", hex: "#2563EB" }
      ]);
      setBikeModalAddonName('Ducati Corse Riding Leather');
      setBikeModalAddonPrice(38500);
      setBikeModalWarranty('Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty.');
      setBikeModalAngleImages([
        '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png',
        '/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png',
        '/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png'
      ]);
    }
    setActiveBikeModalTab('core');
    setShowGalleryPicker(false);
    setUseUrlFallback(false);
    setShowBikeModal(true);
  };

  // Open Bike Edit Modal preloaded with existing specs
  const openEditBikeModal = (b: BikeItem) => {
    const cleanMainImg = normalizeLocalAssetUrl(b.image_url, '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png');
    const isBudget =
      isBudgetVehicleCategory(b.category, b.price, b.name) &&
      normalizeBikeCategory(b.category) !== 'riding gear';
    setEditingBike(b);
    setBikeModalSegment(isBudget ? 'budget' : 'superbikes');
    setBikeModalImage(cleanMainImg);
    setBikeModalDisplacement(b.displacement_cc || (isBudget ? '125 cc' : '1158 cc'));
    setBikeModalEngineType(b.engine_type || (isBudget ? '125 cc Single FI' : 'V4 1158 cc Granturismo'));
    setBikeModalPower(b.max_power || (isBudget ? '11.2 hp' : '168 hp'));
    setBikeModalAcceleration(b.acceleration || (isBudget ? '5.4s' : '3.1s'));
    setBikeModalFuel(b.fuel_type || 'Petrol');
    setBikeModalLocation(b.location || 'Hyderabad – Main Showroom');
    setBikeModalTagline(b.tagline || (isBudget ? 'Reliable certified commuter ready for instant delivery.' : 'Muscular stance with superbike heart.'));
    setBikeModalColorways(b.colorways && b.colorways.length > 0 ? b.colorways : [
      { name: "Solar Orange", hex: "#EA580C" },
      { name: "Ducati Red", hex: "#DC2626" },
      { name: "Dark Stealth", hex: "#334155" }
    ]);
    setBikeModalAddonName(b.addon_gear_name || (isBudget ? 'Studds Ninja Elite Helmet' : 'Ducati Corse Riding Leather'));
    setBikeModalAddonPrice(b.addon_gear_price || (isBudget ? 2400 : 38500));
    setBikeModalWarranty(b.warranty_badge || 'Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty.');
    setBikeModalAngleImages(
      b.gallery_urls && b.gallery_urls.length > 0
        ? b.gallery_urls.map(u => normalizeLocalAssetUrl(u, FALLBACK_SHOWROOM_IMAGE))
        : [cleanMainImg]
    );
    setActiveBikeModalTab('core');
    setShowGalleryPicker(false);
    setUseUrlFallback(false);
    setShowBikeModal(true);
  };

  // Open Customer Modal Preview
  const openCustomerPreview = (b: BikeItem) => {
    setCustomerPreviewBike(b);
    setPreviewAngleIndex(0);
    setPreviewColorwayIndex(0);
    setPreviewAddonSelected(true);
    setIsAutoPlayAngles(false);
  };

  // Safe & Reliable Delete Bike from Local State and Supabase
  const executeDeleteBike = async (b: BikeItem) => {
    setIsDeletingBike(true);
    const targetId = b.id;

    // 1. Instantly update UI so user immediately sees vehicle removed
    setBikes(prev => prev.filter(item => String(item.id) !== String(targetId)));

    logAuditAction(
      'inventory_delete',
      'Inventory',
      `${currentUser?.name || 'Staff'} deleted vehicle ${b.name} (ID: #${b.id})`,
      b.id,
      b.name,
      { notes: 'Vehicle removed from showroom stock & customer website' }
    );

    // 2. Delete from Supabase (handling text and numeric IDs)
    try {
      const { error: err1 } = await supabase.from('bikes').delete().eq('id', String(targetId));
      if (err1 && !isNaN(Number(targetId))) {
        await supabase.from('bikes').delete().eq('id', Number(targetId));
      }
      showToast(`✅ Successfully deleted ${b.name} from website and database`);
    } catch (err: any) {
      console.error("Delete bike error:", err);
      showToast(`Removed from local inventory (${err?.message || 'Database sync error'})`);
    } finally {
      setIsDeletingBike(false);
      setBikeToDelete(null);
    }
  };

  // Helper: persist a single bike status update to Supabase with clear error reporting
  const syncBikeStatusToSupabase = async (b: BikeItem, nextStatus: BikeItem['status'], successMsg: string) => {
    try {
      const { error: err1 } = await supabase.from('bikes').update({ status: nextStatus }).eq('id', String(b.id));
      if (err1 && !isNaN(Number(b.id))) {
        const { error: err2 } = await supabase.from('bikes').update({ status: nextStatus }).eq('id', Number(b.id));
        if (err2) {
          showToast(`Saved locally — Supabase sync error: ${err2.message}`);
          return;
        }
      } else if (err1) {
        showToast(`Saved locally — Supabase sync error: ${err1.message}`);
        return;
      }
      showToast(successMsg);
    } catch (err: any) {
      console.error("Supabase bike status sync error:", err);
      showToast(`Saved locally — Database note: ${err?.message || 'Check connection'}`);
    }
  };

  // 1-Tap Status Toggle between 'Available' and 'Sold' pushing directly to Supabase 'bikes' table
  const toggleBikeStatus = async (b: BikeItem) => {
    const nextStatus: 'Available' | 'Sold' = b.status === 'Available' ? 'Sold' : 'Available';
    const prevStatus = b.status;

    setBikes(prev => prev.map(item => String(item.id) === String(b.id) ? { ...item, status: nextStatus } : item));

    logAuditAction(
      'inventory_edit',
      'Inventory',
      `${currentUser?.name || 'Staff'} toggled status of ${b.name} from '${prevStatus}' to '${nextStatus}'`,
      b.id,
      b.name,
      { field: 'status', before: prevStatus, after: nextStatus, notes: 'Direct 1-tap status toggle' }
    );

    await syncBikeStatusToSupabase(b, nextStatus, `${b.name} marked as ${nextStatus.toUpperCase()} on Website!`);
  };

  // 1-Tap Public Website Visibility Toggle per Vehicle ('Available' <-> 'Hidden')
  const toggleBikePublicVisibility = async (b: BikeItem) => {
    const currentlyHidden = b.status === 'Hidden';
    const nextStatus: BikeItem['status'] = currentlyHidden ? 'Available' : 'Hidden';
    const prevStatus = b.status;

    setBikes(prev => prev.map(item => String(item.id) === String(b.id) ? { ...item, status: nextStatus } : item));

    logAuditAction(
      'inventory_edit',
      'Inventory',
      `${currentUser?.name || 'Staff'} turned public visibility of ${b.name} ${currentlyHidden ? 'ON (Available)' : 'OFF (Hidden)'}`,
      b.id,
      b.name,
      { field: 'status', before: prevStatus, after: nextStatus, notes: '1-tap public visibility toggle' }
    );

    await syncBikeStatusToSupabase(
      b,
      nextStatus,
      currentlyHidden
        ? `${b.name} is now VISIBLE on customer website (ON)`
        : `${b.name} is now HIDDEN from customer website (OFF)`
    );
  };

  // Dedicated 1-Tap Status Action for Leads CRM ('leads' table)
  const updateLeadStatus = async (leadId: number | string, newStatus: 'Contacted' | 'Closed' | 'New' | 'Follow-up' | (string & {})) => {
    const leadObj = leads.find(l => String(l.id) === String(leadId));
    const prevStatus = leadObj?.status || 'New';

    // 1. Optimistic UI update
    setLeads(prev => prev.map(item => String(item.id) === String(leadId) ? { ...item, status: newStatus } : item));

    logAuditAction(
      'lead_status',
      'Leads CRM',
      `${currentUser?.name || 'Staff'} marked lead for ${leadObj?.customer_name || 'Customer'} as '${newStatus}'`,
      leadId,
      leadObj?.customer_name,
      { field: 'status', before: prevStatus, after: newStatus, notes: '1-tap status action' }
    );

    // 2. Direct Supabase write to 'leads' table
    try {
      const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
      if (error) {
        console.error("Supabase lead update error:", error);
        showToast(`Saved locally — Supabase lead sync error: ${error.message}`);
      } else {
        showToast(`Lead updated to "${newStatus}" in Supabase!`);
      }
    } catch (err: any) {
      console.error("Network error updating lead in Supabase:", err);
      showToast(`Saved locally — Network error: ${err?.message || 'Unable to sync lead'}`);
    }
  };

  // Refresh Customer Inquiries Dynamically from 'leads' table
  const refreshLeadsFromSupabase = async () => {
    setIsRefreshingLeads(true);
    try {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) {
        showToast(`Error fetching leads: ${error.message}`);
      } else if (data) {
        setLeads(data.map(mergeLeadDefaults));
        showToast(`Fetched ${data.length} customer inquiries from Supabase!`);
      }
    } catch (err: any) {
      showToast(`Network error: ${err?.message || 'Unable to connect to Supabase'}`);
    } finally {
      setIsRefreshingLeads(false);
    }
  };

  // Capture a Specialized Lead (Exchange / Sell, Loan / Finance, or Service / Workshop)
  const handleCreateSpecializedLead = async (payload: {
    name: string;
    phone: string;
    bike_model: string;
    notes: string;
    service_type: string;
  }) => {
    const tempId = Date.now();
    const createdAt = new Date().toISOString();
    const optimisticLead = mergeLeadDefaults({
      id: tempId,
      customer_name: payload.name,
      phone: payload.phone,
      bike_interested: payload.bike_model,
      service_type: payload.service_type,
      message: payload.notes,
      status: 'New',
      created_at: createdAt,
    });

    setLeads(prev => [optimisticLead, ...prev]);
    logAuditAction(
      'lead_view',
      'Leads CRM',
      `${currentUser?.name || 'Staff'} captured ${payload.service_type} lead for ${payload.name} (${payload.phone})`,
      tempId,
      `${payload.name} (${payload.bike_model})`,
      { notes: payload.notes || payload.service_type }
    );

    try {
      const baseInsert = {
        type: payload.service_type,
        name: payload.name,
        phone: payload.phone,
        bike_model: payload.bike_model,
        notes: payload.notes,
        status: 'New',
      };
      let { data, error } = await supabase
        .from('leads')
        .insert([{ ...baseInsert, service_type: payload.service_type }])
        .select()
        .single();

      if (error) {
        const fallback = await supabase
          .from('leads')
          .insert([baseInsert])
          .select()
          .single();
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        showToast(`Lead captured locally — Supabase note: ${error.message}`);
      } else {
        if (data?.id) {
          setLeads(prev => prev.map(item => String(item.id) === String(tempId) ? mergeLeadDefaults(data) : item));
        }
        showToast(`${payload.service_type} lead captured for ${payload.name}!`);
      }
    } catch (err: any) {
      showToast(`Lead captured locally — Network error: ${err?.message || 'Unable to sync'}`);
    }
  };

  // Step-by-Step Mobile Hardware & Interface Back Button Navigation
  const handleGoBack = () => {
    // 1. If any modal, drawer, or preview is open, dismiss it first
    if (showMobileNavDrawer) {
      setShowMobileNavDrawer(false);
      return;
    }
    if (showLiveCustomerWebsiteModal) {
      setShowLiveCustomerWebsiteModal(false);
      return;
    }
    if (showBikeModal) {
      setShowBikeModal(false);
      return;
    }
    if (showLeadModal) {
      setShowLeadModal(false);
      return;
    }
    if (showInvoiceModal) {
      setShowInvoiceModal(false);
      return;
    }
    if (showSqlModal) {
      setShowSqlModal(false);
      return;
    }
    if (customerPreviewBike) {
      setCustomerPreviewBike(null);
      return;
    }
    if (selectedBikeForLeads) {
      setSelectedBikeForLeads(null);
      return;
    }
    if (bikeToDelete) {
      setBikeToDelete(null);
      return;
    }

    // 2. Pop only permitted sections from navigation history
    const allowedHistory = navigationHistory.filter((t) => hasAccess(t));
    if (allowedHistory.length > 1) {
      const nextHistory = [...allowedHistory];
      nextHistory.pop();
      const previousTab = nextHistory[nextHistory.length - 1];
      if (previousTab && hasAccess(previousTab)) {
        setNavigationHistory(nextHistory);
        setActiveTabRaw(previousTab as any);
        showToast(`Back to ${previousTab.replace(/_/g, ' ').toUpperCase()}`);
        return;
      }
    }

    if (hasAccess('overview') && activeTab !== 'overview') {
      setActiveTabRaw('overview');
      setNavigationHistory(['overview']);
      showToast("Back to Operations Overview");
    } else {
      const fallbackTab = getFirstAllowedTab(currentUser);
      if (fallbackTab && activeTab !== fallbackTab) {
        setActiveTabRaw(fallbackTab as any);
        setNavigationHistory([fallbackTab]);
        return;
      }
      // 3. User is on their root permitted section.
      // Prevent accidental exit: Double-tap within 2.2 seconds allows exit!
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2200) {
        showToast("Exiting Dealership Portal...");
        window.history.back();
      } else {
        lastBackPressTimeRef.current = now;
        try {
          window.history.pushState({ tab: activeTab, root: true }, '', `#${activeTab}`);
        } catch {}
        showToast("Press back again to exit");
      }
    }
  };

  // Mobile Hardware & Browser Back Button Listener
  useEffect(() => {
    try {
      window.history.replaceState({ tab: 'overview', root: true }, '', '#overview');
      window.history.pushState({ tab: 'overview', root: true }, '', '#overview');
    } catch {}

    const onPopState = () => {
      handleGoBack();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [
    navigationHistory,
    activeTab,
    showMobileNavDrawer,
    showLiveCustomerWebsiteModal,
    showBikeModal,
    showLeadModal,
    showInvoiceModal,
    showSqlModal,
    customerPreviewBike,
    selectedBikeForLeads,
    bikeToDelete
  ]);

  // Centralized Staff Activity Logger
  const logAuditAction = (
    action_type: AuditLogItem['action_type'],
    module: AuditLogItem['module'],
    description: string,
    target_id?: string | number,
    target_name?: string,
    details?: AuditLogItem['details']
  ) => {
    const newEntry: AuditLogItem = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      staff_name: currentUser ? currentUser.name : 'Pavan Kumar (Owner)',
      staff_phone: currentUser ? currentUser.phone : '9014540489',
      role: currentUser ? currentUser.role : 'owner',
      action_type,
      module,
      description,
      target_id,
      target_name,
      details
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  // Export Audit Logs to CSV
  const exportAuditCsv = () => {
    const headers = ['Log ID', 'Timestamp (UTC)', 'Staff Name', 'Staff Phone', 'Role', 'Module', 'Action Type', 'Description', 'Target Name', 'Notes'];
    const rows = auditLogs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.staff_name}"`,
      `"${l.staff_phone}"`,
      `"${l.role}"`,
      `"${l.module}"`,
      `"${l.action_type}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${(l.target_name || '').replace(/"/g, '""')}"`,
      `"${(l.details?.notes || l.details?.field || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Adarsh_Motors_Staff_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported Staff Activity & Audit history to CSV!');
  };

  const handleInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newDoc: InvoiceDoc = {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          url: dataUrl,
          type: invoiceDocType,
          size: (file.size / 1024).toFixed(1) + ' KB'
        };
        setInvoiceFormDocs(prev => [...prev, newDoc]);
        showToast(`Document attached: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const addSampleInvoiceDocs = () => {
    const samples: InvoiceDoc[] = [
      { id: 'sample_rc', name: "Official_RC_SmartCard.jpg", url: "/assets/aistudio/image_f4045ab9.png", type: "rc", size: "380 KB" },
      { id: 'sample_ins', name: "Comprehensive_Vehicle_Insurance.pdf", url: "/assets/aistudio/image_f4045ab9.png", type: "insurance", size: "520 KB" },
      { id: 'sample_del', name: "Delivery_Ceremony_Handover.jpg", url: "/assets/aistudio/image_b40a39bd.png", type: "photo", size: "850 KB" }
    ];
    setInvoiceFormDocs(prev => [...prev, ...samples]);
    showToast("Added sample showroom vehicle documents!");
  };

  // Persist Invoice + Delivery Note + Price Visibility flags safely to Supabase
  const syncInvoiceToSupabase = async (inv: InvoiceItem): Promise<{ ok: boolean; errorMessage?: string }> => {
    const cleanDocs = (inv.documents || []).filter(d => d.type !== '__dn_meta' && d.id !== '__dn_meta');
    const docsWithMeta: InvoiceDoc[] = [
      ...cleanDocs,
      {
        id: '__dn_meta',
        name: '__dn_meta',
        url: '',
        type: '__dn_meta',
        size: JSON.stringify({
          delivery_note: inv.delivery_note || {},
          show_price_view: Boolean(inv.show_price_view),
          show_price_public: Boolean(inv.show_price_public),
        }),
      },
    ];

    const baseRow = {
      id: String(inv.id),
      invoice_number: inv.invoice_number,
      invoice_id: inv.invoice_number,
      customer_name: inv.customer_name,
      owner: inv.customer_name,
      phone: inv.mobile,
      mobile: inv.mobile,
      vehicle: inv.vehicle,
      reg_no: inv.reg_number,
      reg_number: inv.reg_number,
      price: Number(inv.price || 0),
      payment_mode: inv.payment_mode || 'Not Disclosed',
      has_echarger: Boolean(inv.has_echarger),
      echarger_details: inv.echarger_details || '',
      documents: docsWithMeta,
      notes: inv.notes || '',
      created_at: inv.created_at,
    };

    try {
      const { error } = await supabase
        .from('invoices')
        .upsert(
          [
            {
              ...baseRow,
              delivery_note: inv.delivery_note || {},
              show_price_view: Boolean(inv.show_price_view),
              show_price_public: Boolean(inv.show_price_public),
            },
          ],
          { onConflict: 'id' }
        );

      if (error) {
        // Fallback if remote Supabase table hasn't added the new top-level columns yet
        const fallbackRes = await supabase
          .from('invoices')
          .upsert([baseRow], { onConflict: 'id' });
        if (fallbackRes.error) {
          return { ok: false, errorMessage: fallbackRes.error.message };
        }
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, errorMessage: err?.message || 'Unable to sync' };
    }
  };

  // Toggle Price visibility (View or Public) for a specific invoice
  const handleToggleInvoicePriceFlag = async (
    inv: InvoiceItem,
    field: 'show_price_view' | 'show_price_public'
  ) => {
    const nextVal = !Boolean(inv[field]);
    const updated: InvoiceItem = { ...inv, [field]: nextVal };

    setInvoices(prev => prev.map(item => (item.id === inv.id ? updated : item)));
    if (showPrintInvoiceModal?.id === inv.id) {
      setShowPrintInvoiceModal(updated);
    }
    if (showCustomerHubModal?.id === inv.id) {
      setShowCustomerHubModal(updated);
    }

    logAuditAction(
      'billing_create',
      'Billing',
      `${currentUser?.name || 'Admin'} set ${field === 'show_price_public' ? 'Public View Price' : 'Invoice Price View'} to ${nextVal ? 'ON' : 'OFF'} for Delivery Note #${inv.invoice_number}`,
      inv.id,
      inv.invoice_number
    );

    const res = await syncInvoiceToSupabase(updated);
    const label = field === 'show_price_public' ? 'Public View Price' : 'Invoice Price Section';
    if (res.ok) {
      showToast(`${label} for #${inv.invoice_number} is now ${nextVal ? 'ON (Visible)' : 'OFF (Hidden)'}`);
    } else {
      showToast(`${label} updated locally — Supabase note: ${res.errorMessage}`);
    }
  };

  // Toggle Master Price visibility across all invoices & site_settings
  const handleToggleAllInvoicesPriceFlag = async (
    settingKey: 'enableInvoicePriceView' | 'enableInvoicePricePublic',
    invoiceField: 'show_price_view' | 'show_price_public',
    label: string
  ) => {
    const nextVal = !Boolean(settings[settingKey]);
    const nextSettings: SiteSettings = { ...settings, [settingKey]: nextVal };
    setSettings(nextSettings);

    const updatedInvoices = invoices.map(inv => ({ ...inv, [invoiceField]: nextVal }));
    setInvoices(updatedInvoices);
    if (showPrintInvoiceModal) {
      setShowPrintInvoiceModal({ ...showPrintInvoiceModal, [invoiceField]: nextVal });
    }

    logAuditAction(
      'settings_edit',
      'Billing',
      `${currentUser?.name || 'Admin'} turned ${label} ${nextVal ? 'ON' : 'OFF'} across Digital Billing`,
      settingKey,
      label
    );

    await syncSectionVisibilityToSupabase(supabase, nextSettings, settingKey, nextVal);
    await Promise.all(updatedInvoices.map(inv => syncInvoiceToSupabase(inv)));
    showToast(`${label} is now ${nextVal ? 'ON (Visible)' : 'OFF (No Price Shown)'}`);
  };

  const downloadInvoice = (inv: InvoiceItem, forcePublicMode = false) => {
    const showPriceSection = forcePublicMode
      ? Boolean(inv.show_price_public ?? settings.enableInvoicePricePublic)
      : Boolean(inv.show_price_view ?? settings.enableInvoicePriceView);
    const invoiceHtml = generateDeliveryNoteHtml(inv, { showPriceSection });

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Adarsh_Motors_Delivery_Note_${inv.invoice_number}_${(inv.reg_number || 'DOC').replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded Delivery Note #${inv.invoice_number}!`);
  };

  const handleSendCustomerOtp = async (phoneInput: string, optionalReg?: string) => {
    const rawQPhone = cleanPhone(phoneInput);
    setCustomerLookupError('');
    setCustomerLookupResult(null);

    if (rawQPhone.length !== 10) {
      setCustomerLookupError('Please enter your 10-digit registered Mobile Number to receive an OTP.');
      return;
    }
    if (optionalReg !== undefined) {
      setCustomerRegFilter(optionalReg);
    }

    setIsSendingCustomerOtp(true);
    try {
      const res = await sendPhoneOtp({
        phone: rawQPhone,
        context: 'customer',
        supabase,
        operatorConfig: otpOperatorConfig,
      });
      if (!res.ok) {
        setCustomerLookupError(res.error || res.message);
        return;
      }
      setCustomerOtpStep('otp');
      setCustomerOtpCode('');
      setCustomerOtpNotice(res.message);
      setCustomerOtpDemoCode(res.demoCode || '');
      setCustomerOtpCooldown(30);
      showToast(`OTP sent to +91 ${res.phone10} via ${res.operatorUsed}`);
    } finally {
      setIsSendingCustomerOtp(false);
    }
  };

  const handleVerifyCustomerOtp = async (phoneInput: string, otpInput: string) => {
    setCustomerLookupError('');
    const verifyRes = await verifyPhoneOtp({
      phone: phoneInput,
      otp: otpInput,
      context: 'customer',
      supabase,
      operatorConfig: otpOperatorConfig,
    });
    if (!verifyRes.ok) {
      setCustomerLookupError(verifyRes.message);
      return;
    }

    try {
      sessionStorage.setItem('adarsh_customer_verified_phone', verifyRes.phone10);
    } catch {}

    const regQuery = customerRegFilter.trim().toUpperCase().replace(/\s+/g, '');
    const match = invoices.find((inv) => {
      if (!inv) return false;
      const invPhone = cleanPhone(inv.mobile);
      const matchPhone = invPhone === verifyRes.phone10;
      if (!regQuery) return matchPhone;
      const matchReg =
        inv.reg_number &&
        String(inv.reg_number).toUpperCase().replace(/\s+/g, '') === regQuery;
      const matchInv =
        inv.invoice_number && String(inv.invoice_number).toUpperCase() === regQuery;
      return matchPhone && (matchReg || matchInv);
    });

    if (match) {
      setCustomerLookupResult(match);
      setCustomerLookupError('');
      showToast(`OTP Verified! Retrieved vehicle & docs for ${match.customer_name || 'Customer'}.`);
    } else {
      setCustomerLookupError(
        `Mobile +91 ${verifyRes.phone10} verified, but no vehicle invoice matched that number${regQuery ? ` / Reg # ${customerRegFilter}` : ''}.`
      );
      setCustomerLookupResult(null);
    }
  };

  // Filters & Search
  const [globalSearch, setGlobalSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadsStatusFilter, setLeadsStatusFilter] = useState('ALL');
  const [trendRange, setTrendRange] = useState<7 | 15 | 30>(30);

  // Toast Trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to localStorage (with compact fallback so large base64 galleries don't overflow 5MB quota)
  useEffect(() => {
    try {
      localStorage.setItem('adarsh_bikes', JSON.stringify(bikes));
    } catch {
      try {
        const compact = bikes.map((b) => ({
          ...b,
          gallery_urls: b.image_url ? [b.image_url] : []
        }));
        localStorage.setItem('adarsh_bikes', JSON.stringify(compact));
      } catch {
        try {
          const metaOnly = bikes.map((b) => ({
            ...b,
            image_url: b.image_url?.startsWith('data:') ? '' : b.image_url,
            gallery_urls: []
          }));
          localStorage.setItem('adarsh_bikes', JSON.stringify(metaOnly));
        } catch {}
      }
    }
    broadcastLiveSync('bikes', bikes);
  }, [bikes]);
  useEffect(() => {
    try { localStorage.setItem('adarsh_leads', JSON.stringify(leads)); } catch {}
  }, [leads]);
  useEffect(() => {
    try { localStorage.setItem('adarsh_invoices', JSON.stringify(invoices)); } catch {}
  }, [invoices]);
  useEffect(() => {
    try { localStorage.setItem('adarsh_branches', JSON.stringify(branches)); } catch {}
    broadcastLiveSync('branches', branches);
  }, [branches]);
  useEffect(() => {
    try { localStorage.setItem('adarsh_staff', JSON.stringify(staff)); } catch {}
  }, [staff]);
  useEffect(() => {
    try { localStorage.setItem('adarsh_owners', JSON.stringify(ownerAccounts)); } catch {}
  }, [ownerAccounts]);

  const persistOwnerAccounts = async (
    nextOwners: OwnerAccount[],
    auditDescription?: string,
    targetName?: string,
    auditDetails?: any
  ) => {
    setOwnerAccounts(nextOwners);
    try {
      localStorage.setItem('adarsh_owners', JSON.stringify(nextOwners));
    } catch {}

    // If current logged-in owner's profile changed, sync session immediately
    if (currentUser?.role === 'owner') {
      const matched = nextOwners.find(
        (o) =>
          (editingOwner && String(o.id) === String(editingOwner.id)) ||
          cleanPhone(o.phone) === cleanPhone(currentUser.phone)
      );
      if (matched && matched.status !== 'Inactive') {
        const updatedSession: UserSession = {
          ...currentUser,
          name: matched.name,
          phone: cleanPhone(matched.phone),
        };
        setCurrentUser(updatedSession);
        try {
          sessionStorage.setItem('adarsh_session', JSON.stringify(updatedSession));
        } catch {}
      }
    }

    if (auditDescription) {
      logAuditAction('staff_edit', 'Staff Access', auditDescription, undefined, targetName, auditDetails);
    }

    try {
      await supabase.from('site_settings').upsert(
        [
          {
            key: 'owner_accounts',
            value: nextOwners,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'key' }
      );
    } catch (err) {
      console.warn('Owner accounts sync notice:', err);
    }
  };
  useEffect(() => {
    try { localStorage.setItem('adarsh_settings', JSON.stringify(settings)); } catch {}
    broadcastLiveSync('settings', settings);

    if (skipNextSettingsAutoSyncRef.current) {
      skipNextSettingsAutoSyncRef.current = false;
      return;
    }

    setCmsAutoSyncState('syncing');
    const timer = window.setTimeout(async () => {
      lastLocalSettingsSyncAtRef.current = Date.now();
      const { ok } = await syncSectionVisibilityToSupabase(supabase, settings);
      setCmsAutoSyncState(ok ? 'synced' : 'error');
    }, 650);

    return () => window.clearTimeout(timer);
  }, [settings]);

  // Two-way Realtime Listener: Pull site_settings updates from Public Website automatically
  useEffect(() => {
    let debounceTimer: number | null = null;
    const pullLatestSettings = async () => {
      if (Date.now() - lastLocalSettingsSyncAtRef.current < 2200) return;
      try {
        const { data, error } = await supabase.from('site_settings').select('*');
        if (error || !Array.isArray(data) || data.length === 0) return;
        skipNextSettingsAutoSyncRef.current = true;
        setSettings((prev) => {
          const next = hydrateSettingsFromRows(data, prev);
          try {
            localStorage.setItem('adarsh_settings', JSON.stringify(next));
          } catch {}
          return next;
        });
      } catch {}
    };

    const channel = supabase
      .channel('admin_site_settings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        if (Date.now() - lastLocalSettingsSyncAtRef.current < 2200) return;
        if (debounceTimer) window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(pullLatestSettings, 350);
      })
      .subscribe();

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, []);
  useEffect(() => {
    try { localStorage.setItem('adarsh_audit_logs', JSON.stringify(auditLogs)); } catch {}
  }, [auditLogs]);

  // Live Sync listener for newly submitted customer storefront leads (same tab or cross-tab)
  useEffect(() => {
    const applyIncomingLead = (payload: any) => {
      if (!payload) return;
      const normalized = mergeLeadDefaults(payload);
      setLeads(prev => {
        const exists = prev.some(item => String(item.id) === String(normalized.id));
        if (exists) {
          return prev.map(item => String(item.id) === String(normalized.id) ? normalized : item);
        }
        return [normalized, ...prev];
      });
    };

    const onCustomSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.type === 'leads') {
        applyIncomingLead(detail.payload);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('adarsh_live_sync');
        channel.onmessage = (ev) => {
          if (ev?.data?.type === 'leads') {
            applyIncomingLead(ev.data.payload);
          }
        };
      }
    } catch {}

    window.addEventListener('adarsh:live-sync', onCustomSync);
    return () => {
      window.removeEventListener('adarsh:live-sync', onCustomSync);
      try { channel?.close(); } catch {}
    };
  }, []);

  // Strict Access Guard: If current activeTab is not permitted for the user, auto-redirect to first permitted module
  useEffect(() => {
    if (currentUser && !hasAccess(activeTab)) {
      const nextAllowed = getFirstAllowedTab(currentUser);
      if (nextAllowed && nextAllowed !== activeTab) {
        setActiveTabRaw(nextAllowed as any);
        setNavigationHistory([nextAllowed]);
      }
    }
  }, [currentUser, activeTab]);

  const [isSyncingLive, setIsSyncingLive] = useState(false);

  // Full Two-Way Sync from Supabase across all modules (each module applies immediately on completion)
  const syncAllFromSupabase = async (showNotice = false) => {
    if (showNotice) setIsSyncingLive(true);
    const errors: string[] = [];
    let bikeCount = 0;
    let leadCount = 0;
    let invCount = 0;
    let brCount = 0;

    try {
      const bikesPromise = fetchAllBikesSafe(supabase, {
        excludeAccessories: true,
        includeGalleries: true,
        onProgress: (rows) => {
          setBikes(
            rows
              .filter((b) => !isAccessoryItem(b))
              .map((b) => ({
                ...mergeBikeDefaults(b),
                category: canonicalizeBikeCategory(b?.category),
              }))
          );
        }
      }).then((bRes) => {
        if (bRes.error) errors.push(`bikes: ${bRes.error.message}`);
        else if (Array.isArray(bRes.data)) {
          const cleanedBikes = bRes.data
            .filter((b) => !isAccessoryItem(b))
            .map((b) => ({
              ...mergeBikeDefaults(b),
              category: canonicalizeBikeCategory(b?.category),
            }));
          setBikes(cleanedBikes);
          bikeCount = cleanedBikes.length;
          purgeAccessoriesFromBikesTable(supabase);
          normalizeExistingBikeCategoriesInSupabase(supabase, bRes.data);
        }
      });

      const leadsPromise = (async () => {
        const lRes = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
        if (lRes.error) errors.push(`leads: ${lRes.error.message}`);
        else if (Array.isArray(lRes.data)) {
          setLeads(lRes.data.map(mergeLeadDefaults));
          leadCount = lRes.data.length;
        }
      })();

      const invoicesPromise = (async () => {
        const iRes = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });
        if (iRes.error) errors.push(`invoices: ${iRes.error.message}`);
        else if (Array.isArray(iRes.data)) {
          setInvoices(iRes.data.map(mergeInvoiceDefaults));
          invCount = iRes.data.length;
        }
      })();

      const branchesPromise = (async () => {
        const brRes = await supabase
          .from('branches')
          .select('*')
          .order('created_at', { ascending: false });
        if (brRes.error) errors.push(`branches: ${brRes.error.message}`);
        else if (Array.isArray(brRes.data)) {
          setBranches(brRes.data.map(mergeBranchDefaults));
          brCount = brRes.data.length;
        }
      })();

      const staffPromise = (async () => {
        const stRes = await supabase.from('staff_users').select('*');
        if (stRes.error) errors.push(`staff: ${stRes.error.message}`);
        else if (stRes.data && stRes.data.length > 0) {
          const staffOnly = dedupeStaffByPhone(
            (stRes.data as StaffItem[]).filter(
              (row) => String(row.role || '').toLowerCase() !== 'owner'
            )
          );
          if (staffOnly.length > 0) {
            setStaff(staffOnly);
            if (currentUser?.role === 'staff') {
              const liveWorker = staffOnly.find(
                (s) => normalizePhone10(s.phone) === normalizePhone10(currentUser.phone)
              );
              if (liveWorker) {
                if (String(liveWorker.status || 'Active') === 'Inactive') {
                  setCurrentUser(null);
                  try { sessionStorage.removeItem('adarsh_session'); } catch {}
                  showToast('Your access was deactivated by the Owner.');
                } else {
                  const livePerms = Array.isArray(liveWorker.permissions) ? liveWorker.permissions : [];
                  const samePerms =
                    JSON.stringify([...livePerms].sort()) ===
                    JSON.stringify([...(currentUser.permissions || [])].sort());
                  if (!samePerms || liveWorker.name !== currentUser.name) {
                    const syncedSession: UserSession = {
                      ...currentUser,
                      name: liveWorker.name,
                      permissions: livePerms,
                    };
                    setCurrentUser(syncedSession);
                    try { sessionStorage.setItem('adarsh_session', JSON.stringify(syncedSession)); } catch {}
                  }
                }
              }
            }
          }
        }
      })();

      const settingsPromise = (async () => {
        const setRes = await supabase.from('site_settings').select('*');
        if (setRes.error) errors.push(`settings: ${setRes.error.message}`);
        else if (setRes.data && setRes.data.length > 0) {
          const ownerRow = (setRes.data as any[]).find((r) => r?.key === 'owner_accounts');
          if (ownerRow?.value) {
            const parsedOwners =
              typeof ownerRow.value === 'string'
                ? JSON.parse(ownerRow.value)
                : ownerRow.value;
            if (Array.isArray(parsedOwners) && parsedOwners.length > 0) {
              setOwnerAccounts(parsedOwners);
            }
          }
          skipNextSettingsAutoSyncRef.current = true;
          setSettings(prev => {
            const next = hydrateSettingsFromRows(setRes.data as any[], prev);
            try {
              localStorage.setItem('adarsh_settings', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      })();

      await Promise.all([
        settingsPromise,
        leadsPromise,
        invoicesPromise,
        branchesPromise,
        staffPromise,
        bikesPromise,
      ]);

      if (showNotice) {
        if (errors.length > 0) {
          showToast(`Partial sync warning: ${errors[0]}`);
        } else {
          showToast(`Synced live: ${bikeCount} vehicles, ${leadCount} leads, ${invCount} bills, ${brCount} showrooms`);
        }
      }
    } catch (err: any) {
      console.warn("Supabase query sync notice", err);
      if (showNotice) {
        showToast(`Sync failed: ${err?.message || 'Unable to connect to Supabase'}`);
      }
    } finally {
      if (showNotice) setIsSyncingLive(false);
    }
  };

  // Shared 1-Tap Public Website Section ON/OFF Controller for any Admin Tab
  const handleToggleWebsiteSection = async (
    key: WebsiteSectionKey,
    customLabel?: string,
    explicitValue?: boolean
  ) => {
    const currentValue = Boolean(settings[key]);
    const nextValue = explicitValue !== undefined ? explicitValue : !currentValue;
    const label = customLabel || SECTION_SETTING_KEY_MAP[key]?.label || key;

    const nextSettings: SiteSettings = {
      ...settings,
      [key]: nextValue
    };

    setSettings(nextSettings);

    logAuditAction(
      'settings_edit',
      'CMS Settings',
      `${currentUser?.name || 'Admin'} turned public website section "${label}" ${nextValue ? 'ON (Visible)' : 'OFF (Hidden)'}`,
      key,
      label,
      { field: key, before: currentValue, after: nextValue }
    );

    lastLocalSettingsSyncAtRef.current = Date.now();
    const { ok, errorMessage } = await syncSectionVisibilityToSupabase(
      supabase,
      nextSettings,
      key,
      nextValue
    );

    if (ok) {
      showToast(`${label} is now ${nextValue ? 'PUBLIC ON · VISIBLE' : 'PUBLIC OFF · HIDDEN'} on customer website!`);
    } else {
      showToast(`Saved locally — Supabase sync error: ${errorMessage}`);
    }
  };

  // Background Supabase Sync on Mount
  useEffect(() => {
    syncAllFromSupabase(false);
  }, []);

  // Ensure fresh site_settings whenever entering CMS Settings / Hero Slider Studio
  useEffect(() => {
    if (activeTab !== 'settings') return;
    if (Date.now() - lastLocalSettingsSyncAtRef.current < 2200) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (!active || error || !Array.isArray(data) || data.length === 0) return;
      if (Date.now() - lastLocalSettingsSyncAtRef.current < 2200) return;
      skipNextSettingsAutoSyncRef.current = true;
      setSettings((prev) => {
        const next = hydrateSettingsFromRows(data, prev);
        try {
          localStorage.setItem('adarsh_settings', JSON.stringify(next));
        } catch {}
        return next;
      });
    })();
    return () => {
      active = false;
    };
  }, [activeTab, cmsActiveSubTab]);

  // Global Background Scroll Lock whenever ANY modal, video popup, or drawer (.fixed.inset-0) is open
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let isLocked = false;
    let savedScrollY = 0;

    const applyLockState = () => {
      const hasOpenOverlay = Boolean(document.querySelector('.fixed.inset-0'));

      if (hasOpenOverlay && !isLocked) {
        savedScrollY = window.scrollY || window.pageYOffset || 0;
        isLocked = true;
        document.documentElement.classList.add('modal-scroll-locked');
        document.body.classList.add('modal-scroll-locked');
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
      } else if (!hasOpenOverlay && isLocked) {
        isLocked = false;
        document.documentElement.classList.remove('modal-scroll-locked');
        document.body.classList.remove('modal-scroll-locked');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, savedScrollY);
      }
    };

    applyLockState();
    const rootEl = document.getElementById('root') || document.body;
    const observer = new MutationObserver(() => applyLockState());
    observer.observe(rootEl, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (isLocked) {
        document.documentElement.classList.remove('modal-scroll-locked');
        document.body.classList.remove('modal-scroll-locked');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, savedScrollY);
      }
    };
  }, []);

  // Format INR Currency (Bulletproof for numbers, strings, and existing currency values)
  const formatINR = (val: any) => {
    if (val === null || val === undefined || val === '') return '₹0';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('₹')) {
        // If it already has rupee symbol and valid digits, return as-is
        if (/\d/.test(trimmed)) return trimmed;
      }
      const digits = trimmed.replace(/[^\d.]/g, '');
      const parsed = parseFloat(digits);
      if (!isNaN(parsed)) return '₹' + Math.round(parsed).toLocaleString('en-IN');
      return '₹0';
    }
    const num = Number(val);
    if (isNaN(num)) return '₹0';
    return '₹' + Math.round(num).toLocaleString('en-IN');
  };

  // Clean phone helper (bulletproof against null/undefined)
  const cleanPhone = (p: any) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

  // Step 1: Validate Phone belongs to Owner or Owner-added Worker & Send OTP via Operator
  const handleSendAdminOtp = async (inputPhone: string) => {
    const rawP = cleanPhone(inputPhone);
    if (rawP.length !== 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingAdminOtp(true);
    setLoginError('');

    let targetAccount: {
      id?: number;
      name: string;
      phone: string;
      role: 'owner' | 'staff';
      permissions: string[];
    } | null = null;

    // 1. Check registered Owner & Family Co-Owner accounts (including updated primary owner phone)
    const matchedOwnerLocal = ownerAccounts.find(
      (o) => cleanPhone(o.phone) === rawP && String(o.status || 'Active') !== 'Inactive'
    );

    if (matchedOwnerLocal) {
      targetAccount = {
        name: matchedOwnerLocal.name,
        phone: cleanPhone(matchedOwnerLocal.phone),
        role: 'owner',
        permissions: ['all'],
      };
    } else if (rawP === OWNER_PHONE && ownerAccounts.every((o) => !o.isPrimary || cleanPhone(o.phone) === OWNER_PHONE)) {
      targetAccount = {
        name: 'Pavan Kumar',
        phone: OWNER_PHONE,
        role: 'owner',
        permissions: ['all'],
      };
    } else {
      // Check live Supabase owner_accounts setting + staff_users so newly added owners/workers work immediately
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 1800)
        );
        const ownerSettingRes: any = await Promise.race([
          supabase.from('site_settings').select('value').eq('key', 'owner_accounts').maybeSingle(),
          timeoutPromise,
        ]);
        if (ownerSettingRes?.data?.value) {
          const dbOwners =
            typeof ownerSettingRes.data.value === 'string'
              ? JSON.parse(ownerSettingRes.data.value)
              : ownerSettingRes.data.value;
          if (Array.isArray(dbOwners)) {
            const dbOwnerMatch = dbOwners.find(
              (o: any) => cleanPhone(o?.phone) === rawP && String(o?.status || 'Active') !== 'Inactive'
            );
            if (dbOwnerMatch) {
              targetAccount = {
                name: dbOwnerMatch.name,
                phone: cleanPhone(dbOwnerMatch.phone),
                role: 'owner',
                permissions: ['all'],
              };
            }
          }
        }
      } catch {}

      if (!targetAccount) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 1800)
          );
          const supabaseQuery = supabase
            .from('staff_users')
            .select('*');
          const res: any = await Promise.race([supabaseQuery, timeoutPromise]);
          const matchedStaffRow = Array.isArray(res?.data)
            ? dedupeStaffByPhone(res.data as StaffItem[]).find(
                (r) => normalizePhone10(r.phone) === rawP && String(r.status || 'Active') !== 'Inactive'
              )
            : null;
          if (matchedStaffRow) {
            const perms = Array.isArray(matchedStaffRow.permissions)
              ? matchedStaffRow.permissions
              : JSON.parse((matchedStaffRow.permissions as any) || '[]');
            const resolvedRole = matchedStaffRow.role === 'owner' ? 'owner' : 'staff';
            targetAccount = {
              id: matchedStaffRow.id,
              name: matchedStaffRow.name,
              phone: cleanPhone(matchedStaffRow.phone),
              role: resolvedRole,
              permissions: resolvedRole === 'owner' ? ['all'] : perms,
            };
          }
        } catch {}
      }

      // Local staff list fallback (covers newly added workers even offline)
      if (!targetAccount) {
        const localWorker = staff.find(
          (s) => cleanPhone(s.phone) === rawP && String(s.status || 'Active') !== 'Inactive'
        );
        if (localWorker) {
          targetAccount = {
            id: localWorker.id,
            name: localWorker.name,
            phone: cleanPhone(localWorker.phone),
            role: localWorker.role === 'owner' ? 'owner' : 'staff',
            permissions: localWorker.permissions || [],
          };
        }
      }
    }

    if (!targetAccount) {
      setIsSendingAdminOtp(false);
      setLoginError(
        `Phone +91 ${rawP} is not registered. Ask the Owner to add your number in Workers / Staff Access.`
      );
      return;
    }

    const sendRes = await sendPhoneOtp({
      phone: rawP,
      context: 'admin',
      supabase,
      recipientName: targetAccount.name,
      operatorConfig: otpOperatorConfig,
    });

    setIsSendingAdminOtp(false);

    if (!sendRes.ok) {
      setLoginError(sendRes.error || sendRes.message);
      return;
    }

    setResolvedAuthTarget(targetAccount);
    setAdminOtpStep('otp');
    setAdminOtpCode('');
    setAdminOtpNotice(sendRes.message);
    setAdminOtpDemoCode(sendRes.demoCode || '');
    setAdminOtpCooldown(30);
    showToast(`OTP dispatched to +91 ${rawP} (${targetAccount.name})`);
  };

  // Step 2: Verify OTP & Authenticate Session
  const handleVerifyAdminOtp = async (inputPhone: string, inputOtp: string) => {
    const rawP = cleanPhone(inputPhone);
    const otp = inputOtp.trim();

    if (!rawP || otp.length < 4) {
      setLoginError('Enter the 6-digit OTP sent to your phone.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    const verifyRes = await verifyPhoneOtp({
      phone: rawP,
      otp,
      context: 'admin',
      supabase,
      operatorConfig: otpOperatorConfig,
    });

    if (!verifyRes.ok) {
      setLoginError(verifyRes.message);
      setIsLoggingIn(false);
      return;
    }

    let account = resolvedAuthTarget;
    if (!account || cleanPhone(account.phone) !== verifyRes.phone10) {
      const matchedOwner = ownerAccounts.find(
        (o) => cleanPhone(o.phone) === verifyRes.phone10 && String(o.status || 'Active') !== 'Inactive'
      );
      if (matchedOwner) {
        account = {
          name: matchedOwner.name,
          phone: cleanPhone(matchedOwner.phone),
          role: 'owner',
          permissions: ['all'],
        };
      } else if (verifyRes.phone10 === OWNER_PHONE) {
        account = { name: 'Pavan Kumar', phone: OWNER_PHONE, role: 'owner', permissions: ['all'] };
      } else {
        const localWorker = staff.find((s) => cleanPhone(s.phone) === verifyRes.phone10);
        if (localWorker) {
          account = {
            id: localWorker.id,
            name: localWorker.name,
            phone: cleanPhone(localWorker.phone),
            role: localWorker.role === 'owner' ? 'owner' : 'staff',
            permissions: localWorker.permissions || [],
          };
        }
      }
    }

    if (!account) {
      setLoginError('Authorized account not found for this phone number.');
      setIsLoggingIn(false);
      return;
    }

    if (account.role === 'owner') {
      const ownerSession: UserSession = {
        name: account.name,
        phone: account.phone,
        role: 'owner',
        permissions: ['all'],
      };
      setCurrentUser(ownerSession);
      try {
        sessionStorage.setItem('adarsh_session', JSON.stringify(ownerSession));
      } catch {}
      setActiveTab('overview');
      logAuditAction(
        'login',
        'Auth',
        `Owner ${account.name} verified via Phone OTP (${window.innerWidth < 768 ? 'Mobile Phone' : 'Desktop'})`,
        undefined,
        `${account.name} (Owner)`,
        { notes: `OTP verified for +91 ${account.phone}` }
      );
      showToast('OTP Verified — Authenticated as Owner / Super Admin');
    } else {
      const staffSession: UserSession = {
        name: account.name,
        phone: account.phone,
        role: 'staff',
        permissions: account.permissions || [],
      };
      setCurrentUser(staffSession);
      try {
        sessionStorage.setItem('adarsh_session', JSON.stringify(staffSession));
      } catch {}

      const allowed = Array.isArray(account.permissions) ? account.permissions : [];
      const landingTab = getFirstAllowedTab(staffSession);
      if (landingTab) {
        setActiveTabRaw(landingTab as any);
        setNavigationHistory([landingTab]);
      }

      logAuditAction(
        'login',
        'Auth',
        `Worker ${account.name} signed in via Phone OTP (${window.innerWidth < 768 ? 'Mobile Phone' : 'Desktop'})`,
        account.id,
        `${account.name} (+91 ${account.phone})`,
        { notes: `OTP verified · Granted modules: ${allowed.join(', ') || 'None'}` }
      );
      showToast(`OTP Verified — Welcome back, ${account.name}!`);
    }

    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    if (currentUser) {
      logAuditAction(
        'login',
        'Auth',
        `${currentUser.name} (${currentUser.role === 'owner' ? 'Owner' : 'Staff'}) logged out from admin portal`,
        undefined,
        currentUser.name,
        { notes: 'Session ended by user' }
      );
    }
    setCurrentUser(null);
    try { sessionStorage.removeItem('adarsh_session'); } catch {}
    setLoginPhone('');
    setAdminOtpStep('phone');
    setAdminOtpCode('');
    setAdminOtpNotice('');
    setAdminOtpDemoCode('');
    setResolvedAuthTarget(null);
    showToast('Signed out successfully.');
  };

  // Permission Checker - Strict Section-Only Enforcement (Zero Cross-Section Leakage)
  const hasAccess = (module: string) => hasUserAccess(currentUser, module);

  // Overview metrics
  const activeBikesCount = useMemo(() => bikes.filter(b => b.status === 'Available').length, [bikes]);
  const totalRevenue = useMemo(() => invoices.reduce((acc, curr) => acc + Number(curr.price || 0), 0), [invoices]);
  const newLeadsCount = useMemo(() => leads.filter(l => l.status === 'New').length, [leads]);

  // Dedicated Lead-Capturing Desk Slices (Exchange/Sell, Loan/Finance, Service/Workshop)
  const exchangeLeads = useMemo(
    () => leads.filter(l => matchesSpecializedLeadCategory(l, 'exchange_leads')),
    [leads]
  );
  const loanLeads = useMemo(
    () => leads.filter(l => matchesSpecializedLeadCategory(l, 'loan_leads')),
    [leads]
  );
  const serviceLeads = useMemo(
    () => leads.filter(l => matchesSpecializedLeadCategory(l, 'service_leads')),
    [leads]
  );
  const accessoriesLeads = useMemo(
    () => leads.filter(l => matchesSpecializedLeadCategory(l, 'accessories_leads')),
    [leads]
  );
  const newExchangeLeadsCount = useMemo(
    () => exchangeLeads.filter(l => String(l.status || '').toLowerCase() === 'new').length,
    [exchangeLeads]
  );
  const newLoanLeadsCount = useMemo(
    () => loanLeads.filter(l => String(l.status || '').toLowerCase() === 'new').length,
    [loanLeads]
  );
  const newServiceLeadsCount = useMemo(
    () => serviceLeads.filter(l => String(l.status || '').toLowerCase() === 'new').length,
    [serviceLeads]
  );
  const newAccessoriesLeadsCount = useMemo(
    () => accessoriesLeads.filter(l => String(l.status || '').toLowerCase() === 'new').length,
    [accessoriesLeads]
  );

  // Split Inventory Segments: Superbikes & Luxury vs Budget Bikes & Commuters (strictly exclude Accessories)
  const superbikeBikes = useMemo(
    () =>
      bikes.filter(
        (b) =>
          b &&
          !isAccessoryItem(b) &&
          !isBudgetVehicleCategory(b.category, b.price, b.name)
      ),
    [bikes]
  );

  const budgetBikes = useMemo(
    () =>
      bikes.filter(
        (b) =>
          b &&
          !isAccessoryItem(b) &&
          isBudgetVehicleCategory(b.category, b.price, b.name)
      ),
    [bikes]
  );

  // Leads Filtering
  const filteredLeads = useMemo(() => {
    const q = (leadsSearch || '').toLowerCase().trim();
    return leads.filter(l => {
      if (!l) return false;
      const cName = String(l.customer_name || l.name || '').toLowerCase();
      const phone = String(l.phone || '');
      const bInt = String(l.bike_interested || l.bike_model || '').toLowerCase();
      const matchesSearch = !q || cName.includes(q) || phone.includes(q) || bInt.includes(q);
      const lStatusClean = String(leadsStatusFilter || '').trim();
      const lStatusLower = lStatusClean.toLowerCase();
      const matchesStatus =
        !lStatusClean ||
        lStatusClean === 'ALL' ||
        l.status === lStatusClean ||
        (lStatusClean === 'New' && (l.status === 'New' || (l as any).status === 'New Lead')) ||
        String(l.status || '').toLowerCase().includes(lStatusLower);
      return matchesSearch && matchesStatus;
    });
  }, [leads, leadsSearch, leadsStatusFilter]);

  // Invoices Filtering (Bulletproof for billing views)
  const filteredInvoices = useMemo(() => {
    const q = (billingSearch || '').toLowerCase().trim();
    return invoices.filter(inv => {
      if (!inv) return false;
      if (!q) return true;
      const cName = String(inv.customer_name || '').toLowerCase();
      const mob = String(inv.mobile || '');
      const veh = String(inv.vehicle || '').toLowerCase();
      const reg = String(inv.reg_number || '').toLowerCase();
      const invNum = String(inv.invoice_number || '').toLowerCase();
      return cName.includes(q) || mob.includes(q) || veh.includes(q) || reg.includes(q) || invNum.includes(q);
    });
  }, [invoices, billingSearch]);

  // Audit Logs Filtering
  const filteredAuditLogs = useMemo(() => {
    const q = (auditSearch || '').toLowerCase().trim();
    return auditLogs.filter(log => {
      if (!log) return false;
      const sName = String(log.staff_name || '').toLowerCase();
      const sPhone = String(log.staff_phone || '');
      const desc = String(log.description || '').toLowerCase();
      const mod = String(log.module || '').toLowerCase();
      const tName = String(log.target_name || '').toLowerCase();
      const notes = String(log.details?.notes || '').toLowerCase();

      const matchesSearch = !q ||
        sName.includes(q) ||
        sPhone.includes(q) ||
        desc.includes(q) ||
        mod.includes(q) ||
        tName.includes(q) ||
        notes.includes(q);
      const staffFilterClean = String(auditStaffFilter || '').trim();
      const modFilterClean = String(auditModuleFilter || '').trim();
      const matchesStaff = !staffFilterClean || staffFilterClean === 'ALL' || sName.includes(staffFilterClean.toLowerCase());
      const matchesModule = !modFilterClean || modFilterClean === 'ALL' || log.module === modFilterClean || mod.includes(modFilterClean.toLowerCase());
      const matchesRole =
        auditRoleFilter === 'ALL' ||
        (auditRoleFilter === 'owner' && log.role === 'owner') ||
        (auditRoleFilter === 'staff' && log.role !== 'owner');
      return matchesSearch && matchesStaff && matchesModule && matchesRole;
    });
  }, [auditLogs, auditSearch, auditStaffFilter, auditModuleFilter, auditRoleFilter]);

  // Profit & Loss (P&L) Filtering & Metrics
  const filteredPnlBikes = useMemo(() => {
    const q = pnlSearch.toLowerCase().trim();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return bikes.filter(b => {
      // 1. Search Query
      if (q) {
        const matchesName = (b.name || '').toLowerCase().includes(q);
        const matchesBrand = (b.brand || '').toLowerCase().includes(q);
        const matchesCategory = (b.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesCategory) return false;
      }

      // 2. Status Filter
      if (pnlStatusFilter !== 'ALL' && pnlStatusFilter !== 'all') {
        const sLower = pnlStatusFilter.toLowerCase();
        if (sLower === 'available' && b.status !== 'Available') return false;
        if (sLower === 'sold' && b.status !== 'Sold') return false;
        if (sLower === 'booked' && b.status !== 'Booked') return false;
      }

      // 3. Date Filter
      const rawDate = (b.procurement_date || b.created_at?.slice(0, 10) || '2026-10-15').slice(0, 10);
      const itemDate = new Date(rawDate);

      if (pnlDateFilter === 'today') {
        if (rawDate !== todayStr) return false;
      } else if (pnlDateFilter === 'week') {
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (pnlDateFilter === 'month') {
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 30) return false;
      } else if (pnlDateFilter === 'quarter') {
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 90) return false;
      } else if (pnlDateFilter === 'fy' || pnlDateFilter === 'year') {
        const yr = now.getFullYear();
        const startFY = new Date(now.getMonth() >= 3 ? yr : yr - 1, 3, 1);
        if (itemDate < startFY) return false;
      } else if (pnlDateFilter === 'custom') {
        if (pnlCustomStart && rawDate < pnlCustomStart) return false;
        if (pnlCustomEnd && rawDate > pnlCustomEnd) return false;
      }

      // 4. Margin Band Filter
      const purchase = Number(b.purchase_cost ?? Math.round((Number(b.price) || 100000) * 0.81));
      const repairs = Number(b.repair_cost ?? 30000);
      const landed = purchase + repairs;
      const asking = Number(b.price || 0);
      const profit = asking - landed;
      const roi = landed > 0 ? (profit / landed) * 100 : 0;

      const bandLower = String(pnlMarginBandFilter || '').trim().toLowerCase();
      if ((pnlMarginBandFilter === 'HIGH' || bandLower === 'high') && roi < 20) return false;
      if ((pnlMarginBandFilter === 'NORMAL' || bandLower === 'normal') && (roi < 10 || roi >= 20)) return false;
      if ((pnlMarginBandFilter === 'LOW' || bandLower === 'thin') && (roi < 0 || roi >= 10)) return false;
      if ((pnlMarginBandFilter === 'LOSS' || bandLower === 'loss') && roi >= 0) return false;
      if (bandLower && bandLower !== 'all' && !['high', 'normal', 'thin', 'low', 'loss'].includes(bandLower)) {
        const numericThreshold = parseFloat(bandLower);
        if (!isNaN(numericThreshold) && roi < numericThreshold) return false;
      }

      return true;
    });
  }, [bikes, pnlSearch, pnlStatusFilter, pnlDateFilter, pnlCustomStart, pnlCustomEnd, pnlMarginBandFilter]);

  // Aggregated P&L Ledger Totals
  const pnlTotals = useMemo(() => {
    let totalPurchase = 0;
    let totalRepairs = 0;
    let totalInvested = 0;
    let totalAsking = 0;
    let targetProfit = 0;

    let realizedRevenue = 0;
    let realizedCogs = 0;
    let realizedRepairs = 0;
    let realizedCount = 0;

    let pipelineCapital = 0;
    let pipelineAsking = 0;
    let pipelineCount = 0;

    let highMarginCount = 0;
    let normalMarginCount = 0;
    let thinMarginCount = 0;
    let lossCount = 0;

    const highMarginBikes: BikeItem[] = [];
    const lowMarginBikes: BikeItem[] = [];

    bikes.forEach(b => {
      const purchase = Number(b.purchase_cost ?? Math.round((Number(b.price) || 100000) * 0.81));
      const repairs = Number(b.repair_cost ?? 30000);
      const landed = purchase + repairs;
      const asking = Number(b.price || 0);
      const profit = asking - landed;
      const marginPct = landed > 0 ? (profit / landed) * 100 : 0;

      if (profit < 0) {
        lossCount++;
      } else if (marginPct >= 20) {
        highMarginCount++;
        highMarginBikes.push(b);
      } else if (marginPct >= 10) {
        normalMarginCount++;
      } else {
        thinMarginCount++;
        lowMarginBikes.push(b);
      }

      if (b.status === 'Sold') {
        realizedRevenue += asking;
        realizedCogs += purchase;
        realizedRepairs += repairs;
        realizedCount++;
      } else {
        pipelineCapital += landed;
        pipelineAsking += asking;
        pipelineCount++;
      }
    });

    filteredPnlBikes.forEach(b => {
      const purchase = Number(b.purchase_cost ?? Math.round((Number(b.price) || 100000) * 0.81));
      const repairs = Number(b.repair_cost ?? 30000);
      const landed = purchase + repairs;
      const asking = Number(b.price || 0);
      const profit = asking - landed;

      totalPurchase += purchase;
      totalRepairs += repairs;
      totalInvested += landed;
      totalAsking += asking;
      targetProfit += profit;
    });

    const realizedGrossProfit = realizedRevenue - realizedCogs;
    const realizedOverheads = Math.round(realizedRevenue * 0.02);
    const netRealizedProfit = realizedGrossProfit - realizedRepairs - realizedOverheads;
    const netRealizedMarginPct = realizedRevenue > 0 ? ((netRealizedProfit / realizedRevenue) * 100).toFixed(1) : '0';

    const pipelineProfit = pipelineAsking - pipelineCapital;
    const pipelineRoiPct = pipelineCapital > 0 ? ((pipelineProfit / pipelineCapital) * 100).toFixed(1) : '0';
    const averageMarginRoi = totalInvested > 0 ? ((targetProfit / totalInvested) * 100).toFixed(1) : '0';

    return {
      totalPurchase,
      totalRepairs,
      totalRepair: totalRepairs,
      totalInvested,
      totalLanded: totalInvested,
      totalAsking,
      targetProfit,
      totalProfit: targetProfit,
      realizedRevenue,
      realizedCogs,
      realizedRepairs,
      realizedGrossProfit,
      realizedOverheads,
      netRealizedProfit,
      realizedProfit: netRealizedProfit,
      netRealizedMarginPct,
      realizedCount,
      soldCount: realizedCount,
      pipelineCapital,
      pipelineAsking,
      pipelineProfit,
      pipelineRoiPct,
      pipelineCount,
      availableCount: pipelineCount,
      averageMarginRoi,
      avgMarginPercent: Number(averageMarginRoi) || 0,
      highMarginBikes,
      lowMarginBikes,
      highMarginCount,
      normalMarginCount,
      thinMarginCount,
      lossCount
    };
  }, [bikes, filteredPnlBikes]);

  // Recharts Dataset for Bar Chart & Breakdown
  const pnlRechartsData = useMemo(() => {
    return filteredPnlBikes.map(b => {
      const purchase = Number(b.purchase_cost ?? Math.round((Number(b.price) || 100000) * 0.81));
      const repairs = Number(b.repair_cost ?? 30000);
      const landed = purchase + repairs;
      const asking = Number(b.price || 0);
      const profit = asking - landed;
      const roi = landed > 0 ? Number(((profit / landed) * 100).toFixed(1)) : 0;
      const shortName = b.name.length > 14 ? b.name.slice(0, 13) + '…' : b.name;

      return {
        id: b.id,
        name: shortName,
        fullName: b.name,
        purchase,
        repairs,
        landed,
        asking,
        profit,
        roi,
        status: b.status,
        landedLakhs: Number((landed / 100000).toFixed(2)),
        askingLakhs: Number((asking / 100000).toFixed(2)),
        profitLakhs: Number((profit / 100000).toFixed(2)),
        isLoss: profit < 0,
        isHigh: roi >= 20
      };
    });
  }, [filteredPnlBikes]);

  // Composition Pie Data for Fleet Outlay
  const pnlPieData = useMemo(() => {
    const { totalPurchase, totalRepairs, totalAsking, targetProfit } = pnlTotals;
    const overheads = Math.round(totalAsking * 0.02);
    return [
      { name: 'Vehicle Purchase Cost', value: Math.max(1, totalPurchase), color: '#64748B' },
      { name: 'Workshop Repairs & Parts', value: Math.max(1, totalRepairs), color: '#06B6D4' },
      { name: 'Dealership Overheads', value: Math.max(1, overheads), color: '#F59E0B' },
      { name: 'Net Target Profit', value: Math.max(1, Math.max(0, targetProfit)), color: '#10B981' }
    ];
  }, [pnlTotals]);

  // Export P&L Ledger to CSV
  const exportPnlCsv = () => {
    const headers = [
      "Vehicle ID",
      "Vehicle Name",
      "Brand",
      "Category",
      "Inward Date",
      "Purchase Cost (INR)",
      "Repairs & Refurbishment (INR)",
      "Total Landed Investment (INR)",
      "Showroom Asking/Sale Price (INR)",
      "Net Margin Profit/Loss (INR)",
      "ROI Margin %",
      "Accounting Status",
      "Repairs Note"
    ];

    const rows = filteredPnlBikes.map(b => {
      const purchase = Number(b.purchase_cost ?? Math.round((Number(b.price) || 100000) * 0.81));
      const repairs = Number(b.repair_cost ?? 30000);
      const landed = purchase + repairs;
      const asking = Number(b.price || 0);
      const profit = asking - landed;
      const roi = landed > 0 ? ((profit / landed) * 100).toFixed(1) : '0';

      return [
        b.id,
        `"${(b.name || '').replace(/"/g, '""')}"`,
        `"${(b.brand || '').replace(/"/g, '""')}"`,
        `"${(b.category || '').replace(/"/g, '""')}"`,
        b.procurement_date || '2026-10-15',
        purchase,
        repairs,
        landed,
        asking,
        profit,
        `${roi}%`,
        b.status,
        `"${(b.repairs_note || '').replace(/"/g, '""')}"`
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Adarsh_Motors_Dealership_PnL_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Dealership P&L report exported to CSV!");
  };

  // Quick Realize Profit: Mark Bike as Sold
  const handleQuickMarkSold = async (bikeOrId: BikeItem | number | string) => {
    const bikeId = typeof bikeOrId === 'object' ? bikeOrId.id : bikeOrId;
    const b = bikes.find(item => String(item.id) === String(bikeId));
    if (!b) return;
    const nextStatus = b.status === 'Sold' ? 'Available' : 'Sold';
    setConfirmDialog({
      title: `Update ${b.name} Status?`,
      message: `Confirm updating "${b.name}" status from "${b.status}" to "${nextStatus}" in both the Admin P&L ledger and live customer showroom?`,
      confirmLabel: `Mark as ${nextStatus}`,
      tone: nextStatus === 'Sold' ? 'danger' : 'emerald',
      onConfirm: async () => {
        const prevStatus = b.status;
        const updated: BikeItem = { ...b, status: nextStatus };
        setBikes(prev => prev.map(item => String(item.id) === String(bikeId) ? updated : item));

        logAuditAction(
          'inventory_edit',
          'Inventory',
          `Owner marked ${b.name} as ${nextStatus}`,
          b.id,
          b.name,
          { field: 'status', before: prevStatus, after: nextStatus, notes: 'P&L sales realization action' }
        );

        await syncBikeStatusToSupabase(b, nextStatus, `Marked ${b.name} as ${nextStatus} in Supabase!`);
      }
    });
  };

  // Custom Recharts Tooltip Component
  const PnlCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-lg text-xs sm:text-sm font-sans min-w-[240px]">
          <div className="font-bold text-slate-900 text-sm sm:text-base mb-1">{data.fullName}</div>
          <div className="text-xs text-slate-600 font-mono mb-2">
            Status: <span className="text-sky-700 font-bold">{data.status}</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs pt-1.5 border-t border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Inward Purchase:</span>
              <span className="font-bold text-slate-900">{formatINR(data.purchase)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Refurbishment / Repairs:</span>
              <span className="font-bold text-sky-700">{formatINR(data.repairs)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Total Landed Cost:</span>
              <span className="font-bold text-slate-900">{formatINR(data.landed)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Showroom Asking Price:</span>
              <span className="font-bold text-amber-800">{formatINR(data.asking)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 font-bold">
              <span className={data.profit >= 0 ? "text-emerald-700" : "text-red-700"}>Net Margin (P&L):</span>
              <span className={data.profit >= 0 ? "text-emerald-700 text-xs sm:text-sm" : "text-red-700 text-xs sm:text-sm"}>
                {data.profit >= 0 ? '+' : ''}{formatINR(data.profit)} ({data.roi}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // WhatsApp Link Helper
  const getWhatsAppLink = (phone: string, name: string, bike: string) => {
    const p = cleanPhone(phone);
    const finalPhone = p.startsWith('91') ? p : '91' + p;
    const msg = encodeURIComponent(`Hello ${name || 'Sir/Madam'}, thank you for contacting Adarsh Motors regarding the ${bike || 'vehicle'}. I'm following up on your enquiry. When would be a good time for a test ride or showroom visit?`);
    return `https://wa.me/${finalPhone}?text=${msg}`;
  };

  const getBikeWhatsAppLink = (b: BikeItem) => {
    const isBudget = isBudgetVehicleCategory(b.category, b.price_raw || b.price, b.name);
    const routedNumber = isBudget
      ? (settings.budgetBikesPhone || settings.whatsapp || settings.salesPhone || '9014540489')
      : (settings.superbikesPhone || settings.whatsapp || settings.salesPhone || '9014540489');
    const deskName = isBudget ? 'Budget Bikes Desk' : 'Superbikes & Luxury Desk';
    const msg = `Hi Adarsh Motors ${deskName}, I am interested in the ${b.name} (${b.year || '2024'} - Offer Price: ${formatINR(b.price)}). Is this vehicle currently available for inspection and test ride at your showroom?`;
    return buildWhatsAppUrl(routedNumber, msg);
  };

  // Dedicated helper to retrieve all customer inquiries for a specific bike
  const getBikeLeads = (bike: BikeItem): LeadItem[] => {
    if (!bike) return [];
    const bName = String(bike.name || '').toLowerCase().trim();
    // Distinctive keywords from bike name
    const nameKeywords = bName
      .split(/\s+/)
      .filter(w => w.length >= 3 && !['motor', 'bike', 'edition', 'premium', 'with', 'gear', 'suit'].includes(w));

    return leads.filter(l => {
      if (!l) return false;
      const lBike = String(l.bike_interested || l.bike_model || '').toLowerCase().trim();
      if (!lBike) return false;
      if (lBike.includes(bName) || bName.includes(lBike)) return true;
      return nameKeywords.some(kw => lBike.includes(kw));
    });
  };

  // Handler to register a new lead for the selected bike directly
  const handleAddBikeLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBikeForLeads) return;
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      showToast('Please enter both customer name and phone number.');
      return;
    }

    const tempId = Date.now();
    const leadNote = newLeadMessage.trim() || `Customer requested showroom inquiry for ${selectedBikeForLeads.name}.`;
    const newLead: LeadItem = {
      id: tempId,
      customer_name: newLeadName.trim(),
      phone: newLeadPhone.trim(),
      bike_interested: selectedBikeForLeads.name,
      service_type: newLeadServiceType || 'Purchase Booking',
      message: leadNote,
      status: newLeadStatus,
      created_at: new Date().toISOString()
    };

    setLeads(prev => [newLead, ...prev]);
    logAuditAction(
      'lead_status',
      'Leads CRM',
      `${currentUser?.name || 'Staff'} recorded new inquiry for ${selectedBikeForLeads.name} from ${newLead.customer_name}`,
      newLead.id,
      `${newLead.customer_name} (${newLead.phone})`,
      { notes: `Vehicle: ${selectedBikeForLeads.name}, Service: ${newLead.service_type}` }
    );

    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadMessage('');
    setShowAddLeadForBike(false);

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          type: newLead.service_type || 'Inquiry',
          name: newLead.customer_name,
          phone: newLead.phone,
          bike_model: newLead.bike_interested,
          service_type: newLead.service_type,
          notes: newLead.message,
          status: newLead.status
        }])
        .select()
        .single();

      if (error) {
        console.error("Supabase lead insert error:", error);
        showToast(`Saved locally — Supabase lead sync error: ${error.message}`);
      } else {
        if (data?.id) {
          setLeads(prev => prev.map(item => String(item.id) === String(tempId) ? { ...item, id: data.id } : item));
        }
        showToast(`Recorded inquiry for ${selectedBikeForLeads.name} in Supabase!`);
      }
    } catch (err: any) {
      console.error("Supabase lead sync error:", err);
      showToast(`Saved locally — Lead sync error: ${err?.message || 'Network error'}`);
    }
  };

  // CMS Settings Save & Supabase Sync Handler
  const handleSaveCmsSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fallbackHotline = String(settings.salesPhone || '+91 9014540489').trim() || '+91 9014540489';
    const hasSuperbikePhone = Boolean(String(settings.superbikesPhone || '').trim());
    const hasBudgetPhone = Boolean(String(settings.budgetBikesPhone || '').trim());

    if (cmsActiveSubTab === 'helplines' && (!hasSuperbikePhone || !hasBudgetPhone)) {
      showToast('Mandatory: Please enter separate contact numbers for both Superbikes & Cruisers and Mid-Range / Budget Bikes.');
      return;
    }

    const settingsToSave: SiteSettings = {
      ...settings,
      superbikesPhone: hasSuperbikePhone ? settings.superbikesPhone : fallbackHotline,
      budgetBikesPhone: hasBudgetPhone ? settings.budgetBikesPhone : fallbackHotline,
      heroSlides: normalizeHeroSlides(settings.heroSlides || DEFAULT_HERO_SLIDES, DEFAULT_HERO_SLIDES),
    };

    if (!hasSuperbikePhone || !hasBudgetPhone) {
      setSettings(settingsToSave);
    }

    setCmsSaveLoading(true);
    setCmsAutoSyncState('syncing');

    logAuditAction(
      'settings_edit',
      'CMS Settings',
      `${currentUser?.name || 'Owner'} updated customer portal settings (helplines, social links, hero slides, visibility)`,
      undefined,
      'Site Settings',
      { notes: `Superbikes: ${settingsToSave.superbikesPhone}, Budget/Mid-Range: ${settingsToSave.budgetBikesPhone}, Sales: ${settingsToSave.salesPhone}` }
    );

    try {
      lastLocalSettingsSyncAtRef.current = Date.now();
      const { ok, errorMessage } = await syncSectionVisibilityToSupabase(
        supabase,
        settingsToSave,
        'enableAccessoriesSection',
        Boolean(settingsToSave.enableAccessoriesSection)
      );
      if (ok) {
        setCmsAutoSyncState('synced');
        showToast('Customer portal settings saved & synced live to Supabase!');
      } else {
        setCmsAutoSyncState('error');
        showToast(`Saved locally — Supabase settings sync error: ${errorMessage}`);
      }
    } finally {
      setTimeout(() => setCmsSaveLoading(false), 300);
    }
  };

  const handleSaveIndividualPhone = async (fieldKey: keyof SiteSettings, label: string) => {
    const keyStr = String(fieldKey);
    const currentValue = String((settings as any)[fieldKey] || '').trim();
    if ((keyStr === 'superbikesPhone' || keyStr === 'budgetBikesPhone') && currentValue.replace(/\D/g, '').length < 10) {
      showToast(`Mandatory: Enter a valid 10-digit phone number for ${label}.`);
      return;
    }
    setSavingPhoneField(keyStr);
    setCmsAutoSyncState('syncing');

    try {
      localStorage.setItem('adarsh_settings', JSON.stringify(settings));
      broadcastLiveSync('settings', settings);

      logAuditAction(
        'settings_edit',
        'CMS Settings',
        `${currentUser?.name || 'Owner'} saved ${label}: ${String((settings as any)[fieldKey] || '')}`,
        undefined,
        label,
        { notes: `${keyStr} = ${String((settings as any)[fieldKey] || '')}` }
      );

      lastLocalSettingsSyncAtRef.current = Date.now();
      const { ok, errorMessage } = await syncSectionVisibilityToSupabase(
        supabase,
        settings,
        'enableAccessoriesSection',
        Boolean(settings.enableAccessoriesSection)
      );
      if (ok) {
        setCmsAutoSyncState('synced');
        setSavedPhoneField(keyStr);
        showToast(`${label} saved & synced to Customer Website!`);
        window.setTimeout(() => {
          setSavedPhoneField((prev) => (prev === keyStr ? null : prev));
        }, 2500);
      } else {
        setCmsAutoSyncState('error');
        showToast(`Saved locally — Supabase sync error: ${errorMessage}`);
      }
    } finally {
      setSavingPhoneField((prev) => (prev === keyStr ? null : prev));
    }
  };

  const handleSaveSectionPhoneDirect = async (
    fieldKey: keyof SiteSettings,
    nextValue: string,
    label: string
  ): Promise<boolean> => {
    const keyStr = String(fieldKey);
    const trimmed = String(nextValue || '').trim();
    const digits = trimmed.replace(/\D/g, '');
    if ((keyStr === 'superbikesPhone' || keyStr === 'budgetBikesPhone') && digits.length < 10) {
      showToast(`Mandatory: Enter a valid 10-digit phone number for ${label}.`);
      return false;
    }
    if (trimmed && digits.length < 10) {
      showToast(`Enter a valid 10-digit Call / WhatsApp number for ${label}.`);
      return false;
    }

    const updatedSettings: SiteSettings = {
      ...settings,
      [fieldKey]: trimmed,
    };

    setSavingPhoneField(keyStr);
    setCmsAutoSyncState('syncing');
    setSettings(updatedSettings);

    try {
      try {
        localStorage.setItem('adarsh_settings', JSON.stringify(updatedSettings));
      } catch {}
      broadcastLiveSync('settings', updatedSettings);

      logAuditAction(
        'settings_edit',
        'CMS Settings',
        `${currentUser?.name || 'Owner'} updated ${label} Call & WhatsApp phone: ${trimmed || '(Cleared)'}`,
        undefined,
        label,
        { field: keyStr, before: String((settings as any)[fieldKey] || ''), after: trimmed, notes: `${keyStr} updated via section header` }
      );

      lastLocalSettingsSyncAtRef.current = Date.now();
      const { ok, errorMessage } = await syncSectionVisibilityToSupabase(
        supabase,
        updatedSettings,
        'enableAccessoriesSection',
        Boolean(updatedSettings.enableAccessoriesSection)
      );

      if (ok) {
        setCmsAutoSyncState('synced');
        setSavedPhoneField(keyStr);
        showToast(`${label} number saved & synced live!`);
        window.setTimeout(() => {
          setSavedPhoneField((prev) => (prev === keyStr ? null : prev));
        }, 2500);
        return true;
      } else {
        setCmsAutoSyncState('error');
        showToast(`Saved locally — Supabase sync error: ${errorMessage}`);
        return true;
      }
    } finally {
      setSavingPhoneField((prev) => (prev === keyStr ? null : prev));
    }
  };

  // Helper to compress and handle slide image file upload directly from mobile / desktop
  const handleSlideImageUpload = (file: File, slideIndex: number) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const applyImage = (finalUrl: string) => {
        setSettings((prev) => {
          const baseSlides = Array.isArray(prev.heroSlides) && prev.heroSlides.length > 0
            ? prev.heroSlides
            : DEFAULT_HERO_SLIDES;
          const safeIdx = Math.min(Math.max(0, slideIndex), baseSlides.length - 1);
          return {
            ...prev,
            heroSlides: baseSlides.map((s, idx) => (idx === safeIdx ? { ...s, image: finalUrl } : s)),
          };
        });
        showToast(`Updated banner image for Slide #${slideIndex + 1}!`);
      };

      // Compress large raster photos so localStorage & Supabase sync stay fast and under size limits
      if (file.type === 'image/svg+xml' || rawDataUrl.length < 180000) {
        applyImage(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxWidth = 1280;
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            applyImage(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          applyImage(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
        } catch {
          applyImage(rawDataUrl);
        }
      };
      img.onerror = () => applyImage(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  if (isCustomerStorefrontRoute) {
    return (
      <CustomerLiveWebsitePreviewModal
        isOpen={true}
        standalonePage={true}
        onClose={() => {
          window.location.hash = '';
          setIsCustomerStorefrontRoute(false);
        }}
        onBackToAdmin={() => {
          window.location.hash = '';
          setIsCustomerStorefrontRoute(false);
        }}
        customerSiteUrl={settings.customerSiteUrl}
        showToast={showToast}
        supabase={supabase}
        adminSettings={settings}
        adminBikes={bikes}
        adminBranches={branches}
      />
    );
  }

  // ==============================================================
  // RENDER AUTH MODAL (IF NOT LOGGED IN)
  // ==============================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-600 flex items-center justify-center p-3 sm:p-5 relative overflow-y-auto font-sans">
        <div className="w-full max-w-lg bg-white border border-slate-200 p-4 sm:p-8 rounded-2xl shadow-sm relative z-10 my-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src="/assets/adarsh-text-logo-transparent.png"
                alt="ADARSH MOTORS"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </div>
            <p className="text-xs font-bold tracking-widest text-slate-600 uppercase mt-1">
              OPERATIONS & CUSTOMER OWNERSHIP PORTAL
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#showroom';
                setIsCustomerStorefrontRoute(true);
              }}
              className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition min-h-[40px]"
            >
              <Globe className="w-4 h-4 text-emerald-700" />
              <span>View Live Customer Storefront</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Staff / Owner Portal Indicator */}
          <div className="mb-5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-bold">
            <Crown className="w-4 h-4 text-red-600" />
            <span>Staff / Owner Sign In</span>
          </div>

          <>
              <p className="text-xs sm:text-sm text-slate-600 text-center mb-4 leading-relaxed">
                Enter your registered Phone Number to receive a secure 6-digit OTP from the OTP Operator
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (adminOtpStep === 'phone') {
                    handleSendAdminOtp(loginPhone);
                  } else {
                    handleVerifyAdminOtp(loginPhone, adminOtpCode);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Authorized Phone Number
                    </label>
                    {adminOtpStep === 'otp' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminOtpStep('phone');
                          setAdminOtpCode('');
                          setAdminOtpNotice('');
                          setAdminOtpDemoCode('');
                          setLoginError('');
                        }}
                        className="text-xs font-bold text-sky-700 hover:text-sky-800 underline cursor-pointer"
                      >
                        Change Number
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      disabled={adminOtpStep === 'otp'}
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="e.g. 9014540489"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono transition disabled:opacity-70"
                    />
                  </div>
                </div>

                {adminOtpStep === 'otp' && (
                  <div className="space-y-3">
                    {adminOtpNotice && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{adminOtpNotice}</span>
                          </span>
                          {resolvedAuthTarget && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold shrink-0">
                              {resolvedAuthTarget.name}
                            </span>
                          )}
                        </div>
                        {adminOtpDemoCode && (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200">
                            <span className="font-mono text-emerald-700">
                              Operator OTP: <strong className="text-slate-900 tracking-widest">{adminOtpDemoCode}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setAdminOtpCode(adminOtpDemoCode)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                            >
                              Auto-Fill OTP
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                          6-Digit OTP Verification Code
                        </label>
                        <button
                          type="button"
                          disabled={adminOtpCooldown > 0 || isSendingAdminOtp}
                          onClick={() => handleSendAdminOtp(loginPhone)}
                          className="text-xs font-bold text-sky-700 hover:text-sky-800 disabled:text-slate-400 cursor-pointer"
                        >
                          {adminOtpCooldown > 0 ? `Resend in ${adminOtpCooldown}s` : 'Resend OTP'}
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                          <KeyRound className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          autoFocus
                          value={adminOtpCode}
                          onChange={(e) => setAdminOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit OTP"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-sky-200 rounded-xl text-base tracking-[0.35em] text-slate-900 placeholder-slate-400 placeholder:tracking-normal focus:outline-none focus:border-sky-500 font-mono transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {loginError && (
                  <div className="text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn || isSendingAdminOtp}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm tracking-wide shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <span>
                    {adminOtpStep === 'phone'
                      ? isSendingAdminOtp
                        ? 'Sending OTP via Operator...'
                        : 'Send OTP via Operator'
                      : isLoggingIn
                      ? 'Verifying OTP...'
                      : 'Verify OTP & Sign In'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo OTP Dispatch Buttons */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 text-center">
                  1-Tap Staff / Owner OTP Login
                </p>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {(() => {
                    const activeOwners = ownerAccounts.filter((o) => o.status !== 'Inactive');
                    const primaryOwner =
                      activeOwners.find((o) => o.isPrimary) || activeOwners[0] || SEED_OWNERS[0];
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setLoginPhone(primaryOwner.phone);
                          handleSendAdminOtp(primaryOwner.phone);
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex flex-col group cursor-pointer"
                      >
                        <span className="font-bold text-red-700 flex items-center gap-1.5 text-xs sm:text-sm">
                          <Crown className="w-4 h-4" /> Owner OTP
                        </span>
                        <span className="text-xs text-slate-600 font-mono mt-1">
                          {primaryOwner.phone} · Send OTP
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5 truncate">
                          {activeOwners.length > 1
                            ? `All Modules (+${activeOwners.length - 1} Family Co-Owners)`
                            : 'All Modules'}
                        </span>
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => {
                      setLoginPhone('9876543210');
                      handleSendAdminOtp('9876543210');
                    }}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex flex-col group cursor-pointer"
                  >
                    <span className="font-bold text-sky-700 flex items-center gap-1.5 text-xs sm:text-sm">
                      <UserCheck className="w-4 h-4" /> Worker OTP
                    </span>
                    <span className="text-xs text-slate-600 font-mono mt-1">9876543210 · Send OTP</span>
                    <span className="text-xs text-slate-500 mt-0.5">Assigned Modules</span>
                  </button>
                </div>
              </div>
            </>
        </div>
      </div>
    );
  }

  // ==============================================================
  // MAIN APPLICATION SHELL (AUTHENTICATED)
  // ==============================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 flex flex-col lg:flex-row relative font-sans selection:bg-red-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-3 lg:right-5 z-50 p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center gap-2 text-xs text-slate-900 animate-fade-in max-w-[90vw]">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Lockup */}
        <div
          className="p-4 border-b border-slate-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
          onClick={() => {
            const homeTab = hasAccess('overview') ? 'overview' : getFirstAllowedTab(currentUser);
            if (homeTab) setActiveTab(homeTab);
          }}
        >
          <div className="flex items-center justify-center py-1">
            <img
              src="/assets/adarsh-text-logo-transparent.png"
              alt="ADARSH MOTORS"
              className="h-8 w-auto max-w-[210px] object-contain"
            />
          </div>
          <div className="text-xs tracking-widest text-slate-600 font-bold uppercase mt-1">
            OPERATIONS & CRM PORTAL
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5">
          {hasAccess('overview') && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'overview'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>
          )}

          {hasAccess('inventory') && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bike className="w-4 h-4 text-red-600 shrink-0" />
              <span className="truncate">Superbikes Inventory</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                {superbikeBikes.length}
              </span>
            </button>
          )}

          {hasAccess('budget_bikes') && (
            <button
              onClick={() => setActiveTab('budget_bikes')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'budget_bikes'
                  ? 'bg-teal-50 border border-teal-200 text-teal-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bike className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">Budget Bikes Inventory</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-teal-700 shrink-0">
                {budgetBikes.length}
              </span>
            </button>
          )}

          {/* Standalone Superbike Accessories Inventory Manager */}
          {hasAccess('accessories') && (
            <button
              onClick={() => setActiveTab('accessories')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'accessories'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PackageOpen className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="truncate">Superbike Accessories</span>
              <span className="ml-auto text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                Gear
              </span>
            </button>
          )}

          {hasAccess('leads') && (
            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'leads'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span className="truncate">Leads CRM</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 shrink-0">
                {newLeadsCount}
              </span>
            </button>
          )}

          {hasAccess('exchange_leads') && (
            <button
              onClick={() => setActiveTab('exchange_leads')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'exchange_leads'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Exchange / Sell Leads</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                {newExchangeLeadsCount}
              </span>
            </button>
          )}

          {hasAccess('loan_leads') && (
            <button
              onClick={() => setActiveTab('loan_leads')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'loan_leads'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">Loan &amp; Finance Leads</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                {newLoanLeadsCount}
              </span>
            </button>
          )}

          {hasAccess('service_leads') && (
            <button
              onClick={() => setActiveTab('service_leads')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'service_leads'
                  ? 'bg-sky-50 border border-sky-200 text-sky-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="truncate">Service &amp; Workshop Leads</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                {newServiceLeadsCount}
              </span>
            </button>
          )}

          {hasAccess('accessories_leads') && (
            <button
              onClick={() => setActiveTab('accessories_leads')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'accessories_leads'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PackageOpen className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="truncate">Accessories &amp; Gear Leads</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                {newAccessoriesLeadsCount}
              </span>
            </button>
          )}

          {hasAccess('billing') && (
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'billing'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span className="truncate">Digital Billing</span>
            </button>
          )}

          {/* Customer Paper Transfer & Profile Manager */}
          {hasAccess('customers') && (
            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'customers'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="truncate">Customer Paper Transfer</span>
              <span className="ml-auto text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                RTO
              </span>
            </button>
          )}

          {hasAccess('branches') && (
            <button
              onClick={() => setActiveTab('branches')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'branches'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">Branch Manager</span>
            </button>
          )}

          {hasAccess('settings') && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span className="truncate">CMS & Social Links</span>
            </button>
          )}

          {/* Customer Website Section Visibility Controller (All Sections On/Off) */}
          {hasAccess('section_controls') && (
            <button
              onClick={() => setActiveTab('section_controls')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'section_controls'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Website Section Controls</span>
              <span className="ml-auto text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                On/Off
              </span>
            </button>
          )}

          {/* Owner Only / Authorized Manager: Profit & Loss (P&L) */}
          {hasAccess('pnl') && (
            <button
              onClick={() => setActiveTab('pnl')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'pnl'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Profit & Loss (P&L)</span>
              <span className="ml-auto text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Owner
              </span>
            </button>
          )}

          {/* Owner Only: Staff Activity & Forensic Audit Log */}
          {currentUser.role === 'owner' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'audit'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4 text-amber-700" />
              <span>Staff Activity & Audit</span>
              <span className="ml-auto text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                Owner
              </span>
            </button>
          )}

          {/* Owner Only: Staff Access */}
          {currentUser.role === 'owner' && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'staff'
                  ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff Access</span>
              <span className="ml-auto text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Owner
              </span>
            </button>
          )}
        </nav>

        {/* User Profile Card & Sign Out */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-900 text-xs shrink-0">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-xs text-red-700 truncate">
                {currentUser.role === 'owner' ? 'Owner / Super Admin' : 'Showroom Staff'}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} title="Sign Out" className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* UNIFIED MOBILE TOP BAR + CAPSULE TAB HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <header className="border-b border-slate-200 px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* In-Interface Back Button (Visible only when another permitted section can be returned to) */}
            {(navigationHistory.filter((t) => hasAccess(t)).length > 1 || (hasAccess('overview') && activeTab !== 'overview')) && (
              <button
                type="button"
                onClick={handleGoBack}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 active:scale-95 transition shrink-0"
                title="Go back one step (or press mobile back button)"
                aria-label="Go Back"
              >
                <ChevronLeft className="w-4 h-4 text-red-600" />
              </button>
            )}

            {/* Branded Official Logo in pure text form (ADARSH M🏍️TORS) without boxed background */}
            <div
              onClick={() => {
                const homeTab = hasAccess('overview') ? 'overview' : getFirstAllowedTab(currentUser);
                if (homeTab) setActiveTab(homeTab);
              }}
              className="flex items-center cursor-pointer group active:scale-98 transition py-0.5 min-w-0"
              title="Adarsh Motors Admin"
            >
              <img
                src="/assets/adarsh-text-logo-transparent.png"
                alt="ADARSH MOTORS"
                className="h-5 xs:h-6 sm:h-7 w-auto max-w-[140px] xs:max-w-[175px] sm:max-w-[220px] object-contain"
                loading="eager"
              />
            </div>
          </div>

          {/* Right Action Controls matching reference screenshot 3 & 4 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Call Pill matching reference screenshot */}
            <a
              href="tel:9014540489"
              className="px-2.5 h-8 sm:h-9 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
              title="Helpline: +91 9014540489"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>Call</span>
            </a>

            {/* Public Website Sections Toggle / Preview Shortcut (Only when permitted) */}
            {hasAccess('section_controls') && (
              <button
                type="button"
                onClick={() => setActiveTab('section_controls')}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 text-sky-600 hover:text-sky-700 transition cursor-pointer"
                title="Customer Website Controls & Section Sync"
                aria-label="Customer Website Controls"
              >
                <Globe className="w-4 h-4" />
              </button>
            )}

            {/* Rounded Hamburger Menu Button matching reference screenshot */}
            <button
              type="button"
              onClick={() => setShowMobileNavDrawer(true)}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-700 transition cursor-pointer"
              title="Open Full Navigation Menu"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MOBILE CAPSULE TAB NAVIGATION */}
        <div className="px-1 py-1">
          <div className="relative flex items-center gap-0.5">
            {/* Left Scroll Chevron */}
            <button
              type="button"
              onClick={() => {
                if (capsuleNavRef.current) {
                  capsuleNavRef.current.scrollBy({ left: -140, behavior: 'smooth' });
                }
              }}
              className="p-2 text-slate-600 hover:text-slate-900 shrink-0 active:scale-90 transition rounded-full hover:bg-slate-100"
              title="Scroll tabs left"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Capsule Scroll Track with smooth auto-scroll & center snapping */}
            <div
              ref={capsuleNavRef}
              className="bg-slate-50 border border-slate-200 rounded-full p-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 touch-pan-x"
            >
              {hasAccess('overview') && (
                <button
                  data-tab="overview"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'overview'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'overview' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>
              )}

              {hasAccess('inventory') && (
                <button
                  data-tab="inventory"
                  onClick={() => setActiveTab('inventory')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'inventory'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'inventory' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <Bike className="w-3.5 h-3.5" />
                  <span>Superbikes</span>
                  <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>{superbikeBikes.length}</span>
                </button>
              )}

              {hasAccess('budget_bikes') && (
                <button
                  data-tab="budget_bikes"
                  onClick={() => setActiveTab('budget_bikes')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'budget_bikes'
                      ? 'bg-teal-600 text-white font-bold border border-teal-600'
                      : 'text-teal-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'budget_bikes' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <Bike className={`w-3.5 h-3.5 ${activeTab === 'budget_bikes' ? 'text-white' : 'text-teal-700'}`} />
                  <span>Budget Bikes</span>
                  <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'budget_bikes' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>{budgetBikes.length}</span>
                </button>
              )}

              {hasAccess('accessories') && (
                <button
                  data-tab="accessories"
                  onClick={() => setActiveTab('accessories')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'accessories'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-amber-800 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'accessories' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <PackageOpen className={`w-3.5 h-3.5 ${activeTab === 'accessories' ? 'text-white' : 'text-amber-800'}`} />
                  <span>Gear</span>
                </button>
              )}

              {hasAccess('leads') && (
                <button
                  data-tab="leads"
                  onClick={() => setActiveTab('leads')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'leads'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'leads' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <PhoneCall className={`w-3.5 h-3.5 ${activeTab === 'leads' ? 'text-white' : 'text-sky-700'}`} />
                  <span>Leads</span>
                  {newLeadsCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'leads' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700'}`}>{newLeadsCount}</span>
                  )}
                </button>
              )}

              {hasAccess('exchange_leads') && (
                <button
                  data-tab="exchange_leads"
                  onClick={() => setActiveTab('exchange_leads')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'exchange_leads'
                      ? 'bg-emerald-600 text-white font-bold border border-emerald-600'
                      : 'text-emerald-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'exchange_leads' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <ArrowRightLeft className={`w-3.5 h-3.5 ${activeTab === 'exchange_leads' ? 'text-white' : 'text-emerald-700'}`} />
                  <span>Exchange Leads</span>
                  {newExchangeLeadsCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'exchange_leads' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'}`}>{newExchangeLeadsCount}</span>
                  )}
                </button>
              )}

              {hasAccess('loan_leads') && (
                <button
                  data-tab="loan_leads"
                  onClick={() => setActiveTab('loan_leads')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'loan_leads'
                      ? 'bg-blue-600 text-white font-bold border border-blue-600'
                      : 'text-blue-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'loan_leads' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <Calculator className={`w-3.5 h-3.5 ${activeTab === 'loan_leads' ? 'text-white' : 'text-blue-700'}`} />
                  <span>Loan Leads</span>
                  {newLoanLeadsCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'loan_leads' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'}`}>{newLoanLeadsCount}</span>
                  )}
                </button>
              )}

              {hasAccess('service_leads') && (
                <button
                  data-tab="service_leads"
                  onClick={() => setActiveTab('service_leads')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'service_leads'
                      ? 'bg-cyan-600 text-white font-bold border border-cyan-600'
                      : 'text-sky-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'service_leads' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <Wrench className={`w-3.5 h-3.5 ${activeTab === 'service_leads' ? 'text-white' : 'text-sky-700'}`} />
                  <span>Service Leads</span>
                  {newServiceLeadsCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'service_leads' ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-700'}`}>{newServiceLeadsCount}</span>
                  )}
                </button>
              )}

              {hasAccess('accessories_leads') && (
                <button
                  data-tab="accessories_leads"
                  onClick={() => setActiveTab('accessories_leads')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'accessories_leads'
                      ? 'bg-amber-600 text-white font-bold border border-amber-600'
                      : 'text-amber-800 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'accessories_leads' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <PackageOpen className={`w-3.5 h-3.5 ${activeTab === 'accessories_leads' ? 'text-white' : 'text-amber-800'}`} />
                  <span>Gear Leads</span>
                  {newAccessoriesLeadsCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'accessories_leads' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800'}`}>{newAccessoriesLeadsCount}</span>
                  )}
                </button>
              )}

              {hasAccess('section_controls') && (
                <button
                  data-tab="section_controls"
                  onClick={() => setActiveTab('section_controls')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'section_controls'
                      ? 'bg-emerald-600 text-white font-bold border border-emerald-600'
                      : 'text-emerald-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'section_controls' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Sections</span>
                </button>
              )}

              {hasAccess('billing') && (
                <button
                  data-tab="billing"
                  onClick={() => setActiveTab('billing')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'billing'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'billing' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Billing</span>
                </button>
              )}

              {hasAccess('customers') && (
                <button
                  data-tab="customers"
                  onClick={() => setActiveTab('customers')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'customers'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-sky-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'customers' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Paper Transfer</span>
                </button>
              )}

              {hasAccess('pnl') && (
                <button
                  data-tab="pnl"
                  onClick={() => setActiveTab('pnl')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'pnl'
                      ? 'bg-emerald-600 text-white font-bold border border-emerald-600'
                      : 'text-emerald-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'pnl' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>P&L</span>
                </button>
              )}

              {currentUser.role === 'owner' && (
                <button
                  data-tab="audit"
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'audit'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-amber-800 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'audit' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <History className="w-3.5 h-3.5" />
                  <span>Audit</span>
                </button>
              )}

              {currentUser.role === 'owner' && (
                <button
                  data-tab="staff"
                  onClick={() => setActiveTab('staff')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'staff'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'staff' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <Users className="w-3.5 h-3.5" />
                  <span>Staff</span>
                </button>
              )}

              {hasAccess('branches') && (
                <button
                  data-tab="branches"
                  onClick={() => setActiveTab('branches')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'branches'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'branches' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Branches</span>
                </button>
              )}

              {hasAccess('settings') && (
                <button
                  data-tab="settings"
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    activeTab === 'settings'
                      ? 'bg-red-600 text-white font-bold border border-red-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {activeTab === 'settings' && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                  <Sliders className="w-3.5 h-3.5" />
                  <span>CMS</span>
                </button>
              )}
            </div>

            {/* Right Scroll Chevron */}
            <button
              type="button"
              onClick={() => {
                if (capsuleNavRef.current) {
                  capsuleNavRef.current.scrollBy({ left: 140, behavior: 'smooth' });
                }
              }}
              className="p-2 text-slate-600 hover:text-slate-900 shrink-0 active:scale-90 transition rounded-full hover:bg-slate-100"
              title="Scroll tabs right"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER (Outside sticky backdrop-blur to avoid fixed containment trap) */}
      {showMobileNavDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileNavDrawer(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-[88%] max-w-sm bg-white border-r border-slate-200 z-10 flex flex-col h-full shadow-lg overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="py-1">
                  <img
                    src="/assets/adarsh-text-logo-transparent.png"
                    alt="ADARSH MOTORS"
                    className="h-6 w-auto object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">{currentUser.name}</h3>
                  <p className="text-xs text-red-600 font-bold uppercase">{currentUser.role === 'owner' ? 'Owner / Super Admin' : 'Showroom Staff'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileNavDrawer(false)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current User Pill */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-sm text-slate-600 font-mono">+91 {currentUser.phone}</div>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-red-50 text-red-700 border border-red-200">
                {currentUser.role}
              </span>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 p-3.5 space-y-5 overflow-y-auto">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1 mb-1.5">
                  Core Management
                </div>
                <div className="space-y-1.5">
                  {hasAccess('overview') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('overview'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'overview'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className={`w-5 h-5 shrink-0 ${activeTab === 'overview' ? 'text-white' : 'text-red-600'}`} />
                      <span>Overview Dashboard</span>
                    </button>
                  )}

                  {hasAccess('inventory') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('inventory'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'inventory'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bike className={`w-5 h-5 shrink-0 ${activeTab === 'inventory' ? 'text-white' : 'text-red-600'}`} />
                        <span>Superbikes &amp; Luxury</span>
                      </div>
                      <span className={`text-sm px-2.5 py-0.5 rounded-md font-mono font-bold ${activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'}`}>
                        {superbikeBikes.length}
                      </span>
                    </button>
                  )}

                  {hasAccess('budget_bikes') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('budget_bikes'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'budget_bikes'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bike className={`w-5 h-5 shrink-0 ${activeTab === 'budget_bikes' ? 'text-white' : 'text-teal-600'}`} />
                        <span>Budget Bikes Inventory</span>
                      </div>
                      <span className={`text-sm px-2.5 py-0.5 rounded-md font-mono font-bold ${activeTab === 'budget_bikes' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-800 border border-teal-200'}`}>
                        {budgetBikes.length}
                      </span>
                    </button>
                  )}

                  {hasAccess('accessories') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('accessories'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'accessories'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <PackageOpen className={`w-5 h-5 shrink-0 ${activeTab === 'accessories' ? 'text-white' : 'text-amber-700'}`} />
                      <span>Superbike Gear & Accessories</span>
                    </button>
                  )}

                  {hasAccess('leads') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('leads'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'leads'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PhoneCall className={`w-5 h-5 shrink-0 ${activeTab === 'leads' ? 'text-white' : 'text-sky-700'}`} />
                        <span>Leads & Inquiries CRM</span>
                      </div>
                      {newLeadsCount > 0 && (
                        <span className={`text-sm px-2.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${activeTab === 'leads' ? 'bg-white/20 text-white border border-white/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {newLeadsCount} new
                        </span>
                      )}
                    </button>
                  )}

                  {hasAccess('exchange_leads') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('exchange_leads'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'exchange_leads'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ArrowRightLeft className={`w-5 h-5 shrink-0 ${activeTab === 'exchange_leads' ? 'text-white' : 'text-emerald-700'}`} />
                        <span>Exchange / Sell Bike Leads</span>
                      </div>
                      {newExchangeLeadsCount > 0 && (
                        <span className={`text-sm px-2.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${activeTab === 'exchange_leads' ? 'bg-white/20 text-white border border-white/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {newExchangeLeadsCount} new
                        </span>
                      )}
                    </button>
                  )}

                  {hasAccess('loan_leads') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('loan_leads'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'loan_leads'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className={`w-5 h-5 shrink-0 ${activeTab === 'loan_leads' ? 'text-white' : 'text-blue-700'}`} />
                        <span>Loan &amp; Finance Leads</span>
                      </div>
                      {newLoanLeadsCount > 0 && (
                        <span className={`text-sm px-2.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${activeTab === 'loan_leads' ? 'bg-white/20 text-white border border-white/30' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          {newLoanLeadsCount} new
                        </span>
                      )}
                    </button>
                  )}

                  {hasAccess('service_leads') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('service_leads'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'service_leads'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Wrench className={`w-5 h-5 shrink-0 ${activeTab === 'service_leads' ? 'text-white' : 'text-sky-700'}`} />
                        <span>Service &amp; Workshop Leads</span>
                      </div>
                      {newServiceLeadsCount > 0 && (
                        <span className={`text-sm px-2.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${activeTab === 'service_leads' ? 'bg-white/20 text-white border border-white/30' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
                          {newServiceLeadsCount} new
                        </span>
                      )}
                    </button>
                  )}

                  {hasAccess('accessories_leads') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('accessories_leads'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'accessories_leads'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PackageOpen className={`w-5 h-5 shrink-0 ${activeTab === 'accessories_leads' ? 'text-white' : 'text-amber-800'}`} />
                        <span>Accessories &amp; Gear Leads</span>
                      </div>
                      {newAccessoriesLeadsCount > 0 && (
                        <span className={`text-sm px-2.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${activeTab === 'accessories_leads' ? 'bg-white/20 text-white border border-white/30' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                          {newAccessoriesLeadsCount} new
                        </span>
                      )}
                    </button>
                  )}

                  {hasAccess('billing') && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('billing'); setShowMobileNavDrawer(false); }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                        activeTab === 'billing'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Receipt className={`w-5 h-5 shrink-0 ${activeTab === 'billing' ? 'text-white' : 'text-slate-700'}`} />
                      <span>Invoices & Digital Billing</span>
                    </button>
                  )}
                </div>
              </div>

              {(hasAccess('customers') || hasAccess('branches')) && (
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1 mb-1.5">
                    Customer & Studio
                  </div>
                  <div className="space-y-1.5">
                    {hasAccess('customers') && (
                      <button
                        type="button"
                        onClick={() => { setActiveTab('customers'); setShowMobileNavDrawer(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                          activeTab === 'customers'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <FileCheck className={`w-5 h-5 shrink-0 ${activeTab === 'customers' ? 'text-white' : 'text-sky-700'}`} />
                        <span>RTO Paper & RC Transfer</span>
                      </button>
                    )}

                    {hasAccess('branches') && (
                      <button
                        type="button"
                        onClick={() => { setActiveTab('branches'); setShowMobileNavDrawer(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                          activeTab === 'branches'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <MapPin className={`w-5 h-5 shrink-0 ${activeTab === 'branches' ? 'text-white' : 'text-rose-700'}`} />
                        <span>Showrooms & Branches</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(hasAccess('pnl') || currentUser.role === 'owner') && (
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1 mb-1.5">
                    Executive
                  </div>
                  <div className="space-y-1.5">
                    {hasAccess('pnl') && (
                      <button
                        type="button"
                        onClick={() => { setActiveTab('pnl'); setShowMobileNavDrawer(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                          activeTab === 'pnl'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <TrendingUp className={`w-5 h-5 shrink-0 ${activeTab === 'pnl' ? 'text-white' : 'text-emerald-700'}`} />
                        <span>Dealership P&L Ledger</span>
                      </button>
                    )}

                    {currentUser.role === 'owner' && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('audit'); setShowMobileNavDrawer(false); }}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                            activeTab === 'audit'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <History className={`w-5 h-5 shrink-0 ${activeTab === 'audit' ? 'text-white' : 'text-amber-800'}`} />
                          <span>Staff Activity & Audit Trail</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('staff'); setShowMobileNavDrawer(false); }}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                            activeTab === 'staff'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Users className={`w-5 h-5 shrink-0 ${activeTab === 'staff' ? 'text-white' : 'text-slate-700'}`} />
                          <span>Staff Accounts &amp; OTP</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {(hasAccess('settings') || hasAccess('section_controls')) && (
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1 mb-1.5">
                    Website Controls
                  </div>
                  <div className="space-y-1.5">
                    {hasAccess('settings') && (
                      <button
                        type="button"
                        onClick={() => { setActiveTab('settings'); setShowMobileNavDrawer(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                          activeTab === 'settings'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Sliders className={`w-5 h-5 shrink-0 ${activeTab === 'settings' ? 'text-white' : 'text-sky-700'}`} />
                        <span>Website CMS & Slides</span>
                      </button>
                    )}

                    {hasAccess('section_controls') && (
                      <button
                        type="button"
                        onClick={() => { setActiveTab('section_controls'); setShowMobileNavDrawer(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold transition text-left ${
                          activeTab === 'section_controls'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Sliders className={`w-5 h-5 shrink-0 ${activeTab === 'section_controls' ? 'text-white' : 'text-emerald-700'}`} />
                        <span>Sections On/Off Control</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3.5 bg-white border-t border-slate-200 space-y-2.5">
              {(currentUser.role === 'owner' || hasAccess('section_controls') || hasAccess('settings')) && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileNavDrawer(false);
                    setShowLiveCustomerWebsiteModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Globe className="w-5 h-5" />
                  <span>Customer Website Live</span>
                  <ExternalLink className="w-4 h-4 text-white/90" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMobileNavDrawer(false);
                  handleLogout();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-base font-bold flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-8">
        {/* DESKTOP TOP BAR */}
        <header className="hidden lg:flex items-center justify-between gap-3 px-4 lg:px-5 xl:px-8 py-3 bg-white border-b border-slate-200 flex-nowrap">
          <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold whitespace-nowrap shrink-0">
            Operations <span className="mx-1 text-slate-400">/</span>{' '}
            <span className="text-slate-900 capitalize font-bold">{activeTab.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-2 xl:gap-2.5 min-w-0 justify-end">
            <div className="relative w-40 lg:w-48 xl:w-64 min-w-0 shrink">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  if (e.target.value.trim()) {
                    setInventorySearch(e.target.value);
                    setLeadsSearch(e.target.value);
                  }
                }}
                placeholder="Search vehicles, leads, bills..."
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {(hasAccess('inventory') || hasAccess('budget_bikes')) && (
              <button
                onClick={() =>
                  openAddBikeModal(
                    activeTab === 'budget_bikes' || (!hasAccess('inventory') && hasAccess('budget_bikes'))
                      ? 'budget'
                      : 'superbikes'
                  )
                }
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'budget_bikes' || (!hasAccess('inventory') && hasAccess('budget_bikes'))
                    ? 'bg-teal-600 hover:bg-teal-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'budget_bikes' || (!hasAccess('inventory') && hasAccess('budget_bikes'))
                    ? 'Add Budget Bike'
                    : 'Add Superbike'}
                </span>
              </button>
            )}

            {hasAccess('billing') && (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Log Bill</span>
              </button>
            )}

            {(currentUser.role === 'owner' || hasAccess('section_controls') || hasAccess('settings')) && (
              <button
                onClick={() => setShowLiveCustomerWebsiteModal(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
                title="Open Live Customer Website Preview & Architecture Details"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Customer Site Live</span>
                <ExternalLink className="w-3 h-3 text-emerald-700" />
              </button>
            )}
          </div>
        </header>

        {/* CONTENT SECTIONS */}
        <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-5">

          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW DASHBOARD                                      */}
          {/* ============================================================== */}
          {activeTab === 'overview' && hasAccess('overview') && (
            <div className="space-y-3 sm:space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">Operations Dashboard</h2>
                  <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-0.5">
                    Live telemetry, inventory statistics, showroom leads and monthly revenue summary.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline text-xs text-slate-600 font-mono">
                    {new Date().toLocaleTimeString('en-IN', { hour12: false })} IST
                  </span>
                  <button
                    type="button"
                    onClick={() => syncAllFromSupabase(true)}
                    disabled={isSyncingLive}
                    className="min-h-[36px] sm:min-h-[40px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-xs sm:text-sm font-bold text-sky-700 flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncingLive ? 'animate-spin' : ''}`} />
                    <span>{isSyncingLive ? 'Syncing...' : 'Sync Live'}</span>
                  </button>
                </div>
              </div>

              {/* 4 STAT CARDS (2x2 on Mobile, 4-across on Desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5">
                {/* Active Inventory */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 text-slate-600 mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider truncate">
                      Active Fleet
                    </span>
                    <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-700 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums leading-tight truncate">{activeBikesCount}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-sky-700 font-medium truncate">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">In showroom</span>
                    <span className="text-slate-500 ml-auto">{bikes.length} Total</span>
                  </div>
                </div>

                {/* Monthly Revenue */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 text-slate-600 mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider truncate">
                      Total Revenue
                    </span>
                    <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 shrink-0" />
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tabular-nums leading-tight truncate">
                    <span className="sm:hidden">{formatCompactINR(totalRevenue)}</span>
                    <span className="hidden sm:inline">{formatINR(totalRevenue)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-700 font-medium truncate">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{invoices.length} Bills</span>
                  </div>
                </div>

                {/* New Leads */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 text-slate-600 mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider truncate">
                      New Leads
                    </span>
                    <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-700 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums leading-tight truncate">{newLeadsCount}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-700 font-medium truncate">
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Callbacks</span>
                  </div>
                </div>

                {/* Showrooms */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 text-slate-600 mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider truncate">Studios</span>
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums leading-tight truncate">{branches.length}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-800 font-medium truncate">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Pan-India</span>
                  </div>
                </div>
              </div>

              {/* PUBLIC WEBSITE QUICK ON / OFF CONTROLLER BAR (Strictly gated by section_controls access) */}
              {hasAccess('section_controls') && (
              <div className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200 space-y-2.5 sm:space-y-3 shadow-sm">
                <div className="flex flex-row items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-black text-slate-900 flex items-center gap-1.5 sm:gap-2 truncate">
                      <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Customer Website Sections (1-Tap)</span>
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-600 mt-0.5">
                      Hide or publish any section on the live customer website immediately via Supabase.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('section_controls')}
                    className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-bold text-sky-700 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>All Controls</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
                  <PublicVisibilityToggle
                    compact
                    label="Showroom Fleet"
                    isVisible={Boolean(settings.enableInventoryFleet)}
                    onToggle={() => handleToggleWebsiteSection('enableInventoryFleet', 'Showroom Fleet')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="Accessories"
                    isVisible={Boolean(settings.enableAccessoriesSection)}
                    onToggle={() => handleToggleWebsiteSection('enableAccessoriesSection', 'Superbike Accessories Catalog')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="Locations"
                    isVisible={Boolean(settings.enableBranchLocations)}
                    onToggle={() => handleToggleWebsiteSection('enableBranchLocations', 'Showroom Locations')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="Workshop"
                    isVisible={Boolean(settings.enableWorkshopBooking)}
                    onToggle={() => handleToggleWebsiteSection('enableWorkshopBooking', 'Workshop & Dyno Booking')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="Sell Bike"
                    isVisible={Boolean(settings.enableSellBike)}
                    onToggle={() => handleToggleWebsiteSection('enableSellBike', 'Exchange / Sell Bike')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="Test Rides"
                    isVisible={Boolean(settings.enableTestRide)}
                    onToggle={() => handleToggleWebsiteSection('enableTestRide', 'Test Ride Booking')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="EMI Calc"
                    isVisible={Boolean(settings.enableEmiCalculator)}
                    onToggle={() => handleToggleWebsiteSection('enableEmiCalculator', 'Finance & EMI Calculator')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="Buyer Portal"
                    isVisible={Boolean(settings.enableCustomerHub)}
                    onToggle={() => handleToggleWebsiteSection('enableCustomerHub', 'Buyer Ownership Portal')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="VIP Community"
                    isVisible={Boolean(settings.enableCommunityRides)}
                    onToggle={() => handleToggleWebsiteSection('enableCommunityRides', 'VIP Riders Community')}
                  />
                  <PublicVisibilityToggle
                    compact
                    label="Promo Banner"
                    isVisible={Boolean(settings.bannerActive)}
                    onToggle={() => handleToggleWebsiteSection('bannerActive', 'Top Promo Ticker Banner')}
                  />
                </div>
              </div>
              )}

              {/* VELOCITY CHART & LIVE ALERTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl p-3 sm:p-6 border border-slate-200 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-5">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">Sales &amp; Enquiry Velocity</h3>
                      <p className="hidden sm:block text-xs text-slate-600 mt-0.5">Interactive enquiry traffic over time</p>
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <button
                        onClick={() => setTrendRange(7)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${trendRange === 7 ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        7D
                      </button>
                      <button
                        onClick={() => setTrendRange(15)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${trendRange === 15 ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        15D
                      </button>
                      <button
                        onClick={() => setTrendRange(30)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${trendRange === 30 ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        30D
                      </button>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="w-full h-40 sm:h-56 flex flex-col justify-between">
                    <svg className="w-full h-32 sm:h-44 overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 130 C 100 110, 150 70, 230 85 C 310 100, 380 40, 460 55 C 540 70, 620 20, 700 35 L 700 180 L 0 180 Z"
                        fill="url(#areaGrad)"
                      />
                      <path
                        d="M 0 130 C 100 110, 150 70, 230 85 C 310 100, 380 40, 460 55 C 540 70, 620 20, 700 35"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="230" cy="85" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="460" cy="55" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="700" cy="35" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>
                    <div className="flex justify-between text-[11px] sm:text-xs font-mono text-slate-600 pt-2 border-t border-slate-200">
                      <span>Day 1</span>
                      <span>Day {Math.floor(trendRange / 3)}</span>
                      <span>Day {Math.floor((trendRange * 2) / 3)}</span>
                      <span>Day {trendRange} (Latest)</span>
                    </div>
                  </div>
                </div>

                {/* Alerts Feed */}
                <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">Live Activity Alerts</h3>
                    </div>
                    <button onClick={() => setAlerts([])} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                      Clear
                    </button>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
                    {alerts.map((alt) => (
                      <div key={alt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-red-600 shrink-0">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 truncate">{alt.title}</div>
                          <div className="text-xs text-slate-600 truncate mt-0.5">{alt.detail}</div>
                        </div>
                        <span className="text-xs font-mono text-slate-500 shrink-0">{alt.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Latest Leads Table (Strictly gated by leads access) */}
              {hasAccess('leads') && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Latest Customer Inquiries</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">High-intent buyers awaiting immediate response</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-900 flex items-center gap-1 transition"
                  >
                    <span>Open CRM</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mobile Inquiries Card Feed (< sm) */}
                <div className="block sm:hidden divide-y divide-slate-200 space-y-3">
                  {leads.slice(0, 4).map((l) => (
                    <div key={l.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{l.customer_name}</div>
                          <div className="text-xs text-slate-600 font-mono mt-0.5">{l.phone}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200 shrink-0">
                          {l.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500">Vehicle:</span>
                        <span className="font-bold text-slate-900">{l.bike_interested}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${l.phone}`}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                        <a
                          href={getWhatsAppLink(l.phone, l.customer_name, l.bike_interested)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (sm+) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="text-slate-600 border-b border-slate-200 pb-2 font-bold text-xs">
                        <th className="py-2.5 pr-4">CUSTOMER</th>
                        <th className="py-2.5 px-4">VEHICLE</th>
                        <th className="py-2.5 px-4">STATUS</th>
                        <th className="py-2.5 pl-4 text-right">ONE-TAP CONNECT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {leads.slice(0, 4).map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 pr-4">
                            <div className="font-bold text-slate-900">{l.customer_name}</div>
                            <div className="text-xs text-slate-600 font-mono">{l.phone}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{l.bike_interested}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`tel:${l.phone}`}
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                                title="Call Customer"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                              <a
                                href={getWhatsAppLink(l.phone, l.customer_name, l.bike_interested)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2A: SUPERBIKES & LUXURY INVENTORY MANAGER                  */}
          {/* ============================================================== */}
          {activeTab === 'inventory' && hasAccess('inventory') && (
            <BikeInventorySection
              variant="superbikes"
              bikes={superbikeBikes}
              isSectionVisibleOnSite={Boolean(settings.enableInventoryFleet)}
              onToggleSectionVisibility={() => handleToggleWebsiteSection('enableInventoryFleet', 'Superbikes Fleet Showcase')}
              onAddBike={() => openAddBikeModal('superbikes')}
              onEditBike={openEditBikeModal}
              onDeleteBike={(b) => setBikeToDelete(b)}
              onPreviewBike={openCustomerPreview}
              onToggleBikeStatus={toggleBikeStatus}
              onToggleBikeVisibility={toggleBikePublicVisibility}
              onChangeBikeStatus={async (b, newSt) => {
                const prevSt = b.status;
                setBikes((prev) =>
                  prev.map((item) => (String(item.id) === String(b.id) ? { ...item, status: newSt } : item))
                );
                logAuditAction(
                  'inventory_edit',
                  'Inventory',
                  `${currentUser?.name || 'Staff'} changed status of ${b.name} to '${newSt}'`,
                  b.id,
                  b.name,
                  { field: 'status', before: prevSt, after: newSt, notes: 'Status change via Superbikes card' }
                );
                await syncBikeStatusToSupabase(b, newSt, `${b.name} marked as ${newSt} in Supabase`);
              }}
              isOwner={currentUser?.role === 'owner'}
              sectionPhone={settings.superbikesPhone || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('superbikesPhone', nextPhone, 'Superbikes & Cruisers')
              }
              getBikeLeads={getBikeLeads}
              onOpenBikeLeads={(b) => {
                setSelectedBikeForLeads(b);
                setShowAddLeadForBike(false);
              }}
              formatINR={formatINR}
              initialSearch={inventorySearch}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 2B: BUDGET BIKES INVENTORY MANAGER                         */}
          {/* ============================================================== */}
          {activeTab === 'budget_bikes' && hasAccess('budget_bikes') && (
            <BikeInventorySection
              variant="budget"
              bikes={budgetBikes}
              isSectionVisibleOnSite={Boolean(settings.enableBudgetBikesSection)}
              onToggleSectionVisibility={() =>
                handleToggleWebsiteSection('enableBudgetBikesSection', 'Budget Bikes Fleet Showcase')
              }
              onAddBike={() => openAddBikeModal('budget')}
              onEditBike={openEditBikeModal}
              onDeleteBike={(b) => setBikeToDelete(b)}
              onPreviewBike={openCustomerPreview}
              onToggleBikeStatus={toggleBikeStatus}
              onToggleBikeVisibility={toggleBikePublicVisibility}
              onChangeBikeStatus={async (b, newSt) => {
                const prevSt = b.status;
                setBikes((prev) =>
                  prev.map((item) => (String(item.id) === String(b.id) ? { ...item, status: newSt } : item))
                );
                logAuditAction(
                  'inventory_edit',
                  'Inventory',
                  `${currentUser?.name || 'Staff'} changed status of ${b.name} to '${newSt}'`,
                  b.id,
                  b.name,
                  { field: 'status', before: prevSt, after: newSt, notes: 'Status change via Budget Bikes card' }
                );
                await syncBikeStatusToSupabase(b, newSt, `${b.name} marked as ${newSt} in Supabase`);
              }}
              isOwner={currentUser?.role === 'owner'}
              sectionPhone={settings.budgetBikesPhone || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('budgetBikesPhone', nextPhone, 'Mid-Range, Budget Bikes & Scooters')
              }
              getBikeLeads={getBikeLeads}
              onOpenBikeLeads={(b) => {
                setSelectedBikeForLeads(b);
                setShowAddLeadForBike(false);
              }}
              formatINR={formatINR}
              initialSearch={inventorySearch}
            />
          )}

          {/* ============================================================== */}
          {/* STANDALONE SUPERBIKE ACCESSORIES INVENTORY MANAGER             */}
          {/* ============================================================== */}
          {activeTab === 'accessories' && hasAccess('accessories') && (
            <SuperbikeAccessoriesManager
              supabase={supabase}
              currentUser={currentUser}
              showToast={showToast}
              logAuditAction={logAuditAction}
              isSectionVisible={Boolean(settings.enableAccessoriesSection)}
              onToggleSectionVisibility={() =>
                handleToggleWebsiteSection('enableAccessoriesSection', 'Superbike Accessories Catalog')
              }
              accessoriesDepartmentPhone={settings.accessoriesPhone || settings.whatsapp || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('accessoriesPhone', nextPhone, 'Accessories & Riding Gear')
              }
              staffList={staff}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 3: LEADS CRM                                               */}
          {/* ============================================================== */}
          {activeTab === 'leads' && hasAccess('leads') && (
            <LeadsCrmSection
              leads={leads}
              filteredLeads={filteredLeads}
              leadsSearch={leadsSearch}
              onSearchChange={setLeadsSearch}
              leadsStatusFilter={leadsStatusFilter}
              onStatusFilterChange={setLeadsStatusFilter}
              isRefreshingLeads={isRefreshingLeads}
              onRefreshLeads={refreshLeadsFromSupabase}
              onOpenWalkInModal={() => setShowLeadModal(true)}
              settings={settings}
              onToggleWebsiteSection={handleToggleWebsiteSection}
              onUpdateLeadStatus={updateLeadStatus}
              currentUserName={currentUser?.name || 'Staff'}
              isOwner={currentUser?.role === 'owner'}
              onSaveSectionPhone={(field, nextPhone, label) =>
                handleSaveSectionPhoneDirect(field, nextPhone, label)
              }
              onLogAuditAction={logAuditAction}
              getWhatsAppLink={getWhatsAppLink}
            />
          )}

          {/* ============================================================== */}
          {/* DEDICATED LEAD DESK 1: EXCHANGE / SELL BIKE LEADS ONLY          */}
          {/* ============================================================== */}
          {activeTab === 'exchange_leads' && hasAccess('exchange_leads') && (
            <SpecializedLeadsSection
              variant="exchange_leads"
              leads={exchangeLeads}
              isRefreshingLeads={isRefreshingLeads}
              onRefreshLeads={refreshLeadsFromSupabase}
              onUpdateLeadStatus={updateLeadStatus}
              onCreateLead={handleCreateSpecializedLead}
              currentUserName={currentUser?.name || 'Staff'}
              isOwner={currentUser?.role === 'owner'}
              sectionPhone={settings.tradeInPhone || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('tradeInPhone', nextPhone, 'Sell / Exchange Valuation Desk')
              }
              onLogAuditAction={logAuditAction}
            />
          )}

          {/* ============================================================== */}
          {/* DEDICATED LEAD DESK 2: LOAN & FINANCE LEADS ONLY               */}
          {/* ============================================================== */}
          {activeTab === 'loan_leads' && hasAccess('loan_leads') && (
            <SpecializedLeadsSection
              variant="loan_leads"
              leads={loanLeads}
              isRefreshingLeads={isRefreshingLeads}
              onRefreshLeads={refreshLeadsFromSupabase}
              onUpdateLeadStatus={updateLeadStatus}
              onCreateLead={handleCreateSpecializedLead}
              currentUserName={currentUser?.name || 'Staff'}
              isOwner={currentUser?.role === 'owner'}
              sectionPhone={settings.financePhone || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('financePhone', nextPhone, 'Loan & Finance Approval Desk')
              }
              onLogAuditAction={logAuditAction}
            />
          )}

          {/* ============================================================== */}
          {/* DEDICATED LEAD DESK 3: SERVICE & WORKSHOP LEADS ONLY           */}
          {/* ============================================================== */}
          {activeTab === 'service_leads' && hasAccess('service_leads') && (
            <SpecializedLeadsSection
              variant="service_leads"
              leads={serviceLeads}
              isRefreshingLeads={isRefreshingLeads}
              onRefreshLeads={refreshLeadsFromSupabase}
              onUpdateLeadStatus={updateLeadStatus}
              onCreateLead={handleCreateSpecializedLead}
              currentUserName={currentUser?.name || 'Staff'}
              isOwner={currentUser?.role === 'owner'}
              sectionPhone={settings.servicePhone || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('servicePhone', nextPhone, 'Service & Workshop Desk')
              }
              onLogAuditAction={logAuditAction}
            />
          )}

          {/* ============================================================== */}
          {/* DEDICATED LEAD DESK 4: ACCESSORIES & RIDING GEAR LEADS ONLY    */}
          {/* ============================================================== */}
          {activeTab === 'accessories_leads' && hasAccess('accessories_leads') && (
            <SpecializedLeadsSection
              variant="accessories_leads"
              leads={accessoriesLeads}
              isRefreshingLeads={isRefreshingLeads}
              onRefreshLeads={refreshLeadsFromSupabase}
              onUpdateLeadStatus={updateLeadStatus}
              onCreateLead={handleCreateSpecializedLead}
              currentUserName={currentUser?.name || 'Staff'}
              isOwner={currentUser?.role === 'owner'}
              sectionPhone={settings.accessoriesPhone || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('accessoriesPhone', nextPhone, 'Accessories & Riding Gear Desk')
              }
              onLogAuditAction={logAuditAction}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 4: DIGITAL BILLING & INVOICES                              */}
          {/* ============================================================== */}
          {activeTab === 'billing' && hasAccess('billing') && (
            <DigitalBillingSection
              invoices={invoices}
              filteredInvoices={filteredInvoices}
              billingSearch={billingSearch}
              onBillingSearchChange={setBillingSearch}
              totalRevenue={totalRevenue}
              settings={settings}
              isOwner={currentUser?.role === 'owner'}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('billingPhone', nextPhone, 'RTO, Billing & Ownership Hub')
              }
              formatINR={formatINR}
              onToggleAllInvoicesPriceFlag={handleToggleAllInvoicesPriceFlag}
              onToggleBuyerPortal={() => handleToggleWebsiteSection('enableCustomerHub', 'Buyer Ownership Portal')}
              onOpenCustomerHub={(inv) => setShowCustomerHubModal(inv)}
              onNewDeliveryNote={() => {
                setEditingInvoice(null);
                setInvoiceFormDocs([]);
                setInvoiceHasEcharger(false);
                setInvoiceFormShowPriceView(false);
                setInvoiceFormShowPricePublic(false);
                setInvoiceFormCategory('M.Cycle');
                setShowInvoiceModal(true);
              }}
              onToggleInvoicePriceFlag={handleToggleInvoicePriceFlag}
              onPrintInvoice={(inv) => {
                setPrintInvoicePublicMode(false);
                setShowPrintInvoiceModal(inv);
                logAuditAction(
                  'billing_create',
                  'Billing',
                  `${currentUser?.name || 'Staff'} previewed delivery note #${inv.invoice_number} (${inv.reg_number})`,
                  inv.id,
                  inv.invoice_number,
                  { notes: `Customer: ${inv.customer_name}` }
                );
              }}
              onDownloadInvoice={(inv) => {
                downloadInvoice(inv);
                logAuditAction(
                  'billing_create',
                  'Billing',
                  `${currentUser?.name || 'Staff'} downloaded delivery note #${inv.invoice_number} (${inv.reg_number})`,
                  inv.id,
                  inv.invoice_number,
                  { notes: `Customer: ${inv.customer_name}` }
                );
              }}
              onEditInvoice={(inv) => {
                setEditingInvoice(inv);
                setInvoiceFormDocs(inv.documents || []);
                setInvoiceHasEcharger(Boolean(inv.has_echarger));
                setInvoiceEchargerDetails(inv.echarger_details || '7.4kW Fast Home Charging Unit (S/N: CHG-2026-904)');
                setInvoiceFormShowPriceView(Boolean(inv.show_price_view));
                setInvoiceFormShowPricePublic(Boolean(inv.show_price_public));
                setInvoiceFormCategory(inv.delivery_note?.vehicle_category || 'M.Cycle');
                setShowInvoiceModal(true);
              }}
            />
          )}

          {/* ============================================================== */}
          {/* CUSTOMER PAPER TRANSFER & PROFILE MANAGER                      */}
          {/* ============================================================== */}
          {activeTab === 'customers' && hasAccess('customers') && (
            <CustomerPaperTransferManager
              supabase={supabase}
              currentUser={currentUser}
              showToast={showToast}
              logAuditAction={logAuditAction}
              isCustomerHubVisible={Boolean(settings.enableCustomerHub)}
              onToggleCustomerHubVisibility={() =>
                handleToggleWebsiteSection('enableCustomerHub', 'Buyer Ownership Portal')
              }
              sectionPhone={settings.billingPhone || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('billingPhone', nextPhone, 'RTO, Billing & Ownership Hub')
              }
            />
          )}

          {/* ============================================================== */}
          {/* TAB 5: PAN-INDIA SHOWROOM BRANCHES                             */}
          {/* ============================================================== */}
          {activeTab === 'branches' && hasAccess('branches') && (
            <BranchManagerSection
              branches={branches}
              isLocationsVisible={Boolean(settings.enableBranchLocations)}
              onToggleLocationsVisibility={() => handleToggleWebsiteSection('enableBranchLocations', 'Showroom Locations')}
              isOwner={currentUser?.role === 'owner'}
              sectionPhone={settings.branchesPhone || settings.salesPhone}
              onSaveSectionPhone={(nextPhone) =>
                handleSaveSectionPhoneDirect('branchesPhone', nextPhone, 'Showroom Branches Desk')
              }
              onOpenBranchModal={(br) => openBranchModal(br as any)}
              onCopyPhone={(phone, branchName) => {
                navigator.clipboard.writeText(phone);
                showToast(`Copied ${branchName} phone number!`);
              }}
              onRemoveBranch={(br) => {
                setConfirmDialog({
                  title: `Remove ${br.branch_name}?`,
                  message: `Remove showroom branch "${br.branch_name}" (${br.city}) from Supabase and the Customer Website?`,
                  confirmLabel: 'Remove Branch',
                  tone: 'danger',
                  onConfirm: async () => {
                    setBranches(prev => prev.filter(item => String(item.id) !== String(br.id)));
                    let { error } = await supabase.from('branches').delete().eq('id', String(br.id));
                    if (error && !isNaN(Number(br.id))) {
                      const numRes = await supabase.from('branches').delete().eq('id', Number(br.id));
                      error = numRes.error;
                    }
                    if (error) {
                      showToast(`Removed locally — Supabase error: ${error.message}`);
                    } else {
                      showToast(`Removed ${br.branch_name} from Supabase & Website!`);
                    }
                  }
                });
              }}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 6: DYNAMIC CMS & SOCIAL SETTINGS                           */}
          {/* ============================================================== */}
          {activeTab === 'settings' && hasAccess('settings') && (
            <div className="space-y-3.5 sm:space-y-6 pb-8 max-w-7xl mx-auto w-full">
              {/* Top Executive Studio Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 p-3 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${
                      cmsAutoSyncState === 'syncing'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : cmsAutoSyncState === 'error'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                        cmsAutoSyncState === 'syncing'
                          ? 'bg-amber-500'
                          : cmsAutoSyncState === 'error'
                          ? 'bg-red-500'
                          : 'bg-emerald-500'
                      }`}></span>
                      {cmsAutoSyncState === 'syncing'
                        ? 'Syncing...'
                        : cmsAutoSyncState === 'error'
                        ? 'Retry'
                        : 'Auto-Synced Live'}
                    </span>
                    <span className="hidden sm:inline px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                      Adarsh Motors CMS
                    </span>
                    <span className="hidden sm:inline px-2.5 py-1 rounded-full text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200">
                      table: site_settings
                    </span>
                  </div>

                  <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-red-600 shrink-0" />
                    <span className="truncate">Website Control Studio</span>
                  </h2>

                  <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-2xl">
                    Every phone number, section switch, and detail edited here automatically syncs live to your Customer Website and Supabase.
                  </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-1 lg:pt-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowLiveCustomerWebsiteModal(true)}
                    className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition"
                    title="Open Connected Live Customer Storefront"
                  >
                    <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="truncate">Live Storefront</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCmsSettings()}
                    disabled={cmsSaveLoading}
                    className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {cmsSaveLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span className="truncate">Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 shrink-0" />
                        <span className="truncate">Save &amp; Publish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Segmented Pill Navigation Bar */}
              <div className="p-1 sm:p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none">
                {currentUser.role === 'owner' && (
                  <button
                    type="button"
                    onClick={() => setCmsActiveSubTab('helplines')}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                      cmsActiveSubTab === 'helplines'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Showroom Helplines</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${cmsActiveSubTab === 'helplines' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      14
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCmsActiveSubTab('social')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    cmsActiveSubTab === 'social'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Social Channels</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${cmsActiveSubTab === 'social' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    6
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCmsActiveSubTab('hero')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    cmsActiveSubTab === 'hero'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Hero Slider Studio</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${cmsActiveSubTab === 'hero' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {(settings.heroSlides || DEFAULT_HERO_SLIDES).length} Slides
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCmsActiveSubTab('banner')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    cmsActiveSubTab === 'banner'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${cmsActiveSubTab === 'banner' ? 'text-white' : 'text-amber-700'}`} />
                  <span>Promo Ticker Banner</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${settings.bannerActive ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                </button>

                <button
                  type="button"
                  onClick={() => setCmsActiveSubTab('dealership')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    cmsActiveSubTab === 'dealership'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Dealership & Hours</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCmsActiveSubTab('features')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    cmsActiveSubTab === 'features'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Feature Switches</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${cmsActiveSubTab === 'features' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    7
                  </span>
                </button>

                {hasAccess('section_controls') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('section_controls')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200 cursor-pointer"
                    title="Open Master Customer Website Section Visibility Controller"
                  >
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>Sections On/Off Controller</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      12
                    </span>
                  </button>
                )}
              </div>

              {/* ============================================================== */}
              {/* SUBTAB 1: CUSTOMER HELPLINES & DIRECT CALL NUMBERS (OWNER ONLY)*/}
              {/* ============================================================== */}
              {currentUser.role === 'owner' && cmsActiveSubTab === 'helplines' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Slim Executive Notice Bar */}
                  <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-sm">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                        <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-base font-bold text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span>Section Call + WhatsApp Helplines</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {cmsAutoSyncState === 'syncing' ? 'Syncing...' : 'Auto-Synced'}
                          </span>
                        </h4>
                        <p className="hidden sm:block text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                          Every phone number below automatically connects both <strong className="text-slate-900">Direct Calls &amp; WhatsApp</strong> for its section. Budget Bike enquiries automatically divert to the <strong className="text-teal-700">Budget Bikes number</strong>, and Superbike / Luxury enquiries divert to the <strong className="text-red-700">Superbikes number</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowLiveCustomerWebsiteModal(true)}
                        className="min-h-[38px] sm:min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-sky-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-slate-200"
                      >
                        <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">Customer Site</span>
                      </button>
                      <button
                        type="button"
                        disabled={cmsSaveLoading}
                        onClick={() => handleSaveCmsSettings()}
                        className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                      >
                        {cmsSaveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Save className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{cmsSaveLoading ? 'Saving...' : 'Save Helplines'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Section A: Primary Touchpoints */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Primary Showroom Hotline &amp; WA
                        </h3>
                      </div>
                      <span className="hidden sm:inline text-xs text-slate-600 font-mono">Header Call + WhatsApp</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* 1. Main Showroom Helpline */}
                      <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-red-200 transition-all space-y-2.5 sm:space-y-3.5 shadow-sm min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm sm:text-base font-extrabold text-slate-900">Main Showroom Sales Hotline</h4>
                              <p className="text-xs text-slate-600 mt-0.5">Website header Call + WhatsApp main desk</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 shrink-0">
                            Call + WA
                          </span>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                          <input
                            type="text"
                            value={settings.salesPhone || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, salesPhone: e.target.value }))}
                            placeholder="+91 9014540489"
                            className="flex-1 min-w-[130px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            disabled={savingPhoneField === 'salesPhone'}
                            onClick={() => handleSaveIndividualPhone('salesPhone', 'Main Showroom Sales Hotline')}
                            className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-60 ${
                              savedPhoneField === 'salesPhone'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                            }`}
                            title="Save Main Showroom Sales Hotline"
                          >
                            {savingPhoneField === 'salesPhone' ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : savedPhoneField === 'salesPhone' ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>{savingPhoneField === 'salesPhone' ? 'Saving' : savedPhoneField === 'salesPhone' ? 'Saved' : 'Save'}</span>
                          </button>
                          <a
                            href={formatTelHref(settings.salesPhone, '+919014540489')}
                            className="min-h-[42px] px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1 transition shrink-0"
                            title="Test Direct Call"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>Call</span>
                          </a>
                          <a
                            href={buildWhatsAppUrl(settings.salesPhone, settings.whatsappGreeting || 'Hello Adarsh Motors!')}
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[42px] px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1 transition shrink-0"
                            title="Test WhatsApp on this number"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>WA</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(settings.salesPhone || '+91 9014540489');
                              showToast('Copied showroom phone number!');
                            }}
                            className="min-h-[42px] p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shrink-0"
                            title="Copy Number"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 2. Official WhatsApp Desk */}
                      <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 transition-all space-y-2.5 sm:space-y-3.5 shadow-sm min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm sm:text-base font-extrabold text-slate-900">Default WhatsApp Fallback Desk</h4>
                              <p className="text-xs text-slate-600 mt-0.5">General storefront WhatsApp &amp; fallback calls</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            Call + WA
                          </span>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                          <input
                            type="text"
                            value={settings.whatsapp || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="9014540489"
                            className="flex-1 min-w-[130px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-emerald-700 font-mono placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            disabled={savingPhoneField === 'whatsapp'}
                            onClick={() => handleSaveIndividualPhone('whatsapp', 'Default WhatsApp Fallback Desk')}
                            className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-60 ${
                              savedPhoneField === 'whatsapp'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                            }`}
                            title="Save Default WhatsApp Number"
                          >
                            {savingPhoneField === 'whatsapp' ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : savedPhoneField === 'whatsapp' ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>{savingPhoneField === 'whatsapp' ? 'Saving' : savedPhoneField === 'whatsapp' ? 'Saved' : 'Save'}</span>
                          </button>
                          <a
                            href={formatTelHref(settings.whatsapp, '+919014540489')}
                            className="min-h-[42px] px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-1 transition shrink-0"
                            title="Test Direct Call"
                          >
                            <PhoneCall className="w-4 h-4 text-sky-700" />
                            <span>Call</span>
                          </a>
                          <a
                            href={buildWhatsAppUrl(settings.whatsapp, settings.whatsappGreeting || 'Hello Adarsh Motors!')}
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[42px] px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1 transition shrink-0"
                            title="Open WhatsApp Chat"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>WA</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(settings.whatsapp || '9014540489');
                              showToast('Copied WhatsApp number!');
                            }}
                            className="min-h-[42px] p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shrink-0"
                            title="Copy Number"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 3. WhatsApp Pre-filled Greeting Simulator */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 md:col-span-2 space-y-3 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                              Customer WhatsApp Welcome Greeting Template
                            </h4>
                          </div>
                          <span className="text-xs text-slate-600 font-mono">
                            Auto-filled when customer clicks WhatsApp
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <textarea
                            rows={2}
                            value={settings.whatsappGreeting || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, whatsappGreeting: e.target.value }))}
                            placeholder="Hello Adarsh Motors, I am interested in viewing certified superbikes at your Hyderabad showroom."
                            className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
                          />
                          <button
                            type="button"
                            disabled={savingPhoneField === 'whatsappGreeting'}
                            onClick={() => handleSaveIndividualPhone('whatsappGreeting', 'WhatsApp Greeting Template')}
                            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-60 ${
                              savedPhoneField === 'whatsappGreeting'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                            }`}
                          >
                            {savingPhoneField === 'whatsappGreeting' ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : savedPhoneField === 'whatsappGreeting' ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>{savingPhoneField === 'whatsappGreeting' ? 'Saving...' : savedPhoneField === 'whatsappGreeting' ? 'Saved' : 'Save Template'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Separate Contact Numbers & Visibility for EVERY Customer Website Section */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Dedicated Call + WhatsApp Numbers for Every Customer Website Section
                        </h3>
                      </div>
                      <span className="text-xs text-slate-600 font-mono">Every number connects Call + WhatsApp + Auto-Diversion</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {([
                        {
                          title: 'Superbikes & Cruisers *',
                          subtitle: 'Mandatory · Diverts Superbikes, Cruisers & Adventure enquiries',
                          field: 'superbikesPhone' as const,
                          toggleKey: 'enableInventoryFleet' as WebsiteSectionKey,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Adarsh Motors Superbikes & Cruisers Desk, I want details about your certified superbikes.',
                          accent: 'border-slate-200 hover:border-red-200',
                          iconBg: 'bg-red-50 text-red-600 border-red-200',
                          Icon: Bike,
                          mandatory: true,
                        },
                        {
                          title: 'Mid-Range, Budget Bikes & Scooters *',
                          subtitle: 'Mandatory · Diverts Mid-Range, Budget Bikes, Commuters & Scooters',
                          field: 'budgetBikesPhone' as const,
                          toggleKey: 'enableBudgetBikesSection' as WebsiteSectionKey,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Adarsh Motors Mid-Range & Budget Bikes Desk, please share available commuter, scooter & mid-range bikes.',
                          accent: 'border-slate-200 hover:border-teal-200',
                          iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
                          Icon: Bike,
                          mandatory: true,
                        },
                        {
                          title: 'Accessories & Riding Gear',
                          subtitle: 'Separate Call + WhatsApp for Accessories section',
                          field: 'accessoriesPhone' as const,
                          toggleKey: 'enableAccessoriesSection' as WebsiteSectionKey,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Adarsh Motors Accessories Desk, I want to enquire about superbike gear & parts.',
                          accent: 'border-slate-200 hover:border-amber-200',
                          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
                          Icon: PackageOpen,
                        },
                        {
                          title: 'Service, Workshop & Dyno',
                          subtitle: 'Separate Call + WhatsApp for Service section',
                          field: 'servicePhone' as const,
                          toggleKey: 'enableWorkshopBooking' as WebsiteSectionKey,
                          placeholder: '+91 9848012345',
                          waIntro: 'Hello Adarsh Motors Service & Dyno Desk, I want to book a service slot.',
                          accent: 'border-slate-200 hover:border-sky-200',
                          iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
                          Icon: Wrench,
                        },
                        {
                          title: 'Sell / Exchange Bike',
                          subtitle: 'Valuation & trade-in Call + WhatsApp number',
                          field: 'tradeInPhone' as const,
                          toggleKey: 'enableSellBike' as WebsiteSectionKey,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Adarsh Motors Trade-In Desk, I want a valuation to sell/exchange my bike.',
                          accent: 'border-slate-200 hover:border-emerald-200',
                          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                          Icon: TrendingUp,
                        },
                        {
                          title: 'VIP Test Ride Booking',
                          subtitle: 'Test ride Call + WhatsApp coordinator number',
                          field: 'testRidePhone' as const,
                          toggleKey: 'enableTestRide' as WebsiteSectionKey,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Adarsh Motors Test Ride Desk, I want to schedule a VIP test ride.',
                          accent: 'border-slate-200 hover:border-orange-200',
                          iconBg: 'bg-orange-50 text-orange-700 border-orange-200',
                          Icon: Calendar,
                        },
                        {
                          title: 'Finance & EMI Desk',
                          subtitle: 'Loan approval & EMI Call + WhatsApp desk',
                          field: 'financePhone' as const,
                          toggleKey: 'enableEmiCalculator' as WebsiteSectionKey,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Adarsh Motors Finance Desk, I want loan & EMI details.',
                          accent: 'border-slate-200 hover:border-blue-200',
                          iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
                          Icon: Calculator,
                        },
                        {
                          title: 'RTO, Billing & Ownership Hub',
                          subtitle: 'RC transfer & invoice Call + WhatsApp desk',
                          field: 'billingPhone' as const,
                          toggleKey: 'enableCustomerHub' as WebsiteSectionKey,
                          placeholder: '+91 9849112233',
                          waIntro: 'Hello Adarsh Motors RTO & Billing Desk, I want an update on RC/billing.',
                          accent: 'border-slate-200 hover:border-purple-200',
                          iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
                          Icon: Car,
                        },
                        {
                          title: 'Showroom Branches Desk',
                          subtitle: 'Locations Call + WhatsApp inquiry line',
                          field: 'branchesPhone' as const,
                          toggleKey: 'enableBranchLocations' as WebsiteSectionKey,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Adarsh Motors, I want directions & timings for your showroom branches.',
                          accent: 'border-slate-200 hover:border-rose-200',
                          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
                          Icon: MapPin,
                        },
                        {
                          title: 'VIP Riders Community',
                          subtitle: 'Sunday rides Call + WhatsApp helpline',
                          field: 'communityPhone' as const,
                          toggleKey: 'enableCommunityRides' as WebsiteSectionKey,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Adarsh Motors Riders Club, I want to join the upcoming Sunday ride.',
                          accent: 'border-slate-200 hover:border-indigo-200',
                          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
                          Icon: Users,
                        },
                        {
                          title: '24x7 Emergency RSA',
                          subtitle: 'Roadside recovery Call + WhatsApp desk',
                          field: 'rsaPhone' as const,
                          toggleKey: null,
                          placeholder: '1800-425-9999',
                          waIntro: 'URGENT: I need 24x7 Emergency Roadside Assistance from Adarsh Motors.',
                          accent: 'border-slate-200 hover:border-red-200',
                          iconBg: 'bg-red-50 text-red-600 border-red-200',
                          Icon: AlertTriangle,
                        },
                        {
                          title: 'Owner VIP Concierge',
                          subtitle: 'Direct escalation Call + WhatsApp (Pavan Kumar)',
                          field: 'ownerPhone' as const,
                          toggleKey: null,
                          placeholder: '+91 9014540489',
                          waIntro: 'Hello Pavan Kumar (Adarsh Motors VIP Concierge), I need direct assistance.',
                          accent: 'border-slate-200 hover:border-amber-200',
                          iconBg: 'bg-amber-50 text-amber-800 border-amber-200',
                          Icon: Crown,
                        },
                      ]).map((item) => {
                        const IconComp = item.Icon;
                        const currentVal = String((settings as any)[item.field] || '');
                        const effectiveNumber = currentVal || item.placeholder;
                        const isSectionOn = item.toggleKey ? Boolean(settings[item.toggleKey]) : true;
                        return (
                          <div
                            key={item.field}
                            className={`p-3 sm:p-4 rounded-2xl bg-white border ${item.accent} space-y-2.5 sm:space-y-3 shadow-sm flex flex-col justify-between min-w-0`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${item.iconBg}`}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-extrabold text-slate-900 truncate">{item.title}</h4>
                                  <p className="text-xs text-slate-600 truncate">{item.subtitle}</p>
                                </div>
                              </div>

                              {item.toggleKey ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleWebsiteSection(item.toggleKey!, item.title)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase shrink-0 border transition cursor-pointer ${
                                    isSectionOn
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                  title={`Turn ${item.title} ${isSectionOn ? 'OFF' : 'ON'} on Customer Website`}
                                >
                                  {isSectionOn ? 'ON' : 'OFF'}
                                </button>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase shrink-0 bg-slate-100 text-slate-700 border border-slate-200">
                                  24x7
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                              <input
                                type="text"
                                required={Boolean((item as any).mandatory)}
                                value={currentVal}
                                onChange={(e) =>
                                  setSettings(prev => ({ ...prev, [item.field]: e.target.value }))
                                }
                                placeholder={item.placeholder}
                                className="flex-1 min-w-[120px] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-sky-500"
                              />
                              <button
                                type="button"
                                disabled={savingPhoneField === item.field}
                                onClick={() => handleSaveIndividualPhone(item.field, item.title)}
                                className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer disabled:opacity-60 ${
                                  savedPhoneField === item.field
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                                }`}
                                title={`Save ${item.title} number`}
                              >
                                {savingPhoneField === item.field ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : savedPhoneField === item.field ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                <span>{savingPhoneField === item.field ? 'Saving' : savedPhoneField === item.field ? 'Saved' : 'Save'}</span>
                              </button>
                              <a
                                href={formatTelHref(effectiveNumber)}
                                className="min-h-[40px] p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-sky-700 hover:text-slate-900 border border-slate-200 transition shrink-0"
                                title={`Call ${item.title}: ${effectiveNumber}`}
                              >
                                <PhoneCall className="w-4 h-4" />
                              </a>
                              <a
                                href={buildWhatsAppUrl(effectiveNumber, item.waIntro)}
                                target="_blank"
                                rel="noreferrer"
                                className="min-h-[40px] p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition shrink-0"
                                title={`WhatsApp ${item.title}: ${effectiveNumber}`}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(effectiveNumber);
                                  showToast(`Copied ${item.title} number!`);
                                }}
                                className="min-h-[40px] p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shrink-0"
                                title={`Copy ${item.title} number`}
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBTAB 2: SOCIAL MEDIA CHANNELS & HANDLES                      */}
              {/* ============================================================== */}
              {cmsActiveSubTab === 'social' && (
                <SocialChannelsPanel
                  settings={settings}
                  onChangeField={(field, val) => setSettings((prev) => ({ ...prev, [field]: val }))}
                  onSaveAll={() => handleSaveCmsSettings()}
                  isSaving={cmsSaveLoading}
                  onCopyLink={(text, label) => {
                    navigator.clipboard.writeText(text);
                    showToast(`Copied ${label} link!`);
                  }}
                />
              )}

              {/* ============================================================== */}
              {/* SUBTAB 3: HERO SLIDER & FRONT PAGE BANNER MANAGER              */}
              {/* ============================================================== */}
              {cmsActiveSubTab === 'hero' && (() => {
                const slidesList =
                  Array.isArray(settings.heroSlides) && settings.heroSlides.length > 0
                    ? settings.heroSlides
                    : DEFAULT_HERO_SLIDES;
                const safeSlideIndex = Math.min(Math.max(0, activeSlideIndex), slidesList.length - 1);
                const currentSlide = slidesList[safeSlideIndex] || slidesList[0];

                const updateActiveSlide = (fields: Partial<HeroSlideItem>) => {
                  setSettings((prev) => {
                    const currentSlides =
                      Array.isArray(prev.heroSlides) && prev.heroSlides.length > 0
                        ? prev.heroSlides
                        : DEFAULT_HERO_SLIDES;
                    const idxToUpdate = Math.min(Math.max(0, safeSlideIndex), currentSlides.length - 1);
                    return {
                      ...prev,
                      heroSlides: currentSlides.map((s, idx) =>
                        idx === idxToUpdate ? { ...s, ...fields } : s
                      ),
                    };
                  });
                };

                const handleAddHeroSlide = () => {
                  setSettings((prev) => {
                    const currentSlides =
                      Array.isArray(prev.heroSlides) && prev.heroSlides.length > 0
                        ? prev.heroSlides
                        : DEFAULT_HERO_SLIDES;
                    const nextId =
                      currentSlides.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0) + 1;
                    const newSlide: HeroSlideItem = {
                      id: nextId,
                      badge: 'NEW SHOWROOM OFFER',
                      title: `SPECIAL EDITION SLIDE #${currentSlides.length + 1}`,
                      subtitle: 'Certified superbikes with 1-year warranty and instant finance approval.',
                      image: FALLBACK_SHOWROOM_IMAGE,
                      buttonText: 'Explore Fleet',
                      buttonTarget: '#inventory',
                      isActive: true,
                    };
                    setActiveSlideIndex(currentSlides.length);
                    return { ...prev, heroSlides: [...currentSlides, newSlide] };
                  });
                  showToast('Added a new Hero Slider card! Click Save to publish.');
                };

                const handleMoveSlide = (direction: -1 | 1) => {
                  const targetIdx = safeSlideIndex + direction;
                  if (targetIdx < 0 || targetIdx >= slidesList.length) return;
                  setSettings((prev) => {
                    const currentSlides = [...(prev.heroSlides || DEFAULT_HERO_SLIDES)];
                    const [moved] = currentSlides.splice(safeSlideIndex, 1);
                    currentSlides.splice(targetIdx, 0, moved);
                    return { ...prev, heroSlides: currentSlides };
                  });
                  setActiveSlideIndex(targetIdx);
                };

                const handleDeleteActiveSlide = () => {
                  if (slidesList.length <= 1) {
                    showToast('At least 1 Hero Slide must remain active.');
                    return;
                  }
                  setSettings((prev) => {
                    const currentSlides = [...(prev.heroSlides || DEFAULT_HERO_SLIDES)];
                    const filtered = currentSlides.filter((_, idx) => idx !== safeSlideIndex);
                    return {
                      ...prev,
                      heroSlides: filtered.length > 0 ? filtered : DEFAULT_HERO_SLIDES,
                    };
                  });
                  setActiveSlideIndex(Math.max(0, safeSlideIndex - 1));
                  showToast('Slide removed. Click Save & Publish to update Customer Website.');
                };

                const handleResetCurrentSlide = () => {
                  const defaultMatch = DEFAULT_HERO_SLIDES[safeSlideIndex] || DEFAULT_HERO_SLIDES[0];
                  updateActiveSlide({
                    slug: defaultMatch.slug,
                    badge: defaultMatch.badge,
                    title: defaultMatch.title,
                    subtitle: defaultMatch.subtitle,
                    description: defaultMatch.description,
                    image: defaultMatch.image,
                    buttonText: defaultMatch.buttonText,
                    ctaText: defaultMatch.ctaText,
                    secondaryText: defaultMatch.secondaryText,
                    buttonTarget: defaultMatch.buttonTarget,
                    isActive: true,
                  });
                  showToast(`Restored Slide #${safeSlideIndex + 1} to default template.`);
                };

                const isUploadedDataUrl = String(currentSlide.image || '').startsWith('data:image/');

                return (
                  <div className="space-y-6">
                    {/* Top Slide Selector Pills */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Select Front Page Slide ({slidesList.length} Customer Slides)</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-sky-700 font-mono">
                            Editing Slide #{safeSlideIndex + 1} of {slidesList.length}
                          </span>
                          <button
                            type="button"
                            onClick={handleAddHeroSlide}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Slide</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
                        {slidesList.map((slide, idx) => {
                          const isSelected = safeSlideIndex === idx;
                          return (
                            <button
                              key={`${slide.id || idx}-${idx}`}
                              type="button"
                              onClick={() => setActiveSlideIndex(idx)}
                              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 relative overflow-hidden cursor-pointer ${
                                isSelected
                                  ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 shadow-sm'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                              }`}
                            >
                              <img
                                src={normalizeLocalAssetUrl(slide.image, FALLBACK_SHOWROOM_IMAGE)}
                                alt={slide.title}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = FALLBACK_SHOWROOM_IMAGE;
                                }}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 bg-slate-100"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-black uppercase ${isSelected ? 'text-red-700' : 'text-slate-600'}`}>
                                    Slide #{idx + 1}
                                  </span>
                                  <span className={`w-2 h-2 rounded-full ${slide.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                </div>
                                <div className="text-xs font-bold text-slate-900 truncate leading-tight mt-0.5">
                                  {slide.title || 'Untitled Slide'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ACTIVE SLIDE STUDIO: Split Preview + Clean Form */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Cinema Live Mockup Preview (5 Cols) */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-sky-600" />
                            <span>Live Customer Preview</span>
                          </span>
                          <span className="text-xs text-slate-600 font-mono">16:9 Display Aspect</span>
                        </div>

                        {/* 16:9 Cinema Card */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-300/85 bg-slate-950 shadow-2xl group">
                          <img
                            src={normalizeLocalAssetUrl(currentSlide.image, FALLBACK_SHOWROOM_IMAGE)}
                            alt={currentSlide.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_SHOWROOM_IMAGE;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                          />
                          {/* Dark Luxury Vignette with High-Contrast Readable White Text */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15 p-5 flex flex-col justify-end">
                            <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 mb-1 drop-shadow">
                              {currentSlide.badge || 'ESTD 2001'}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
                              {currentSlide.title || 'Slide Headline'}
                            </h3>
                            <p className="text-xs text-slate-200 line-clamp-2 mt-1 leading-relaxed drop-shadow">
                              {currentSlide.subtitle || 'Slide description'}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-600/40 inline-block">
                                  {currentSlide.buttonText || currentSlide.ctaText || 'Explore Inventory'}
                                </span>
                                {currentSlide.secondaryText && (
                                  <span className="px-2.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-md text-white font-semibold text-xs border border-white/25 inline-block">
                                    {currentSlide.secondaryText}
                                  </span>
                                )}
                              </div>
                              {slidesList.length > 1 && (
                                <div className="flex items-center gap-1">
                                  {slidesList.map((s, idx) => (
                                    <button
                                      key={s.id || idx}
                                      type="button"
                                      onClick={() => setActiveSlideIndex(idx)}
                                      aria-label={`Preview Slide ${idx + 1}`}
                                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                        idx === safeSlideIndex ? 'w-5 bg-red-500' : 'w-1.5 bg-white/50 hover:bg-white'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Pill on top left */}
                          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/15">
                            <span className={`w-2 h-2 rounded-full ${currentSlide.isActive ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                            <span>Slide #{safeSlideIndex + 1} {currentSlide.isActive ? 'Active' : 'Hidden'}</span>
                          </div>

                          {/* Quick Prev/Next Preview Arrows */}
                          {slidesList.length > 1 && (
                            <div className="absolute top-3 right-3 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setActiveSlideIndex((safeSlideIndex - 1 + slidesList.length) % slidesList.length)}
                                className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 cursor-pointer transition"
                                title="Previous Slide"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveSlideIndex((safeSlideIndex + 1) % slidesList.length)}
                                className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 cursor-pointer transition"
                                title="Next Slide"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Quick Photo Upload & Presets */}
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                            <span>Change Slide Photo</span>
                            <label className="text-sky-700 hover:text-sky-800 cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Device Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleSlideImageUpload(file, safeSlideIndex);
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { name: 'Kawasaki', url: '/assets/aistudio/image_f4045ab9.png' },
                              { name: 'Ducati', url: '/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png' },
                              { name: 'BMW', url: '/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png' },
                              { name: 'Studio', url: '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png' },
                            ].map((p, pIdx) => {
                              const isActivePreset = currentSlide.image === p.url;
                              return (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => {
                                    updateActiveSlide({ image: p.url });
                                    showToast(`Applied ${p.name} banner to Slide #${safeSlideIndex + 1}!`);
                                  }}
                                  className={`aspect-video rounded-lg overflow-hidden border relative group transition cursor-pointer ${
                                    isActivePreset
                                      ? 'border-red-600 ring-2 ring-red-500/30'
                                      : 'border-slate-200 hover:border-red-400'
                                  }`}
                                  title={`Set wallpaper: ${p.name}`}
                                >
                                  <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition" />
                                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-xs font-bold text-white">
                                    {p.name}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Clean, Aligned Form Controls (7 Cols) */}
                      <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900">Slide #{safeSlideIndex + 1} Configuration</h4>
                            <p className="text-xs text-slate-600">Edit headline copy, call-to-action button, and destination target</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={safeSlideIndex === 0}
                              onClick={() => handleMoveSlide(-1)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 disabled:opacity-35 cursor-pointer"
                              title="Move Slide Earlier"
                            >
                              ← Move
                            </button>
                            <button
                              type="button"
                              disabled={safeSlideIndex >= slidesList.length - 1}
                              onClick={() => handleMoveSlide(1)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 disabled:opacity-35 cursor-pointer"
                              title="Move Slide Later"
                            >
                              Move →
                            </button>
                            <label className="flex items-center gap-2 cursor-pointer px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                              <span className={`text-xs font-bold ${currentSlide.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {currentSlide.isActive ? 'Live on Site' : 'Hidden'}
                              </span>
                              <input
                                type="checkbox"
                                checked={currentSlide.isActive !== false}
                                onChange={(e) => updateActiveSlide({ isActive: e.target.checked })}
                                className="w-4 h-4 rounded bg-slate-100 text-red-600 focus:ring-0 border-slate-200 cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                              Top Badge Text
                            </label>
                            <input
                              type="text"
                              value={currentSlide.badge || ''}
                              onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                              placeholder="Certified Fleet · Live Inventory"
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                              Button Label
                            </label>
                            <input
                              type="text"
                              value={currentSlide.buttonText ?? currentSlide.ctaText ?? ''}
                              onChange={(e) => updateActiveSlide({ buttonText: e.target.value, ctaText: e.target.value })}
                              placeholder="Explore Inventory"
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Main Slide Headline
                          </label>
                          <input
                            type="text"
                            value={currentSlide.title || ''}
                            onChange={(e) => updateActiveSlide({ title: e.target.value })}
                            placeholder="Pure Superbike Excellence."
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Subtitle Description
                          </label>
                          <textarea
                            rows={2}
                            value={currentSlide.subtitle ?? currentSlide.description ?? ''}
                            onChange={(e) => updateActiveSlide({ subtitle: e.target.value, description: e.target.value })}
                            placeholder="South India's premier showcase of inspected, pedigree superbikes. Clean titles, dyno-verified engines, ready for instant delivery."
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 leading-relaxed font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                              Button Destination Link
                            </label>
                            <EditableSelect
                              value={currentSlide.buttonTarget || '#inventory'}
                              onChange={(val) => updateActiveSlide({ buttonTarget: val })}
                              manualPlaceholder="Write custom link or #section..."
                              options={[
                                { value: '#inventory', label: '#inventory (Showroom Fleet)' },
                                { value: '#sell-modal', label: '#sell-modal (Sell Bike Modal)' },
                                { value: '#workshop', label: '#workshop (Dyno & Service)' },
                                { value: '#finance', label: '#finance (EMI Calculator)' },
                                { value: '#legacy', label: '#legacy (25+ Years Legacy)' },
                                { value: '#community', label: '#community (VIP Riders Club)' },
                                { value: '#locations', label: '#locations (Showroom Maps)' },
                              ]}
                              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                              Photo Image URL
                            </label>
                            {isUploadedDataUrl ? (
                              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
                                <span className="truncate">Uploaded Device Image (Compressed)</span>
                                <button
                                  type="button"
                                  onClick={() => updateActiveSlide({ image: FALLBACK_SHOWROOM_IMAGE })}
                                  className="px-2 py-1 rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 shrink-0 cursor-pointer"
                                >
                                  Reset
                                </button>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={currentSlide.image || ''}
                                onChange={(e) => updateActiveSlide({ image: e.target.value })}
                                placeholder="https://... or /assets/..."
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-sky-700 font-mono placeholder-slate-400 focus:outline-none focus:border-sky-500"
                              />
                            )}
                          </div>
                        </div>

                        {/* Slide Navigation & Action Buttons */}
                        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              disabled={safeSlideIndex === 0}
                              onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Prev</span>
                            </button>

                            <button
                              type="button"
                              disabled={safeSlideIndex >= slidesList.length - 1}
                              onClick={() => setActiveSlideIndex((prev) => Math.min(slidesList.length - 1, prev + 1))}
                              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={handleResetCurrentSlide}
                              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
                              title="Reset this slide to default copy and photo"
                            >
                              Reset Slide
                            </button>

                            {slidesList.length > 1 && (
                              <button
                                type="button"
                                onClick={handleDeleteActiveSlide}
                                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 border border-red-200 flex items-center gap-1 transition cursor-pointer"
                                title="Delete this slide"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={cmsSaveLoading}
                            onClick={() => handleSaveCmsSettings()}
                            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
                          >
                            {cmsSaveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>{cmsSaveLoading ? 'Publishing...' : `Save Slide #${safeSlideIndex + 1}`}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ============================================================== */}
              {/* SUBTAB 4: TOP ANNOUNCEMENT / PROMO TICKER BANNER               */}
              {/* ============================================================== */}
              {cmsActiveSubTab === 'banner' && (
                <div className="space-y-6">
                  {/* Live Website Top-Bar Browser Mockup */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-700" />
                        <span>Live Customer Announcement Ticker Preview</span>
                      </span>
                      <span className="text-xs text-sky-700 font-mono">Top of adarsh-motors-site.netlify.app</span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                      {/* Simulated Browser Chrome */}
                      <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                        <span className="ml-2 px-3 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-600 truncate max-w-xs">
                          https://adarsh-motors-site.netlify.app
                        </span>
                      </div>

                      {/* Announcement Bar */}
                      {settings.bannerActive ? (
                        <div className="p-3 sm:p-3.5 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="px-2.5 py-0.5 rounded bg-black/40 backdrop-blur-md text-xs font-black uppercase tracking-widest text-amber-300 border border-amber-300/30 shrink-0">
                              {settings.bannerBadge || '⚡ FESTIVE DROP'}
                            </span>
                            <p className="text-xs sm:text-sm font-bold tracking-tight truncate">
                              {settings.bannerText || '⚡ Festive Superbike Carnival: 0% Processing Fee on all BMW & Ducati models this weekend!'}
                            </p>
                          </div>

                          <span className="px-3.5 py-1.5 rounded-lg bg-black text-amber-300 text-xs font-black uppercase tracking-wider hover:bg-neutral-900 cursor-pointer shadow-sm shrink-0 flex items-center gap-1">
                            <span>{settings.bannerCtaText || 'Claim Offer'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 text-slate-600 text-xs text-center font-medium italic">
                          Announcement ticker is currently hidden on the customer website. Toggle 'Enable Announcement Ticker' below to activate.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Fast Presets */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Instant 1-Click Ticker Presets:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSettings(prev => ({
                            ...prev,
                            bannerActive: true,
                            bannerBadge: '⚡ FESTIVE CARNIVAL',
                            bannerText: 'Diwali Superbike Carnival: 0% Down-Payment & Free Exhaust Tuning on all bikes!',
                            bannerCtaText: 'Claim Festive Offer',
                            bannerCtaLink: '#inventory'
                          }));
                          showToast('Loaded Festive Carnival preset!');
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
                      >
                        <div className="text-xs font-bold text-amber-800 truncate">⚡ Festive Carnival</div>
                        <div className="text-xs text-slate-600 truncate mt-0.5">0% Down-Payment</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSettings(prev => ({
                            ...prev,
                            bannerActive: true,
                            bannerBadge: '🏁 TRACK DAY SPECIAL',
                            bannerText: 'Sunday Track Day: Complimentary Dyno Run with every full superbike service booking!',
                            bannerCtaText: 'Book Dyno Run',
                            bannerCtaLink: '#workshop'
                          }));
                          showToast('Loaded Track Day preset!');
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
                      >
                        <div className="text-xs font-bold text-sky-700 truncate">🏁 Track Day Dyno</div>
                        <div className="text-xs text-slate-600 truncate mt-0.5">Free dyno horsepower run</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSettings(prev => ({
                            ...prev,
                            bannerActive: true,
                            bannerBadge: '💰 SPOT CASH',
                            bannerText: 'Sell Your Superbike in 15 Minutes: Instant IMPS bank transfer & free doorstep evaluation!',
                            bannerCtaText: 'Get Valuation',
                            bannerCtaLink: '#sell-modal'
                          }));
                          showToast('Loaded Sell Bike preset!');
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
                      >
                        <div className="text-xs font-bold text-emerald-700 truncate">💰 Instant Valuation</div>
                        <div className="text-xs text-slate-600 truncate mt-0.5">Spot payout in 15 mins</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSettings(prev => ({
                            ...prev,
                            bannerActive: true,
                            bannerBadge: '✨ FRESH ARRIVALS',
                            bannerText: 'Just Landed: Certified 2024 Ducati Diavel V4 & Kawasaki Ninja Z900 ready in showroom!',
                            bannerCtaText: 'View Fleet',
                            bannerCtaLink: '#inventory'
                          }));
                          showToast('Loaded Fresh Arrivals preset!');
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
                      >
                        <div className="text-xs font-bold text-purple-700 truncate">✨ Fresh Arrivals</div>
                        <div className="text-xs text-slate-600 truncate mt-0.5">2024 Diavel & Ninja</div>
                      </button>
                    </div>
                  </div>

                  {/* Form Controls */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-slate-900">Top Announcement Ticker Controls</h4>
                        <p className="text-xs text-slate-600">Controls the headline banner at the very top of the customer website.</p>
                      </div>

                      <PublicVisibilityToggle
                        label="Promo Ticker Banner"
                        isVisible={Boolean(settings.bannerActive)}
                        onToggle={() => handleToggleWebsiteSection('bannerActive', 'Top Promo Ticker Banner')}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                          Ticker Badge Tag
                        </label>
                        <input
                          type="text"
                          value={settings.bannerBadge || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, bannerBadge: e.target.value }))}
                          placeholder="⚡ FESTIVE DROP"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                          Call-to-Action (CTA) Button Label
                        </label>
                        <input
                          type="text"
                          value={settings.bannerCtaText || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, bannerCtaText: e.target.value }))}
                          placeholder="Claim Offer"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                        Main Announcement Copy
                      </label>
                      <textarea
                        rows={2}
                        value={settings.bannerText || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, bannerText: e.target.value }))}
                        placeholder="Type promotional headline or announcement here..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-sans leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                          CTA Button Destination Anchor
                        </label>
                        <EditableSelect
                          value={settings.bannerCtaLink || '#inventory'}
                          onChange={(val) => setSettings(prev => ({ ...prev, bannerCtaLink: val }))}
                          manualPlaceholder="Write custom link or #section..."
                          options={[
                            { value: '#inventory', label: '#inventory (Showroom Fleet)' },
                            { value: '#sell-modal', label: '#sell-modal (Sell Bike Modal)' },
                            { value: '#finance', label: '#finance (EMI Schemes)' },
                            { value: '#workshop', label: '#workshop (Workshop Dyno)' },
                            { value: '#locations', label: '#locations (Showroom Locations)' },
                          ]}
                          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          disabled={cmsSaveLoading}
                          onClick={() => handleSaveCmsSettings()}
                          className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
                        >
                          {cmsSaveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span>{cmsSaveLoading ? 'Publishing...' : 'Publish Announcement Live'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBTAB 5: DEALERSHIP IDENTITY & OPERATING HOURS               */}
              {/* ============================================================== */}
              {cmsActiveSubTab === 'dealership' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Card 1: Brand Credentials */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-slate-900">Dealership Legal Credentials</h4>
                          <p className="text-xs text-slate-600">Legal business entity, brand statement & tagline</p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Dealership Legal Name
                          </label>
                          <input
                            type="text"
                            value={settings.dealershipName || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, dealershipName: e.target.value }))}
                            placeholder="ADARSH MOTORS DEALERSHIP PVT LTD"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Brand Tagline
                          </label>
                          <input
                            type="text"
                            value={settings.tagline || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                            placeholder="THE BIKER'S PARADISE"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-amber-800 placeholder-slate-400 focus:outline-none focus:border-red-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Dealership Legacy & Heritage Statement
                          </label>
                          <textarea
                            rows={3}
                            value={settings.subtitle || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                            placeholder="Hyderabad's Premier Certified Pre-Owned Superbike Studio & Dyno Hub since 2001."
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 leading-relaxed font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            GSTIN Tax Registration Number
                          </label>
                          <input
                            type="text"
                            value={settings.gstin || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, gstin: e.target.value }))}
                            placeholder="36AADCA1234F1Z8"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Showroom Logistics & Contact */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-slate-900">Showroom Location & Timings</h4>
                          <p className="text-xs text-slate-600">Physical address, navigation pin & opening hours</p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Flagship Showroom Physical Address
                          </label>
                          <input
                            type="text"
                            value={settings.address || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Plot 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Google Maps Direction URL
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={settings.googleMapsUrl || ''}
                              onChange={(e) => setSettings(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                              placeholder="https://maps.google.com/?q=Jubilee+Hills+Hyderabad"
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-sky-700 font-mono placeholder-slate-400 focus:outline-none focus:border-sky-500"
                            />
                            {settings.googleMapsUrl && (
                              <a
                                href={settings.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-sky-700 hover:text-slate-900 border border-slate-200 transition shrink-0"
                                title="Open Google Maps Pin"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Operating Hours (Customer Display)
                          </label>
                          <input
                            type="text"
                            value={settings.workingHours || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, workingHours: e.target.value }))}
                            placeholder="Mon - Sat: 9:30 AM - 8:30 PM | Sunday: 10:00 AM - 6:00 PM"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                            Official Customer Support Email
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              value={settings.email || ''}
                              onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="contact@adarshmotors.in"
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                            />
                            {settings.email && (
                              <a
                                href={`mailto:${settings.email}`}
                                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition shrink-0"
                                title="Send Test Email"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={cmsSaveLoading}
                      onClick={() => handleSaveCmsSettings()}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
                    >
                      {cmsSaveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{cmsSaveLoading ? 'Saving...' : 'Save Dealership & Hours'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBTAB 6: PUBLIC PORTAL FEATURE TOGGLES & FINANCE SETTINGS     */}
              {/* ============================================================== */}
              {cmsActiveSubTab === 'features' && (
                <div className="space-y-6">
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-slate-900">Public Customer Website Feature Switches</h4>
                        <p className="text-xs text-slate-600">
                          Toggle interactive portals, booking engines, and calculator parameters shown on the customer site.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={cmsSaveLoading}
                        onClick={() => handleSaveCmsSettings()}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        {cmsSaveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{cmsSaveLoading ? 'Saving...' : 'Save Feature Switches'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {/* 1. Sell Bike Feature Toggle */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-200 transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold border border-red-200">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">Sell Bike in 15 Mins</div>
                              <div className="text-xs text-slate-600">Header button & cash valuation modal</div>
                            </div>
                          </div>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${settings.enableSellBike ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {settings.enableSellBike ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer pt-2.5 border-t border-slate-200">
                          <span className="text-xs text-slate-700 font-medium">Display Sell Bike Portal</span>
                          <input
                            type="checkbox"
                            checked={settings.enableSellBike}
                            onChange={(e) => handleToggleWebsiteSection('enableSellBike', 'Exchange / Sell Bike', e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-100 text-red-600 focus:ring-0 border-slate-200 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* 2. Workshop & Dyno Booking */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-200 transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-200">
                              <Wrench className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">Workshop & Dyno Booking</div>
                              <div className="text-xs text-slate-600">Servicing, fluid flush & dyno scheduling</div>
                            </div>
                          </div>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${settings.enableWorkshopBooking ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {settings.enableWorkshopBooking ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer pt-2.5 border-t border-slate-200">
                          <span className="text-xs text-slate-700 font-medium">Display Workshop Booking</span>
                          <input
                            type="checkbox"
                            checked={settings.enableWorkshopBooking}
                            onChange={(e) => handleToggleWebsiteSection('enableWorkshopBooking', 'Workshop & Dyno Booking', e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-100 text-red-600 focus:ring-0 border-slate-200 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* 3. Test Ride Scheduler */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-200 transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-200">
                              <Bike className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">Online Test Ride Scheduler</div>
                              <div className="text-xs text-slate-600">Direct booking on vehicle inspection page</div>
                            </div>
                          </div>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${settings.enableTestRide ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {settings.enableTestRide ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer pt-2.5 border-t border-slate-200">
                          <span className="text-xs text-slate-700 font-medium">Display Test Ride Slots</span>
                          <input
                            type="checkbox"
                            checked={settings.enableTestRide}
                            onChange={(e) => handleToggleWebsiteSection('enableTestRide', 'Test Ride Booking', e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-100 text-red-600 focus:ring-0 border-slate-200 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* 4. EMI Finance Calculator */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-200 transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
                              <Calculator className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">Superbike EMI Calculator</div>
                              <div className="text-xs text-slate-600">Interactive monthly installment slider</div>
                            </div>
                          </div>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${settings.enableEmiCalculator ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {settings.enableEmiCalculator ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer pt-2.5 border-t border-slate-200">
                          <span className="text-xs text-slate-700 font-medium">Display EMI Calculator</span>
                          <input
                            type="checkbox"
                            checked={settings.enableEmiCalculator}
                            onChange={(e) => handleToggleWebsiteSection('enableEmiCalculator', 'Finance & EMI Calculator', e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-100 text-red-600 focus:ring-0 border-slate-200 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* 5. Free 1-Year RSA Promo */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-pink-200 transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center font-bold">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">1-Year RSA Promo Badge</div>
                              <div className="text-xs text-slate-600">'Free Roadside Assistance' trust badge</div>
                            </div>
                          </div>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${settings.freeRsaPromo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {settings.freeRsaPromo ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer pt-2.5 border-t border-slate-200">
                          <span className="text-xs text-slate-700 font-medium">Display RSA Badge</span>
                          <input
                            type="checkbox"
                            checked={settings.freeRsaPromo}
                            onChange={async (e) => {
                              const nextVal = e.target.checked;
                              const nextSettings: SiteSettings = { ...settings, freeRsaPromo: nextVal };
                              setSettings((prev) => ({ ...prev, freeRsaPromo: nextVal }));
                              const { ok, errorMessage } = await syncSectionVisibilityToSupabase(supabase, nextSettings);
                              showToast(ok ? `1-Year RSA Badge ${nextVal ? 'ENABLED' : 'HIDDEN'} live!` : `Saved locally — Supabase error: ${errorMessage}`);
                            }}
                            className="w-5 h-5 rounded bg-slate-100 text-red-600 focus:ring-0 border-slate-200 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* 6. Customer Hub / Garage Login */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-200 transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-200">
                              <Car className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">VIP Garage & Invoices</div>
                              <div className="text-xs text-slate-600">Buyer portal for bills & RC paperwork</div>
                            </div>
                          </div>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${settings.enableCustomerHub ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {settings.enableCustomerHub ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer pt-2.5 border-t border-slate-200">
                          <span className="text-xs text-slate-700 font-medium">Display Customer Garage</span>
                          <input
                            type="checkbox"
                            checked={settings.enableCustomerHub}
                            onChange={(e) => handleToggleWebsiteSection('enableCustomerHub', 'Buyer Ownership Portal', e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-100 text-red-600 focus:ring-0 border-slate-200 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* 7. VIP Riders Community */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">VIP Riders Community</div>
                              <div className="text-xs text-slate-600">Track days & Sunday breakfast rides club</div>
                            </div>
                          </div>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${settings.enableCommunityRides ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {settings.enableCommunityRides ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer pt-2.5 border-t border-slate-200">
                          <span className="text-xs text-slate-700 font-medium">Display Community Section</span>
                          <input
                            type="checkbox"
                            checked={settings.enableCommunityRides}
                            onChange={(e) => handleToggleWebsiteSection('enableCommunityRides', 'VIP Riders Community', e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-100 text-red-600 focus:ring-0 border-slate-200 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* EMI Loan Parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                          Default EMI Annual Interest Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.defaultEmiInterestRate || 8.5}
                          onChange={(e) => setSettings(prev => ({ ...prev, defaultEmiInterestRate: Number(e.target.value) }))}
                          placeholder="8.5"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                          Maximum Loan Tenure (Months)
                        </label>
                        <input
                          type="number"
                          value={settings.defaultMaxEmiTenureMonths || 60}
                          onChange={(e) => setSettings(prev => ({ ...prev, defaultMaxEmiTenureMonths: Number(e.target.value) }))}
                          placeholder="60"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Desktop Save Action Bar */}
              <div className="hidden sm:flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Changes are staged locally and pushed to Supabase <code className="text-sky-700 font-mono">site_settings</code> upon clicking save.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings(DEFAULT_SITE_SETTINGS);
                      showToast('Reset all CMS settings to dealership factory defaults!');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCmsSettings()}
                    disabled={cmsSaveLoading}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    {cmsSaveLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Syncing to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Publish Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Floating Mobile Sticky Save Bar (for superior mobile ergonomics) */}
              <div className="sm:hidden fixed bottom-3 inset-x-3 z-40 bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-900">CMS Ready</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLiveCustomerWebsiteModal(true)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveCmsSettings()}
                    disabled={cmsSaveLoading}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Publish</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CUSTOMER WEBSITE SECTION VISIBILITY CONTROLLER                 */}
          {/* ============================================================== */}
          {activeTab === 'section_controls' && hasAccess('section_controls') && (
            <WebsiteSectionVisibilityManager
              supabase={supabase}
              settings={settings}
              setSettings={setSettings}
              currentUser={currentUser}
              showToast={showToast}
              logAuditAction={logAuditAction}
              onOpenStorefront={() => setShowLiveCustomerWebsiteModal(true)}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 7: OWNER & WORKERS ACCESS MANAGER (OWNER ONLY)             */}
          {/* ============================================================== */}
          {activeTab === 'staff' && currentUser.role === 'owner' && (
            <OwnerAndStaffAccessSection
              ownerAccounts={ownerAccounts}
              currentUserPhone={currentUser.phone}
              staff={staff}
              otpOperatorConfig={otpOperatorConfig}
              onChangeOtpOperatorConfig={(next, toastMsg) => {
                setOtpOperatorConfig(next);
                saveOtpOperatorConfig(next);
                if (toastMsg) showToast(toastMsg);
              }}
              onSendTestOtp={async (phone, recipientName) => {
                const r = await sendPhoneOtp({
                  phone,
                  context: 'admin',
                  supabase,
                  recipientName,
                  operatorConfig: otpOperatorConfig,
                });
                showToast(r.demoCode ? `Test OTP sent to ${phone}: ${r.demoCode}` : r.message);
              }}
              onAddOwner={() => {
                setOwnerModalError('');
                setEditingOwner(null);
                setShowOwnerModal(true);
              }}
              onEditOwner={(owner) => {
                setOwnerModalError('');
                setEditingOwner(owner);
                setShowOwnerModal(true);
              }}
              onDeleteOwner={(owner) => {
                setConfirmDialog({
                  title: `Remove ${owner.name}?`,
                  message: `Revoke owner access for ${owner.name} (${owner.relation} · +91 ${owner.phone})?`,
                  confirmLabel: 'Remove Owner Access',
                  tone: 'danger',
                  onConfirm: async () => {
                    const next = ownerAccounts.filter((o) => String(o.id) !== String(owner.id));
                    await persistOwnerAccounts(
                      next,
                      `Removed Owner / Family co-owner access for ${owner.name} (+91 ${owner.phone})`,
                      owner.name
                    );
                    showToast(`Removed owner access for ${owner.name}`);
                  },
                });
              }}
              onAddWorker={() => {
                setStaffModalError('');
                setEditingStaff(null);
                setShowStaffModal(true);
              }}
              onEditWorker={(s) => {
                setStaffModalError('');
                setEditingStaff(s);
                setShowStaffModal(true);
              }}
              onDeleteWorker={(s) => {
                setConfirmDialog({
                  title: `Delete ${s.name}?`,
                  message: `Remove staff access account for ${s.name} (+91 ${s.phone})? They will no longer be able to sign in.`,
                  confirmLabel: 'Delete Account',
                  tone: 'danger',
                  onConfirm: async () => {
                    setStaff((prev) => prev.filter((item) => item.id !== s.id));
                    const { error } = await supabase.from('staff_users').delete().eq('id', s.id);
                    if (error) {
                      showToast(`Removed locally — Supabase error: ${error.message}`);
                    } else {
                      showToast('Staff account deleted from Supabase');
                    }
                  },
                });
              }}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 8: STAFF ACTIVITY & FORENSIC AUDIT TRAIL (OWNER ONLY)      */}
          {/* ============================================================== */}
          {activeTab === 'audit' && currentUser.role === 'owner' && (
            <div className="space-y-3 sm:space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Staff Activity &amp; Audit Trail</h2>
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                      Owner Only
                    </span>
                  </div>
                  <p className="hidden sm:block text-sm text-slate-600 font-medium leading-relaxed mt-1 max-w-2xl">
                    Chronological audit log tracking every worker and owner session, login timestamps, and exact modifications made across showroom inventory, CRM leads, sales invoices, and staff privileges.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <button
                    onClick={exportAuditCsv}
                    className="min-h-[38px] px-3 sm:px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      const randomStaff = staff.length > 0 ? staff : [
                        { name: 'Suresh Kumar', phone: '9876543210' },
                        { name: 'Ramesh Naidu', phone: '9849112233' }
                      ];
                      const chosen = randomStaff[Math.floor(Math.random() * randomStaff.length)];
                      const simEntry: AuditLogItem = {
                        id: 'log_' + Date.now(),
                        timestamp: new Date().toISOString(),
                        staff_name: chosen.name,
                        staff_phone: chosen.phone,
                        role: 'staff',
                        action_type: 'lead_status',
                        module: 'Leads CRM',
                        description: `Updated customer lead status to 'Contacted' for test ride enquiry`,
                        target_id: 1,
                        target_name: 'Kiran Varma (Ninja Z900)',
                        details: { field: 'status', before: 'New', after: 'Contacted', notes: 'Simulated live worker interaction on showroom floor' }
                      };
                      setAuditLogs(prev => [simEntry, ...prev]);
                      showToast(`Simulated live activity logged for ${chosen.name}!`);
                    }}
                    className="min-h-[38px] px-3 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">+ Test Event</span>
                  </button>
                </div>
              </div>

              {/* 4 Clear KPI Metrics (2x2 on Mobile, 4-across on Desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm min-w-0">
                  <div className="text-[10px] sm:text-xs font-extrabold text-slate-600 uppercase tracking-wider truncate">
                    Total Activity
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums mt-1 truncate">{auditLogs.length}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">All recorded edits &amp; logins</div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm min-w-0">
                  <div className="text-[10px] sm:text-xs font-extrabold text-sky-700 uppercase tracking-wider truncate">
                    Worker Changes
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-sky-700 font-mono tabular-nums mt-1 truncate">
                    {auditLogs.filter(l => l.role !== 'owner').length}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">Edits made by showroom staff</div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm min-w-0">
                  <div className="text-[10px] sm:text-xs font-extrabold text-amber-800 uppercase tracking-wider truncate">
                    Owner Changes
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-800 font-mono tabular-nums mt-1 truncate">
                    {auditLogs.filter(l => l.role === 'owner').length}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">Edits made by Owner</div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm min-w-0">
                  <div className="text-[10px] sm:text-xs font-extrabold text-purple-700 uppercase tracking-wider truncate">
                    Staff &amp; Owner Logins
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono tabular-nums mt-1 truncate">
                    {auditLogs.filter(l => l.action_type === 'login').length}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">Signed-in showroom sessions</div>
                </div>
              </div>

              {/* Filtering & Search Bar */}
              <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-2 sm:gap-3 items-stretch lg:items-center justify-between">
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search worker, owner, section, vehicle, or what was changed..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2">
                  <EditableSelect
                    value={auditStaffFilter}
                    onChange={(val) => setAuditStaffFilter(val || 'ALL')}
                    containerClassName="w-full sm:w-52"
                    manualPlaceholder="Type staff or owner name..."
                    options={[
                      { value: 'ALL', label: 'All Staff & Owners' },
                      ...ownerAccounts.map((o) => ({ value: o.name, label: `${o.name} (${o.relation || 'Owner'})` })),
                      ...staff.map((s) => ({ value: s.name, label: `${s.name} (Worker)` })),
                    ]}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                  />

                  <EditableSelect
                    value={auditModuleFilter}
                    onChange={(val) => setAuditModuleFilter(val || 'ALL')}
                    containerClassName="w-full sm:w-48"
                    manualPlaceholder="Type section name..."
                    options={[
                      { value: 'ALL', label: 'All Sections' },
                      { value: 'Auth', label: 'Auth & Logins' },
                      { value: 'Inventory', label: 'Inventory & Accessories' },
                      { value: 'Leads CRM', label: 'Leads CRM' },
                      { value: 'Billing', label: 'Digital Billing' },
                      { value: 'Staff Access', label: 'Staff Access' },
                      { value: 'CMS Settings', label: 'Website & CMS Settings' },
                      { value: 'Branches', label: 'Branches' },
                    ]}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* CLEAR, MOBILE & LAPTOP FRIENDLY ACTIVITY FEED */}
              <AuditActivityFeed
                logs={filteredAuditLogs}
                allLogsCount={auditLogs.length}
                roleFilter={auditRoleFilter}
                onChangeRoleFilter={setAuditRoleFilter}
                workerCount={auditLogs.filter(l => l.role !== 'owner').length}
                ownerCount={auditLogs.filter(l => l.role === 'owner').length}
                onInspectLog={(log) => {
                  setShowRawAuditJson(false);
                  setSelectedAuditLog(log);
                }}
              />
            </div>
          )}

          {/* 9. PROFIT & LOSS (P&L) FINANCIAL & MARGIN ANALYTICS TAB */}
          {activeTab === 'pnl' && hasAccess('pnl') && (
            <PnlAnalyticsSection
              bikes={bikes}
              filteredPnlBikes={filteredPnlBikes}
              pnlTotals={pnlTotals}
              pnlRechartsData={pnlRechartsData}
              pnlPieData={pnlPieData}
              PnlCustomTooltip={PnlCustomTooltip}
              settings={settings}
              onToggleEmiCalculator={() => handleToggleWebsiteSection('enableEmiCalculator', 'Finance & EMI Calculator')}
              onOpenPrintModal={() => setShowPrintPnlModal(true)}
              onExportCsv={exportPnlCsv}
              onOpenNewProcurement={() => {
                setEditingProcurementBike(null);
                setShowProcurementModal(true);
              }}
              onEditProcurement={(bike) => {
                setEditingProcurementBike(bike);
                setShowProcurementModal(true);
              }}
              onQuickMarkSold={handleQuickMarkSold}
              pnlChartMode={pnlChartMode}
              onChangeChartMode={(mode) => setPnlChartMode(mode)}
              pnlDateFilter={pnlDateFilter}
              onChangeDateFilter={(filter) => setPnlDateFilter(filter)}
              pnlSearch={pnlSearch}
              onChangeSearch={setPnlSearch}
              pnlStatusFilter={pnlStatusFilter}
              onChangeStatusFilter={(status) => setPnlStatusFilter(status)}
              pnlMarginBandFilter={pnlMarginBandFilter}
              onChangeMarginBandFilter={(band) => setPnlMarginBandFilter(band)}
              pnlCustomStart={pnlCustomStart}
              onChangeCustomStart={setPnlCustomStart}
              pnlCustomEnd={pnlCustomEnd}
              onChangeCustomEnd={setPnlCustomEnd}
            />
          )}

        </div>
      </main>

      {/* ============================================================== */}
      {/* POPUP MODALS                                                   */}
      {/* ============================================================== */}

      {/* 1. ADD / EDIT BIKE MODAL */}
      {/* 1. ADD / EDIT BIKE MODAL WITH MULTI-IMAGE GALLERY & DETAILED TECHNICAL SPECS */}
      {showBikeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 max-h-[92vh] overflow-y-auto shadow-lg my-auto animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Bike className={`w-5 h-5 ${bikeModalSegment === 'budget' ? 'text-teal-600' : 'text-red-600'}`} />
                  <span>
                    {editingBike
                      ? `Edit ${editingBike.name}`
                      : bikeModalSegment === 'budget'
                      ? 'Add New Budget / Commuter Bike'
                      : 'Add New Superbike / Luxury Vehicle'}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {bikeModalSegment === 'budget'
                    ? 'Budget Bike & Commuter specifications, pricing, gallery images, and website sync'
                    : 'Luxury & Superbike specifications, unlimited gallery images, and customer website sync'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBikeModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              key={editingBike ? `edit-${editingBike.id}` : `add-${bikeModalSegment}`}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const gallery = bikeModalAngleImages.length > 0
                  ? bikeModalAngleImages
                  : [bikeModalImage || '/assets/aistudio/image_f4045ab9.png'];
                const finalImg = bikeModalImage || gallery[0] || '/assets/aistudio/image_f4045ab9.png';
                const numPrice = Number(form.bikePrice.value) || 0;
                const formattedPrice = `₹${numPrice.toLocaleString('en-IN')}`;
                const numKm = Number(form.bikeKm.value) || 0;
                const formattedKm = numKm > 0 ? `${numKm.toLocaleString('en-IN')} km` : '0 km';
                const bikeId = editingBike ? editingBike.id : Date.now();
                const strBikeId = String(bikeId);

                const hpVal = form.bikeHp?.value?.trim() || bikeModalPower || '168 hp';
                const displacementVal = form.bikeDisplacement?.value?.trim() || bikeModalDisplacement || '1158 cc';
                const engineVal = form.bikeEngine?.value?.trim() || bikeModalEngineType || 'V4 1158 cc Granturismo';
                const accelVal = form.bikeAcceleration?.value?.trim() || bikeModalAcceleration || '3.1s';
                const fuelVal = form.bikeFuel?.value || bikeModalFuel || 'Petrol';
                const locationVal = form.bikeLocation?.value?.trim() || bikeModalLocation || 'Hyderabad – Main Showroom';
                const taglineVal = form.bikeTagline?.value?.trim() || bikeModalTagline || 'Muscular stance with superbike heart.';
                const warrantyVal = form.bikeWarranty?.value?.trim() || bikeModalWarranty || '150-Point Certified · 1-Year Engine Warranty · Verified Clean RC';
                const addonNameVal = form.bikeAddonName?.value?.trim() || bikeModalAddonName || 'Ducati Corse Riding Leather';
                const addonPriceNum = Number(form.bikeAddonPrice?.value) || bikeModalAddonPrice || 38500;

                const canonicalCategory = canonicalizeBikeCategory(
                  form.bikeCategory.value,
                  bikeModalSegment
                );

                const supabaseBikePayload: any = {
                  id: strBikeId,
                  name: form.bikeName.value.trim(),
                  brand: form.bikeBrand.value.trim(),
                  category: canonicalCategory,
                  year: Number(form.bikeYear.value) || 2026,
                  km: formattedKm,
                  price: formattedPrice,
                  price_raw: numPrice,
                  engine: engineVal,
                  hp: hpVal,
                  location: locationVal,
                  image_url: finalImg,
                  gallery_urls: gallery,
                  badge: 'VERIFIED',
                  fuel: fuelVal,
                  fuel_type: fuelVal,
                  acceleration: accelVal,
                  displacement_cc: displacementVal,
                  engine_type: engineVal,
                  max_power: hpVal,
                  tagline: taglineVal,
                  colorways: editingBike?.colorways || bikeModalColorways,
                  addon_name: addonNameVal,
                  addon_price: `₹${addonPriceNum.toLocaleString('en-IN')}`,
                  addon_gear_name: addonNameVal,
                  addon_gear_price: addonPriceNum,
                  warranty_badge: warrantyVal,
                  status: form.bikeStatus.value || 'Available'
                };

                const newBike: BikeItem = {
                  ...supabaseBikePayload,
                  id: bikeId,
                  price: numPrice,
                  km: numKm,
                  purchase_cost: editingBike?.purchase_cost,
                  repair_cost: editingBike?.repair_cost,
                  procurement_date: editingBike?.procurement_date || new Date().toISOString().split('T')[0],
                  repairs_note: editingBike?.repairs_note,
                  created_at: editingBike?.created_at || new Date().toISOString()
                };

                if (editingBike) {
                  setBikes(prev => {
                    const next = prev.map(item => String(item.id) === String(editingBike.id) ? newBike : item);
                    broadcastLiveSync('bikes', next);
                    return next;
                  });
                  logAuditAction(
                    'inventory_edit',
                    'Inventory',
                    `${currentUser?.name} updated vehicle specs for ${newBike.name} (₹${newBike.price.toLocaleString('en-IN')})`,
                    newBike.id,
                    newBike.name,
                    {
                      field: 'specs',
                      before: { price: editingBike.price, status: editingBike.status, km: editingBike.km },
                      after: { price: newBike.price, status: newBike.status, km: newBike.km },
                      notes: `Category: ${newBike.category}, HP: ${hpVal}, Engine: ${engineVal}`
                    }
                  );
                } else {
                  setBikes(prev => {
                    const next = [newBike, ...prev];
                    broadcastLiveSync('bikes', next);
                    return next;
                  });
                  logAuditAction(
                    'inventory_add',
                    'Inventory',
                    `${currentUser?.name} added new ${bikeModalSegment === 'budget' ? 'budget bike' : 'superbike'} ${newBike.name} (${newBike.brand}, ₹${newBike.price.toLocaleString('en-IN')})`,
                    newBike.id,
                    newBike.name,
                    { notes: `Category: ${newBike.category}, Year: ${newBike.year}, Power: ${hpVal}, Engine: ${engineVal}` }
                  );
                }

                setShowBikeModal(false);

                // Sync directly to Supabase 'bikes' table with schema & ID fallback
                try {
                  let activePayload: any = supabaseBikePayload;
                  let { error: syncErr } = await supabase
                    .from('bikes')
                    .upsert([activePayload], { onConflict: 'id' });

                  if (syncErr && !isNaN(Number(strBikeId))) {
                    const numPayload = { ...activePayload, id: Number(strBikeId) };
                    const retryNum = await supabase
                      .from('bikes')
                      .upsert([numPayload], { onConflict: 'id' });
                    if (!retryNum.error) {
                      syncErr = null;
                    } else {
                      syncErr = retryNum.error;
                    }
                  }

                  if (
                    syncErr &&
                    (syncErr.code === '42703' ||
                      syncErr.code === 'PGRST204' ||
                      /column|schema cache/i.test(syncErr.message || ''))
                  ) {
                    const minimalPayload = {
                      id: strBikeId,
                      name: newBike.name,
                      brand: newBike.brand,
                      category: newBike.category,
                      year: newBike.year,
                      km: formattedKm,
                      price: formattedPrice,
                      price_raw: numPrice,
                      engine: engineVal,
                      hp: hpVal,
                      location: locationVal,
                      image_url: finalImg,
                      status: newBike.status || 'Available',
                    };
                    const minimalRetry = await supabase
                      .from('bikes')
                      .upsert([minimalPayload], { onConflict: 'id' });
                    if (!minimalRetry.error) {
                      syncErr = null;
                    } else {
                      syncErr = minimalRetry.error;
                    }
                  }

                  if (syncErr) {
                    showToast(`Saved locally — Supabase sync error: ${syncErr.message}`);
                    return;
                  }
                  showToast(`Synced ${newBike.name} (${newBike.category}) to Supabase & Customer Website!`);
                } catch (err: any) {
                  showToast(`Saved locally — Network error: ${err?.message || 'Unable to reach Supabase'}`);
                }
              }}
              className="space-y-6"
            >
              {/* SECTION 1: CORE VEHICLE IDENTITY */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-red-600">
                  <Bike className="w-4 h-4" />
                  <span>1. Core Identification & Pricing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Vehicle Model Name *
                    </label>
                    <input
                      name="bikeName"
                      required
                      defaultValue={editingBike?.name}
                      placeholder={
                        bikeModalSegment === 'budget'
                          ? 'e.g. Honda Activa 6G / Bajaj Pulsar 150 / Hunter 350'
                          : 'e.g. Ducati Diavel V4 / Kawasaki Ninja Z900'
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Manufacturer / Brand *
                    </label>
                    <input
                      name="bikeBrand"
                      required
                      defaultValue={editingBike?.brand}
                      placeholder={
                        bikeModalSegment === 'budget'
                          ? 'e.g. Honda, Bajaj, TVS, Royal Enfield, Hero'
                          : 'e.g. Ducati, Kawasaki, BMW, Triumph, Yamaha'
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Category *</label>
                    <EditableSelect
                      name="bikeCategory"
                      required
                      manualPlaceholder="e.g. Activa, Moped, Custom..."
                      defaultValue={(() => {
                        if (!editingBike) {
                          return bikeModalSegment === 'budget' ? 'Mid-Range' : 'Superbikes';
                        }
                        return canonicalizeBikeCategory(editingBike.category, bikeModalSegment);
                      })()}
                      options={[
                        { value: 'Superbikes', label: 'Superbikes' },
                        { value: 'Cruisers', label: 'Cruisers' },
                        { value: 'Adventure', label: 'Adventure' },
                        { value: 'Luxury', label: 'Luxury Bikes' },
                        { value: 'Mid-Range', label: 'Mid-Range / Budget Bike' },
                        { value: 'Scooters', label: 'Scooters' },
                      ]}
                      className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Model Year</label>
                    <input
                      name="bikeYear"
                      type="number"
                      defaultValue={editingBike?.year || 2026}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">KM Driven</label>
                    <input
                      name="bikeKm"
                      type="number"
                      defaultValue={editingBike?.km ?? (bikeModalSegment === 'budget' ? 6500 : 1450)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Offer Price (₹ INR) *</label>
                    <input
                      name="bikePrice"
                      type="number"
                      required
                      defaultValue={editingBike?.price ?? (bikeModalSegment === 'budget' ? 95000 : 920000)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Inventory Status</label>
                    <EditableSelect
                      name="bikeStatus"
                      defaultValue={editingBike?.status || 'Available'}
                      manualPlaceholder="Write custom status..."
                      options={[
                        { value: 'Available', label: 'Available (In Showroom)' },
                        { value: 'Booked', label: 'Booked (Token Received)' },
                        { value: 'Sold', label: 'Sold (Delivered)' },
                        { value: 'Hidden', label: 'Hidden (Off Public Website)' },
                      ]}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Showroom Branch</label>
                    <input
                      name="bikeLocation"
                      defaultValue={editingBike?.location || bikeModalLocation || 'Hyderabad – Main Showroom'}
                      placeholder="e.g. Hyderabad – Main Showroom"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: TECHNICAL SPECIFICATIONS (BHP, ENGINE, ACCELERATION AS ON WEBSITE) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-sky-700">
                  <Gauge className="w-4 h-4" />
                  <span>2. Technical Specifications (Shown on Public Website)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-700" />
                      <span>Max Power / BHP</span>
                    </label>
                    <input
                      name="bikeHp"
                      defaultValue={editingBike?.max_power || editingBike?.hp || bikeModalPower || '168 hp'}
                      placeholder="e.g. 168 hp / 200 BHP"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-sky-600" />
                      <span>0-100 km/h Acceleration</span>
                    </label>
                    <input
                      name="bikeAcceleration"
                      defaultValue={editingBike?.acceleration || bikeModalAcceleration || '3.1s'}
                      placeholder="e.g. 3.1s"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fuel Type</span>
                    </label>
                    <EditableSelect
                      name="bikeFuel"
                      defaultValue={editingBike?.fuel_type || editingBike?.fuel || bikeModalFuel || 'Petrol'}
                      manualPlaceholder="e.g. Petrol / CNG / EV..."
                      options={[
                        { value: 'Petrol', label: 'Petrol' },
                        { value: 'Electric', label: 'Electric' },
                        { value: 'Hybrid', label: 'Hybrid' },
                      ]}
                      className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Engine Spec / Architecture
                    </label>
                    <input
                      name="bikeEngine"
                      defaultValue={editingBike?.engine_type || editingBike?.engine || bikeModalEngineType || 'V4 1158 cc Granturismo'}
                      placeholder="e.g. V4 1158 cc Granturismo / Inline-4 DOHC"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Displacement (CC)
                    </label>
                    <input
                      name="bikeDisplacement"
                      defaultValue={editingBike?.displacement_cc || bikeModalDisplacement || '1158 cc'}
                      placeholder="e.g. 1158 cc / 998 cc"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Vehicle Tagline (Featured Heading in Customer Showcase)
                  </label>
                  <input
                    name="bikeTagline"
                    defaultValue={editingBike?.tagline || bikeModalTagline || 'Muscular stance with superbike heart.'}
                    placeholder="e.g. Muscular stance with superbike heart."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Warranty &amp; Certification Badge
                    </label>
                    <input
                      name="bikeWarranty"
                      defaultValue={editingBike?.warranty_badge || bikeModalWarranty || '150-Point Certified · 1-Year Engine Warranty · Verified Clean RC'}
                      placeholder="e.g. 150-Point Certified · 1-Year Warranty"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Recommended Riding Gear Bundle &amp; Price
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        name="bikeAddonName"
                        defaultValue={editingBike?.addon_gear_name || bikeModalAddonName || 'Ducati Corse Riding Leather'}
                        placeholder="Gear Name"
                        className="flex-1 min-w-0 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                      />
                      <input
                        name="bikeAddonPrice"
                        type="number"
                        defaultValue={editingBike?.addon_gear_price || bikeModalAddonPrice || 38500}
                        placeholder="₹ Price"
                        className="w-full sm:w-28 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: UNLIMITED MULTI-IMAGE GALLERY MANAGER */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-emerald-700">
                    <ImageIcon className="w-4 h-4" />
                    <span>3. Multi-Image Gallery ({bikeModalAngleImages.length} Photos)</span>
                  </div>
                  <span className="text-xs text-slate-600">
                    Owner can add unlimited angle photos for high-impact showcase
                  </span>
                </div>

                {/* Upload Action Bar */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Plus Button / Multiple File Picker */}
                  <label className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer transition active:scale-95">
                    <Plus className="w-4 h-4" />
                    <span>+ Add More Images (Choose Files)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleMultipleImageFiles(e.target.files);
                      }}
                    />
                  </label>

                  {/* Showroom Stock Presets Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowGalleryPicker(!showGalleryPicker)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition"
                  >
                    <FolderOpen className="w-4 h-4 text-sky-600" />
                    <span>Stock Presets</span>
                  </button>

                  {bikeModalAngleImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setBikeModalAngleImages([]);
                        setBikeModalImage('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {/* Direct URL Adder */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newImageUrlInput}
                    onChange={(e) => setNewImageUrlInput(e.target.value)}
                    placeholder="Or paste an image web URL and click + Add..."
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrlInput.trim()) {
                        setBikeModalAngleImages(prev => [...prev, newImageUrlInput.trim()]);
                        if (!bikeModalImage) setBikeModalImage(newImageUrlInput.trim());
                        setNewImageUrlInput('');
                        showToast('Added photo URL to gallery!');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold transition"
                  >
                    + Add URL
                  </button>
                </div>

                {/* Stock Presets Drawer */}
                {showGalleryPicker && (
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                      <span>Quick-Add from Showroom High-Res Stock</span>
                      <button
                        type="button"
                        onClick={() => setShowGalleryPicker(false)}
                        className="text-slate-600 hover:text-slate-900 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { title: 'Diavel Red Angle 1', url: '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png' },
                        { title: 'Diavel Red Angle 2', url: '/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png' },
                        { title: 'Diavel Dark Angle 3', url: '/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png' },
                        { title: 'Kawasaki Z900 Cover', url: '/assets/aistudio/image_f4045ab9.png' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setBikeModalAngleImages(prev => [...prev, item.url]);
                            if (!bikeModalImage) setBikeModalImage(item.url);
                            showToast(`Added ${item.title}`);
                          }}
                          className="p-2 rounded-xl bg-slate-50 hover:border-red-300 border border-slate-200 text-left transition overflow-hidden group"
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-16 object-cover rounded-lg"
                          />
                          <div className="text-xs text-slate-700 font-medium truncate mt-1.5">
                            + {item.title}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded Gallery Grid */}
                {bikeModalAngleImages.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 bg-white rounded-2xl p-6 text-center text-sm text-slate-600">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <div>No photos uploaded yet. Click "+ Add More Images" above to add photos.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {bikeModalAngleImages.map((imgUrl, idx) => {
                      const isMainCover = (bikeModalImage || bikeModalAngleImages[0]) === imgUrl;
                      return (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden border transition bg-white group ${
                            isMainCover ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Angle ${idx + 1}`}
                            className="w-full h-24 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/aistudio/image_f4045ab9.png';
                            }}
                          />

                          {/* Cover badge */}
                          {isMainCover && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-amber-500 text-black text-xs font-black uppercase shadow">
                              Cover
                            </span>
                          )}

                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
                            #{idx + 1}
                          </span>

                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                            {!isMainCover && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBikeModalImage(imgUrl);
                                  showToast('Set as main cover image!');
                                }}
                                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition"
                              >
                                Set Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setBikeModalAngleImages(prev => prev.filter((_, i) => i !== idx));
                                if (bikeModalImage === imgUrl) {
                                  setBikeModalImage(bikeModalAngleImages.find((_, i) => i !== idx) || '');
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBikeModal(false)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 sm:px-7 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CUSTOMER VEHICLE SHOWCASE MODAL (MATCHING SCREENSHOTS EXACTLY) */}
      {customerPreviewBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg my-auto animate-fade-in flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-start sm:items-center justify-between gap-3 bg-white">
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-semibold italic text-red-700">
                  "{customerPreviewBike.tagline || 'Muscular stance with superbike heart.'}"
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight uppercase flex flex-wrap items-center gap-2 mt-0.5">
                  <span>{customerPreviewBike.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    {customerPreviewBike.status}
                  </span>
                </h2>
                <div className="text-xs sm:text-sm text-slate-600 font-mono mt-0.5">
                  {customerPreviewBike.brand} · {customerPreviewBike.year || 2026} · <span className="text-emerald-700 font-bold">{formatINR(customerPreviewBike.price)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const b = customerPreviewBike;
                    setCustomerPreviewBike(null);
                    openEditBikeModal(b);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Edit Specs & Photos"
                >
                  <Pencil className="w-3.5 h-3.5 text-sky-700" />
                  <span className="hidden sm:inline">Edit Specs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerPreviewBike(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Photo Showcase Carousel (Matching Screenshot 1) */}
              {(() => {
                const photos = customerPreviewBike.gallery_urls && customerPreviewBike.gallery_urls.length > 0
                  ? customerPreviewBike.gallery_urls
                  : [customerPreviewBike.image_url];
                const activeIndex = Math.min(previewAngleIndex, photos.length - 1);
                const currentPhoto = photos[activeIndex] || customerPreviewBike.image_url;

                return (
                  <div className="space-y-3">
                    {/* Carousel Header Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
                      <button
                        type="button"
                        onClick={() => setIsAutoPlayAngles(!isAutoPlayAngles)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition border ${
                          isAutoPlayAngles
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isAutoPlayAngles ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{isAutoPlayAngles ? 'Playing (Click to Pause)' : 'Paused (Click to Play)'}</span>
                      </button>

                      <span className="font-mono">
                        Swipe or use arrows to view all angles | <strong className="text-slate-900">Photo {activeIndex + 1} of {photos.length}</strong>
                      </span>
                    </div>

                    {/* Main Image Stage */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <img
                        src={normalizeLocalAssetUrl(currentPhoto, FALLBACK_SHOWROOM_IMAGE)}
                        alt={`${customerPreviewBike.name} view ${activeIndex + 1}`}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/image_f4045ab9.png';
                        }}
                      />

                      {/* Navigation Arrows */}
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewAngleIndex((activeIndex - 1 + photos.length) % photos.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition shadow-lg"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewAngleIndex((activeIndex + 1) % photos.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition shadow-lg"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {photos.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 justify-center">
                        {photos.map((pUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewAngleIndex(idx)}
                            className={`relative rounded-xl overflow-hidden w-16 h-12 shrink-0 border-2 transition ${
                              idx === activeIndex
                                ? 'border-red-600 ring-2 ring-red-200 scale-105'
                                : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={pUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Technical Specifications 6-Grid (Matching Screenshot 2) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-sky-600" />
                  <span>Technical Specifications</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
                    <Fuel className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <div className="text-base font-black text-slate-900">{customerPreviewBike.fuel_type || customerPreviewBike.fuel || 'Petrol'}</div>
                    <div className="text-xs text-slate-600 uppercase font-semibold">Fuel Type</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
                    <Calendar className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                    <div className="text-base font-black text-slate-900 font-mono">{customerPreviewBike.year || 2026}</div>
                    <div className="text-xs text-slate-600 uppercase font-semibold">Model Year</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
                    <Zap className="w-5 h-5 mx-auto text-amber-700 mb-1" />
                    <div className="text-base font-black text-slate-900 font-mono">{customerPreviewBike.max_power || customerPreviewBike.hp || '168 hp'}</div>
                    <div className="text-xs text-slate-600 uppercase font-semibold">Max Power</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
                    <Gauge className="w-5 h-5 mx-auto text-sky-600 mb-1" />
                    <div className="text-base font-black text-slate-900 font-mono truncate">
                      {customerPreviewBike.km ? (typeof customerPreviewBike.km === 'number' ? customerPreviewBike.km.toLocaleString('en-IN') + ' km' : customerPreviewBike.km) : '0 km'}
                    </div>
                    <div className="text-xs text-slate-600 uppercase font-semibold">Odometer</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
                    <Timer className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                    <div className="text-base font-black text-slate-900 font-mono">{customerPreviewBike.acceleration || '3.1s'}</div>
                    <div className="text-xs text-slate-600 uppercase font-semibold">0-100 km/h</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-center">
                    <Bike className="w-5 h-5 mx-auto text-red-600 mb-1" />
                    <div className="text-sm font-black text-slate-900 truncate" title={customerPreviewBike.engine_type || customerPreviewBike.engine || 'V4 1158 cc'}>
                      {customerPreviewBike.displacement_cc || customerPreviewBike.engine_type || 'V4 1158 cc'}
                    </div>
                    <div className="text-xs text-slate-600 uppercase font-semibold">Engine Spec</div>
                  </div>
                </div>
              </div>

              {/* 3 Certification Cards (Matching Screenshot 2) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Adarsh Certified Quality Assurances</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">150-Point Certified</div>
                      <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Comprehensive mechanical, chassis and electrical inspection completed by certified master technicians.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-sky-200 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">1-Year Engine Warranty</div>
                      <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Full showroom-backed coverage on engine block, drivetrain, and transmission with roadside assistance.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-blue-200 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Verified Clean RC</div>
                      <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                        100% genuine title, verified single ownership, no hypothecation issues, and valid comprehensive insurance.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Location:</span>
                <span className="text-xs font-semibold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {customerPreviewBike.location || 'Hyderabad – Main Showroom'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Hi, I am interested in the ${customerPreviewBike.name} (₹${customerPreviewBike.price.toLocaleString('en-IN')}) listed at Adarsh Motors.`;
                    window.open(`https://wa.me/919014540489?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerPreviewBike(null)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
                >
                  Close Showcase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RELIABLE IN-APP DELETE BIKE CONFIRMATION MODAL */}
      {bikeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-lg animate-fade-in text-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Delete {bikeToDelete.name}?
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete this vehicle? It will be immediately removed from the showroom stock, the public customer website, and the Supabase database.
            </p>

            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-mono text-slate-700 space-y-1">
              <div><strong className="text-slate-900">Model:</strong> {bikeToDelete.name}</div>
              <div><strong className="text-slate-900">Price:</strong> {formatINR(bikeToDelete.price)}</div>
              <div><strong className="text-slate-900">ID:</strong> #{bikeToDelete.id}</div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeletingBike}
                onClick={() => setBikeToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBike}
                onClick={() => executeDeleteBike(bikeToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isDeletingBike ? 'Deleting...' : 'Yes, Delete Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOG WALK-IN LEAD MODAL */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Log Walk-In / Phone Lead</h3>
              <button onClick={() => setShowLeadModal(false)} className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>


            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const tempId = `temp_${Date.now()}`;
                const leadName = form.leadName.value.trim();
                const leadPhone = form.leadPhone.value.trim();
                const leadBike = form.leadBike.value.trim();
                const leadNotes = form.leadNotes.value.trim();

                const newLead: LeadItem = {
                  id: tempId,
                  customer_name: leadName,
                  name: leadName,
                  phone: leadPhone,
                  bike_interested: leadBike,
                  bike_model: leadBike,
                  message: leadNotes,
                  notes: leadNotes,
                  status: 'New',
                  created_at: new Date().toISOString()
                };
                setLeads(prev => [newLead, ...prev]);
                logAuditAction(
                  'lead_view',
                  'Leads CRM',
                  `${currentUser?.name} logged walk-in enquiry for ${leadName} (+91 ${leadPhone})`,
                  tempId,
                  `${leadName} (${leadBike})`,
                  { notes: `Requirement: ${leadNotes || 'Showroom consultation'}` }
                );
                setShowLeadModal(false);

                try {
                  const { data, error } = await supabase
                    .from('leads')
                    .insert([{
                      type: 'Walk-in',
                      name: leadName,
                      phone: leadPhone,
                      bike_model: leadBike,
                      notes: leadNotes,
                      status: 'New'
                    }])
                    .select()
                    .single();

                  if (error) {
                    showToast(`Lead saved locally — Supabase error: ${error.message}`);
                    return;
                  }
                  if (data?.id) {
                    setLeads(prev => prev.map(item => String(item.id) === tempId ? mergeLeadDefaults(data) : item));
                  }
                  showToast(`Lead logged for ${leadName} & synced to Supabase!`);
                } catch (err: any) {
                  showToast(`Lead saved locally — Network error: ${err?.message || 'Unable to sync'}`);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Customer Full Name</label>
                <input
                  name="leadName"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Phone Number</label>
                <input
                  name="leadPhone"
                  type="tel"
                  required
                  placeholder="e.g. 9849012345"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Vehicle Interested</label>
                <input
                  name="leadBike"
                  required
                  placeholder="e.g. Kawasaki Ninja Z900 / Test Ride"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Customer Requirement</label>
                <textarea
                  name="leadNotes"
                  rows={2}
                  placeholder="e.g. Looking for finance options."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. GENERATE / EDIT DELIVERY NOTE INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-red-600" />
                  <span>
                    {editingInvoice
                      ? `Edit Delivery Note #${editingInvoice.invoice_number}`
                      : 'Create Digital Delivery Note (Adarsh Motors)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Matches official Adarsh Motors Auto Consultants Delivery Note. Price is optional &amp; hidden by default.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setEditingInvoice(null);
                }}
                className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              key={editingInvoice ? `edit-inv-${editingInvoice.id}` : 'new-inv'}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const regNum = (form.invRegNumber?.value || '').trim().toUpperCase();
                if (!regNum) {
                  showToast('Vehicle Registration Number is strictly required!');
                  return;
                }

                const noteNo =
                  (form.dnNoteNo?.value || '').trim() ||
                  editingInvoice?.invoice_number ||
                  String(4347 + invoices.length);

                const ownerName = (form.dnOwnerName?.value || form.invCustomer?.value || '').trim();
                const purchaserName = (form.invCustomer?.value || ownerName).trim();
                const nowDate = formatDeliveryDate(new Date().toISOString());
                const nowTime = formatDeliveryTime(new Date().toISOString());
                const enteredPrice = form.invPrice?.value ? Number(form.invPrice.value) || 0 : 0;

                const dnDetails: DeliveryNoteDetails = {
                  note_no: noteNo,
                  delivery_time: (form.dnTime?.value || '').trim() || nowTime,
                  delivery_date: (form.dnDate?.value || '').trim() || nowDate,
                  vehicle_category: invoiceFormCategory,
                  owner_name: ownerName,
                  owner_so: (form.dnOwnerSo?.value || '').trim(),
                  owner_ro: (form.dnOwnerRo?.value || '').trim(),
                  class_of_vehicle: (form.dnClass?.value || '').trim() || invoiceFormCategory,
                  chassis_number: (form.dnChassis?.value || '').trim().toUpperCase(),
                  engine_number: (form.dnEngine?.value || '').trim().toUpperCase(),
                  makers_name: (form.dnMakers?.value || '').trim(),
                  mfg_month_year: (form.dnMfg?.value || '').trim(),
                  body_type: (form.dnBodyType?.value || '').trim(),
                  colour: (form.dnColour?.value || '').trim(),
                  seller_name: (form.dnSellerName?.value || '').trim(),
                  seller_so: (form.dnSellerSo?.value || '').trim(),
                  seller_ro: (form.dnSellerRo?.value || '').trim(),
                  seller_phone: (form.dnSellerPhone?.value || '').trim(),
                  dealer_name: (form.dnDealerName?.value || 'Adarsh Motors').trim(),
                  dealer_ms: (form.dnDealerMs?.value || 'Adarsh Motors Auto Consultants').trim(),
                  purchaser_name: purchaserName,
                  purchaser_so: (form.dnPurchaserSo?.value || '').trim(),
                  purchaser_address: (form.dnPurchaserAddress?.value || '').trim(),
                  purchaser_time: (form.dnTime?.value || '').trim() || nowTime,
                  purchaser_date: (form.dnDate?.value || '').trim() || nowDate,
                };

                const savedInv: InvoiceItem = {
                  id: editingInvoice ? editingInvoice.id : Date.now(),
                  invoice_number: noteNo,
                  customer_name: purchaserName,
                  mobile: form.invMobile.value.trim(),
                  vehicle: form.invVehicle.value.trim(),
                  reg_number: regNum,
                  price: enteredPrice,
                  payment_mode: form.invMode?.value || 'Not Disclosed',
                  has_echarger: invoiceHasEcharger,
                  echarger_details: invoiceHasEcharger ? invoiceEchargerDetails : undefined,
                  documents: invoiceFormDocs.length > 0 ? [...invoiceFormDocs] : undefined,
                  delivery_note: dnDetails,
                  show_price_view: invoiceFormShowPriceView,
                  show_price_public: invoiceFormShowPricePublic,
                  notes: (form.invNotes?.value || '').trim(),
                  created_at: editingInvoice ? editingInvoice.created_at : new Date().toISOString(),
                };

                if (editingInvoice) {
                  setInvoices(prev => prev.map(item => (item.id === savedInv.id ? savedInv : item)));
                } else {
                  setInvoices(prev => [savedInv, ...prev]);
                }

                logAuditAction(
                  'billing_create',
                  'Billing',
                  `${currentUser?.name || 'Staff'} ${editingInvoice ? 'updated' : 'issued'} Delivery Note #${noteNo} (Reg #${regNum}) for ${savedInv.customer_name}`,
                  savedInv.id,
                  `${savedInv.customer_name} (${regNum})`,
                  {
                    notes: `Vehicle: ${savedInv.vehicle}, ViewPrice: ${invoiceFormShowPriceView ? 'ON' : 'OFF'}, PublicPrice: ${invoiceFormShowPricePublic ? 'ON' : 'OFF'}`
                  }
                );

                setShowInvoiceModal(false);
                setEditingInvoice(null);
                setInvoiceFormDocs([]);
                setInvoiceHasEcharger(false);
                setPrintInvoicePublicMode(false);
                setShowPrintInvoiceModal(savedInv);

                const res = await syncInvoiceToSupabase(savedInv);
                if (res.ok) {
                  showToast(`Delivery Note #${noteNo} synced to Supabase!`);
                } else {
                  showToast(`Delivery Note #${noteNo} saved locally — Supabase note: ${res.errorMessage}`);
                }
              }}
              className="space-y-4"
            >
              {/* Delivery Note Number, Time, Date, Category */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Delivery Note Header &amp; Vehicle Type
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Note No.</label>
                    <input
                      name="dnNoteNo"
                      defaultValue={editingInvoice?.delivery_note?.note_no || editingInvoice?.invoice_number || String(4347 + invoices.length)}
                      placeholder="e.g. 4347"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-red-700 font-mono font-bold focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Time</label>
                    <input
                      name="dnTime"
                      defaultValue={editingInvoice?.delivery_note?.delivery_time || formatDeliveryTime(new Date().toISOString())}
                      placeholder="e.g. 11:30 AM"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date</label>
                    <input
                      name="dnDate"
                      defaultValue={editingInvoice?.delivery_note?.delivery_date || formatDeliveryDate(new Date().toISOString())}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Delivery Taken Of
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['Car', 'M.Cycle', 'Scooter', 'Registered'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setInvoiceFormCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          invoiceFormCategory === cat
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Owner & Mandatory Reg No. & Model */}
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                    <FileBadge className="w-4 h-4 text-red-600" />
                    <span>Registration No. &amp; Registered Owner</span>
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white text-red-700 border border-red-200 font-bold">
                    REG # MANDATORY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-700 font-black text-xs pointer-events-none">
                      IND
                    </span>
                    <input
                      name="invRegNumber"
                      required
                      defaultValue={editingInvoice?.reg_number || ''}
                      placeholder="bearing Registration No. (e.g. TS 09 EQ 4200)"
                      className="w-full pl-12 pr-3 py-2.5 bg-white border border-red-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono uppercase tracking-widest font-black"
                    />
                  </div>
                  <div>
                    <input
                      name="invVehicle"
                      required
                      defaultValue={editingInvoice?.vehicle || ''}
                      placeholder="Model (e.g. Kawasaki Ninja Z900)"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Name</label>
                    <input
                      name="dnOwnerName"
                      defaultValue={editingInvoice?.delivery_note?.owner_name || editingInvoice?.customer_name || ''}
                      placeholder="Registered Owner Name"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">S/o.</label>
                    <input
                      name="dnOwnerSo"
                      defaultValue={editingInvoice?.delivery_note?.owner_so || ''}
                      placeholder="S/o. / D/o."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">R/o.</label>
                    <input
                      name="dnOwnerRo"
                      defaultValue={editingInvoice?.delivery_note?.owner_ro || ''}
                      placeholder="Residence / Area"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* 1-7 Technical Specs & Seller Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-700">
                    1–7 Vehicle Technical Details
                  </div>
                  <input
                    name="dnClass"
                    defaultValue={editingInvoice?.delivery_note?.class_of_vehicle || ''}
                    placeholder="1. Class of Vehicle (e.g. M.Cycle Solo)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400"
                  />
                  <input
                    name="dnChassis"
                    defaultValue={editingInvoice?.delivery_note?.chassis_number || ''}
                    placeholder="2. Chassis Number"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-mono uppercase"
                  />
                  <input
                    name="dnEngine"
                    defaultValue={editingInvoice?.delivery_note?.engine_number || ''}
                    placeholder="3. Engine Number"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-mono uppercase"
                  />
                  <input
                    name="dnMakers"
                    defaultValue={editingInvoice?.delivery_note?.makers_name || ''}
                    placeholder="4. Makers Name (e.g. Honda / Kawasaki)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="dnMfg"
                      defaultValue={editingInvoice?.delivery_note?.mfg_month_year || ''}
                      placeholder="5. Month & Year of Maf."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400"
                    />
                    <input
                      name="dnBodyType"
                      defaultValue={editingInvoice?.delivery_note?.body_type || ''}
                      placeholder="6. Type of Body"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <input
                    name="dnColour"
                    defaultValue={editingInvoice?.delivery_note?.colour || ''}
                    placeholder="7. Colour"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Seller &amp; Dealer Details
                  </div>
                  <input
                    name="dnSellerName"
                    defaultValue={editingInvoice?.delivery_note?.seller_name || ''}
                    placeholder="Seller's Name"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400"
                  />
                  <input
                    name="dnSellerSo"
                    defaultValue={editingInvoice?.delivery_note?.seller_so || ''}
                    placeholder="Seller S/o."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400"
                  />
                  <input
                    name="dnSellerRo"
                    defaultValue={editingInvoice?.delivery_note?.seller_ro || ''}
                    placeholder="Seller R/o. (Address)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400"
                  />
                  <input
                    name="dnSellerPhone"
                    defaultValue={editingInvoice?.delivery_note?.seller_phone || ''}
                    placeholder="Seller Phone"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-mono"
                  />
                  <input
                    name="dnDealerName"
                    defaultValue={editingInvoice?.delivery_note?.dealer_name || 'Adarsh Motors'}
                    placeholder="Through Dealer's Name"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400"
                  />
                  <input
                    name="dnDealerMs"
                    defaultValue={editingInvoice?.delivery_note?.dealer_ms || 'Adarsh Motors Auto Consultants'}
                    placeholder="M/s."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Purchaser's Address */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  (Purchaser&apos;s Address &amp; Contact)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Purchaser Name <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      name="invCustomer"
                      required
                      defaultValue={editingInvoice?.delivery_note?.purchaser_name || editingInvoice?.customer_name || ''}
                      placeholder="e.g. Vikram Reddy"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Purchaser S/o.</label>
                    <input
                      name="dnPurchaserSo"
                      defaultValue={editingInvoice?.delivery_note?.purchaser_so || ''}
                      placeholder="S/o. / D/o."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone No. <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      name="invMobile"
                      type="tel"
                      required
                      defaultValue={editingInvoice?.mobile || ''}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchaser Address</label>
                  <input
                    name="dnPurchaserAddress"
                    defaultValue={editingInvoice?.delivery_note?.purchaser_address || ''}
                    placeholder="Full residential address"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Price Section (Optional, Empty by Default) + View & Public Toggles */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Price Section (Optional — Hidden by Default)
                    </div>
                    <div className="text-xs text-slate-600">
                      Leave blank to keep no price on the Delivery Note. Toggle View or Public visibility anytime.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceFormShowPriceView(v => !v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        invoiceFormShowPriceView
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      View Price: {invoiceFormShowPriceView ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceFormShowPricePublic(v => !v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        invoiceFormShowPricePublic
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Public View: {invoiceFormShowPricePublic ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Price (₹ INR — Optional)
                    </label>
                    <input
                      name="invPrice"
                      type="number"
                      defaultValue={editingInvoice && editingInvoice.price > 0 ? editingInvoice.price : ''}
                      placeholder="Leave blank (No Price)"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Mode</label>
                    <EditableSelect
                      name="invMode"
                      defaultValue={editingInvoice?.payment_mode || 'Not Disclosed'}
                      manualPlaceholder="Write custom payment mode..."
                      options={[
                        { value: 'Not Disclosed', label: 'Not Disclosed (Delivery Note Only)' },
                        { value: 'UPI', label: 'UPI / GPay / PhonePe' },
                        { value: 'Bank Transfer', label: 'NEFT / RTGS Transfer' },
                        { value: 'Cash', label: 'Cash Deposit' },
                        { value: 'Finance', label: 'Vehicle Finance / Loan' },
                      ]}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* OPTIONAL: E-Charger Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={invoiceHasEcharger}
                      onChange={(e) => setInvoiceHasEcharger(e.target.checked)}
                      className="rounded bg-white text-red-600 focus:ring-0"
                    />
                    <Zap className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Include E-Charger / Home Fast Charger Unit (Optional)</span>
                  </label>
                  {invoiceHasEcharger && (
                    <span className="text-xs text-amber-800 font-mono font-bold">EV UNIT ACTIVE</span>
                  )}
                </div>
                {invoiceHasEcharger && (
                  <div>
                    <input
                      type="text"
                      value={invoiceEchargerDetails}
                      onChange={(e) => setInvoiceEchargerDetails(e.target.value)}
                      placeholder="e.g. 7.4kW Fast Home Charging Unit (S/N: CHG-2026-904) with 3-Year Warranty"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* OPTIONAL: Upload Vehicle Documents & Delivery Photos */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
                    <Upload className="w-4 h-4 text-sky-600" />
                    <span>Upload Vehicle Documents &amp; Handover Photos (Optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addSampleInvoiceDocs}
                      className="text-xs text-amber-800 hover:text-amber-900 font-semibold underline"
                    >
                      + Quick Sample Papers
                    </button>
                    <span className="text-xs px-2 py-0.5 rounded bg-white text-slate-700 font-mono border border-slate-200">
                      {invoiceFormDocs.length} attached
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-700 font-semibold mb-1">Document Type</label>
                    <EditableSelect
                      value={invoiceDocType}
                      onChange={(val) => setInvoiceDocType(val)}
                      manualPlaceholder="Write custom document type..."
                      options={[
                        { value: 'rc', label: 'Registration Certificate (RC)' },
                        { value: 'insurance', label: 'Insurance Policy' },
                        { value: 'puc', label: 'PUC Pollution Certificate' },
                        { value: 'photo', label: 'Vehicle Handover Delivery Photo' },
                        { value: 'echarger', label: 'E-Charger Bill & Warranty' },
                        { value: 'other', label: 'Other Official Document' },
                      ]}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-700 font-semibold mb-1">Pick From Laptop / Camera</label>
                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 border-dashed rounded-lg text-xs sm:text-sm text-slate-900 cursor-pointer transition">
                      <Camera className="w-4 h-4 text-sky-600" />
                      <span>Choose Multiple Files</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleInvoiceFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Attached Document Preview Pills */}
                {invoiceFormDocs.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200">
                    {invoiceFormDocs.map((doc, idx) => (
                      <div key={idx} className="relative group p-2 rounded-lg bg-white border border-slate-200 text-xs">
                        {doc.url.startsWith('data:image') || doc.url.startsWith('http') || doc.url.startsWith('/assets') || doc.url.startsWith('/public') ? (
                          <img src={normalizeLocalAssetUrl(doc.url, FALLBACK_SHOWROOM_IMAGE)} alt={doc.name} className="w-full h-14 object-cover rounded mb-1" />
                        ) : (
                          <div className="w-full h-14 flex items-center justify-center bg-slate-50 rounded mb-1 text-slate-600">
                            <FileText className="w-5 h-5 text-sky-600" />
                          </div>
                        )}
                        <div className="truncate font-semibold text-slate-900">{doc.name}</div>
                        <div className="text-xs uppercase font-bold text-red-700">{doc.type}</div>
                        <button
                          type="button"
                          onClick={() => setInvoiceFormDocs(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Delivery Remarks (Optional)</label>
                <input
                  name="invNotes"
                  defaultValue={editingInvoice?.notes || ''}
                  placeholder="e.g. R.C. Book, Transfer letters, Insurance handed over."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setEditingInvoice(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{editingInvoice ? 'Save & View Delivery Note' : 'Generate Delivery Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PRINTABLE & DOWNLOADABLE DIGITAL DELIVERY NOTE MODAL */}
      {showPrintInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-h-[94vh] flex flex-col my-auto">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-700" />
                <span>Adarsh Motors · Digital Delivery Note #{showPrintInvoiceModal.delivery_note?.note_no || showPrintInvoiceModal.invoice_number}</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {!printInvoicePublicMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleInvoicePriceFlag(showPrintInvoiceModal, 'show_price_view')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition ${
                        showPrintInvoiceModal.show_price_view
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {showPrintInvoiceModal.show_price_view ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                      <span>Price View: {showPrintInvoiceModal.show_price_view ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleInvoicePriceFlag(showPrintInvoiceModal, 'show_price_public')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition ${
                        showPrintInvoiceModal.show_price_public
                          ? 'bg-cyan-700 text-white border-cyan-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public Price: {showPrintInvoiceModal.show_price_public ? 'ON' : 'OFF'}</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => downloadInvoice(showPrintInvoiceModal, printInvoicePublicMode)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-[#1e40af] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Note</span>
                </button>

                <button
                  onClick={() => {
                    setShowPrintInvoiceModal(null);
                    setPrintInvoicePublicMode(false);
                  }}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-4">
              <DeliveryNoteSheet
                invoice={showPrintInvoiceModal}
                showPriceSection={Boolean(showPrintInvoiceModal.show_price_view)}
                isPublicView={printInvoicePublicMode}
                showPricePublic={Boolean(showPrintInvoiceModal.show_price_public)}
                formatINR={formatINR}
              />

              {/* Attached Documents Strip (Outside Printable Delivery Note Sheet) */}
              {showPrintInvoiceModal.documents && showPrintInvoiceModal.documents.length > 0 && (
                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span>Attached Vehicle Documents &amp; Handover Papers ({showPrintInvoiceModal.documents.length})</span>
                    <span className="text-xs text-slate-600 font-normal">Click to preview</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {showPrintInvoiceModal.documents.map((d, i) => (
                      <div
                        key={i}
                        onClick={() => setPreviewDocModal(d)}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition flex items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          {d.type === 'photo' ? <Camera className="w-4 h-4 text-cyan-700" /> : <FileText className="w-4 h-4 text-blue-700" />}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-900 truncate">{d.name}</div>
                          <div className="text-xs uppercase font-bold text-blue-700">{d.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD / EDIT BRANCH MODAL WITH GOOGLE MAPS PIN PICKER & AUTO URL PARSER */}
      {showBranchModal && (() => {
        const fallbackQuery = [branchForm.branch_name, branchForm.address, branchForm.city].filter(Boolean).join(', ');
        const parsedBranchLoc = parseGoogleMapsLocation(branchForm.maps_url, fallbackQuery);
        const openPickerUrl =
          parsedBranchLoc.lat !== null && parsedBranchLoc.lng !== null
            ? `https://www.google.com/maps/search/?api=1&query=${parsedBranchLoc.lat},${parsedBranchLoc.lng}`
            : branchForm.maps_url.trim().startsWith('http')
              ? branchForm.maps_url.trim()
              : fallbackQuery
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`
                : 'https://www.google.com/maps';
        const hasPreviewTarget = Boolean(branchForm.maps_url.trim() || fallbackQuery);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-lg bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <span>{editingBranch ? 'Edit Showroom & Store Location' : 'Add Showroom Branch'}</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                    Select store point on Google Maps or paste a Google Maps URL — syncs live to Customer Website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingBranch(true);
                  const branchId = editingBranch ? editingBranch.id : Date.now();
                  const timingsVal = branchForm.timings.trim() || 'Mon–Sat: 10 AM – 8 PM';
                  const statusVal = branchForm.status || editingBranch?.status || 'Active';
                  const cleanAddress = branchForm.address.trim() || parsedBranchLoc.placeLabel || '';
                  const cleanCity = branchForm.city.trim() || parsedBranchLoc.cityHint || 'Hyderabad';
                  const cleanName = branchForm.branch_name.trim();
                  const savedMapsLink =
                    branchForm.maps_url.trim() ||
                    parsedBranchLoc.normalizedUrl ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([cleanName, cleanAddress, cleanCity].filter(Boolean).join(', '))}`;

                  const newBranch: BranchItem = {
                    id: branchId,
                    city: cleanCity,
                    branch_name: cleanName,
                    address: cleanAddress,
                    timings: timingsVal,
                    phone: branchForm.phone.trim(),
                    maps_url: savedMapsLink,
                    status: statusVal
                  };

                  if (editingBranch) {
                    setBranches(prev => prev.map(item => String(item.id) === String(editingBranch.id) ? newBranch : item));
                  } else {
                    setBranches(prev => [newBranch, ...prev]);
                  }

                  // Core schema-safe payload matching live Supabase `branches` columns (id, name, city, address, timings, maps_query, phone)
                  const coreBranchPayload = {
                    id: String(newBranch.id),
                    name: newBranch.branch_name,
                    city: newBranch.city,
                    address: newBranch.address,
                    timings: timingsVal,
                    maps_query: savedMapsLink,
                    phone: newBranch.phone
                  };

                  const extendedBranchPayload = {
                    ...coreBranchPayload,
                    branch_name: newBranch.branch_name,
                    maps_url: savedMapsLink,
                    status: statusVal
                  };

                  try {
                    let { error } = await supabase
                      .from('branches')
                      .upsert([extendedBranchPayload], { onConflict: 'id' });

                    const isMissingColError =
                      error &&
                      (error.code === '42703' ||
                        error.code === 'PGRST204' ||
                        /column|schema cache/i.test(error.message || ''));

                    if (isMissingColError) {
                      const fallbackRes = await supabase
                        .from('branches')
                        .upsert([coreBranchPayload], { onConflict: 'id' });
                      error = fallbackRes.error;
                    }

                    if (error && !isNaN(Number(newBranch.id))) {
                      const numCore = { ...coreBranchPayload, id: Number(newBranch.id) };
                      const numRes = await supabase
                        .from('branches')
                        .upsert([numCore], { onConflict: 'id' });
                      error = numRes.error;
                    }

                    setShowBranchModal(false);
                    if (error) {
                      showToast(`Saved locally — Supabase branch sync error: ${error.message}`);
                    } else {
                      showToast(`Updated ${newBranch.branch_name} location in Supabase & Customer Website!`);
                    }
                  } catch (err: any) {
                    setShowBranchModal(false);
                    showToast(`Saved locally — Network error: ${err?.message || 'Unable to sync branch'}`);
                  } finally {
                    setIsSavingBranch(false);
                  }
                }}
                className="space-y-4"
              >
                {/* GOOGLE MAPS EASY LOCATION PICKER PANEL */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-sky-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4" />
                      <span>Google Maps Store Pin</span>
                    </span>
                    {parsedBranchLoc.lat !== null && parsedBranchLoc.lng !== null && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {parsedBranchLoc.lat.toFixed(5)}, {parsedBranchLoc.lng.toFixed(5)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. Tap <strong className="text-slate-900">Open in Google Maps</strong> to find &amp; select your exact store point. 2. Copy the Google Maps link &amp; paste it below to update location everywhere.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={openPickerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                    <button
                      type="button"
                      onClick={handleCaptureBranchGps}
                      disabled={isLocatingBranch}
                      className="min-h-[42px] px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-sky-700 border border-sky-200 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-60"
                    >
                      <Compass className={`w-4 h-4 shrink-0 ${isLocatingBranch ? 'animate-spin' : ''}`} />
                      <span>{isLocatingBranch ? 'Detecting GPS...' : 'Use Current GPS Pin'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Paste Google Maps URL / Coordinates / Store Query
                    </label>
                    <input
                      name="brMaps"
                      value={branchForm.maps_url}
                      onChange={(e) => handleBranchMapsInputChange(e.target.value)}
                      placeholder="https://maps.app.goo.gl/... or https://www.google.com/maps/place/..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {parsedBranchLoc.placeLabel && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-700">
                      <span className="truncate">
                        Detected: <strong>{parsedBranchLoc.placeLabel}</strong>
                      </span>
                      {branchForm.address.trim() !== parsedBranchLoc.placeLabel && (
                        <button
                          type="button"
                          onClick={() =>
                            setBranchForm(prev => ({
                              ...prev,
                              address: parsedBranchLoc.placeLabel || prev.address,
                              city: parsedBranchLoc.cityHint || prev.city
                            }))
                          }
                          className="px-2.5 py-1 rounded bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-[11px] transition shrink-0"
                        >
                          Use as Store Address
                        </button>
                      )}
                    </div>
                  )}

                  {parsedBranchLoc.isShortLink && (
                    <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                      Short Google Maps link saved. Customers tapping Directions will jump straight to this exact pin.
                    </div>
                  )}

                  {hasPreviewTarget && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <iframe
                        title="Store Location Preview"
                        src={parsedBranchLoc.embedUrl}
                        loading="lazy"
                        className="w-full h-36 border-0"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={currentUser.role !== 'owner' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">City</label>
                    <input
                      name="brCity"
                      required
                      value={branchForm.city}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Hyderabad / Bengaluru"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  {currentUser.role === 'owner' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Showroom Phone</label>
                      <input
                        name="brPhone"
                        required
                        value={branchForm.phone}
                        onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 9014540489"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Showroom Branch Name</label>
                  <input
                    name="brName"
                    required
                    value={branchForm.branch_name}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, branch_name: e.target.value }))}
                    placeholder="e.g. Adarsh Motors — S.R. Nagar Flagship"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Street Address</label>
                  <textarea
                    name="brAddress"
                    required
                    rows={2}
                    value={branchForm.address}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Shop No. C-8, Bhanu Enclave, ESI Hospital, S.R. Nagar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Opening Hours / Timings</label>
                    <input
                      name="brTimings"
                      value={branchForm.timings}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, timings: e.target.value }))}
                      placeholder="e.g. Mon–Sat: 10 AM – 8 PM"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Branch Status</label>
                    <EditableSelect
                      name="brStatus"
                      value={branchForm.status}
                      onChange={(val) => setBranchForm(prev => ({ ...prev, status: val }))}
                      manualPlaceholder="Write custom branch status..."
                      options={[
                        { value: 'Active', label: 'Active (Open)' },
                        { value: 'Coming Soon', label: 'Coming Soon' },
                        { value: 'Inactive', label: 'Hidden / Closed' },
                      ]}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBranchModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBranch}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-sm disabled:opacity-60 transition"
                  >
                    {isSavingBranch ? 'Saving Location...' : 'Save Branch Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 6. ADD / EDIT STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingStaff ? 'Edit Worker Permissions' : 'Create Worker Account'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setStaffModalError('');
                  setShowStaffModal(false);
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              key={editingStaff ? `staff-${editingStaff.id}` : 'staff-new'}
              onSubmit={async (e) => {
                e.preventDefault();
                if (isSavingStaff) return;
                setStaffModalError('');

                const form = e.target as any;
                const staffName = String(form.staffName?.value || '').trim();
                const phone10 = cleanPhone(form.staffPhone?.value || '');

                if (!staffName) {
                  setStaffModalError('Please enter the worker full name.');
                  return;
                }
                if (phone10.length !== 10) {
                  const msg = 'Please enter a valid 10-digit mobile number.';
                  setStaffModalError(msg);
                  showToast(msg);
                  return;
                }

                // Duplicate Phone Check across Workers & Owners
                const duplicateOwner = ownerAccounts.find((o) => cleanPhone(o.phone) === phone10);
                if (duplicateOwner) {
                  const msg = `Phone number +91 ${phone10} already exists for "${duplicateOwner.name}" (Owner Access). Use a different phone number.`;
                  setStaffModalError(msg);
                  showToast(msg);
                  return;
                }

                const duplicateWorkerLocal = staff.find(
                  (s) =>
                    (!editingStaff || String(s.id) !== String(editingStaff.id)) &&
                    cleanPhone(s.phone) === phone10
                );
                if (duplicateWorkerLocal) {
                  const msg = `Phone number +91 ${phone10} already exists for worker "${duplicateWorkerLocal.name}". Duplicate phone numbers are not allowed.`;
                  setStaffModalError(msg);
                  showToast(msg);
                  return;
                }

                const permissions: string[] = [];
                if (form.permOverview?.checked) permissions.push('overview');
                if (form.permInventory?.checked) permissions.push('inventory');
                if (form.permBudgetBikes?.checked) permissions.push('budget_bikes');
                if (form.permAccessories?.checked) permissions.push('accessories');
                if (form.permLeads?.checked) permissions.push('leads');
                if (form.permExchangeLeads?.checked) permissions.push('exchange_leads');
                if (form.permLoanLeads?.checked) permissions.push('loan_leads');
                if (form.permServiceLeads?.checked) permissions.push('service_leads');
                if (form.permAccessoriesLeads?.checked) permissions.push('accessories_leads');
                if (form.permBilling?.checked) permissions.push('billing');
                if (form.permCustomers?.checked) permissions.push('customers');
                if (form.permBranches?.checked) permissions.push('branches');
                if (form.permSettings?.checked) permissions.push('settings');
                if (form.permSectionControls?.checked) permissions.push('section_controls');
                if (form.permPnl?.checked) permissions.push('pnl');

                if (permissions.length === 0) {
                  const msg = 'Select at least one section so this worker has access to only their assigned area.';
                  setStaffModalError(msg);
                  showToast(msg);
                  return;
                }

                setIsSavingStaff(true);
                try {
                  // Live Supabase duplicate verification so stale tabs can't create duplicate rows
                  try {
                    const { data: liveRows } = await supabase
                      .from('staff_users')
                      .select('id, name, phone, role');
                    if (Array.isArray(liveRows)) {
                      const liveDup = liveRows.find(
                        (r: any) =>
                          (!editingStaff || String(r.id) !== String(editingStaff.id)) &&
                          cleanPhone(r.phone) === phone10
                      );
                      if (liveDup) {
                        const msg = `Phone number +91 ${phone10} already exists for "${liveDup.name}". Duplicate phone numbers are not allowed.`;
                        setStaffModalError(msg);
                        showToast(msg);
                        setIsSavingStaff(false);
                        return;
                      }
                    }
                  } catch {}

                  const tempId = editingStaff ? editingStaff.id : Date.now();
                  const newStaff: StaffItem = {
                    id: tempId,
                    name: staffName,
                    phone: phone10,
                    pin: form.staffPin?.value?.trim() || 'OTP',
                    role: 'staff',
                    permissions,
                    status: 'Active'
                  };

                  if (editingStaff) {
                    setStaff(prev => dedupeStaffByPhone(prev.map(item => item.id === editingStaff.id ? newStaff : item)));
                    logAuditAction(
                      'staff_edit',
                      'Staff Access',
                      `Owner updated OTP phone access & permissions for worker ${newStaff.name} (+91 ${newStaff.phone})`,
                      newStaff.id,
                      newStaff.name,
                      {
                        field: 'permissions',
                        before: editingStaff.permissions,
                        after: permissions,
                        notes: `Granted: ${permissions.join(', ')}`
                      }
                    );
                    setShowStaffModal(false);
                    try {
                      const { error } = await supabase
                        .from('staff_users')
                        .update({
                          name: newStaff.name,
                          phone: newStaff.phone,
                          pin: newStaff.pin,
                          permissions: newStaff.permissions,
                          status: newStaff.status
                        })
                        .eq('id', editingStaff.id);
                      if (error) {
                        showToast(`Updated locally — Supabase error: ${error.message}`);
                      } else {
                        showToast(`Updated ${newStaff.name} (+91 ${newStaff.phone}) in Supabase!`);
                      }
                    } catch (err: any) {
                      showToast(`Updated locally — Network error: ${err?.message || 'Unable to sync'}`);
                    }
                  } else {
                    setStaff(prev => dedupeStaffByPhone([...prev, newStaff]));
                    logAuditAction(
                      'staff_edit',
                      'Staff Access',
                      `Owner authorized worker ${newStaff.name} (+91 ${newStaff.phone}) for Phone + OTP login`,
                      newStaff.id,
                      newStaff.name,
                      { notes: `Assigned modules: ${permissions.join(', ')}` }
                    );
                    setShowStaffModal(false);
                    try {
                      const { data, error } = await supabase
                        .from('staff_users')
                        .insert([{
                          name: newStaff.name,
                          phone: newStaff.phone,
                          pin: newStaff.pin,
                          role: 'staff',
                          permissions: newStaff.permissions,
                          status: 'Active'
                        }])
                        .select()
                        .single();
                      if (error) {
                        showToast(`Saved locally — Supabase error: ${error.message}`);
                      } else {
                        if (data?.id) {
                          setStaff(prev => dedupeStaffByPhone(prev.map(item => item.id === tempId ? { ...newStaff, id: data.id } : item)));
                        }
                        showToast(`OTP login enabled for ${newStaff.name} (+91 ${newStaff.phone})!`);
                      }
                    } catch (err: any) {
                      showToast(`Saved locally — Network error: ${err?.message || 'Unable to sync'}`);
                    }
                  }
                } finally {
                  setIsSavingStaff(false);
                }
              }}
              className="space-y-4"
            >
              {staffModalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{staffModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Worker Full Name</label>
                <input
                  name="staffName"
                  required
                  defaultValue={editingStaff?.name}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Worker Phone Number (For OTP Login) *</label>
                  <input
                    name="staffPhone"
                    type="tel"
                    required
                    defaultValue={editingStaff?.phone}
                    onChange={() => {
                      if (staffModalError) setStaffModalError('');
                    }}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-mono ${
                      staffModalError ? 'border-red-300 focus:border-red-500' : 'border-sky-200 focus:border-sky-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Secret Note / Code (Optional)</label>
                  <input
                    name="staffPin"
                    maxLength={24}
                    defaultValue={editingStaff?.pin === 'OTP' ? '' : editingStaff?.pin}
                    placeholder="Optional (OTP login active)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Granted Modules</label>
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      name="permOverview"
                      defaultChecked={editingStaff?.permissions.includes('overview')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-slate-900 font-semibold">Overview Dashboard</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Showroom revenue metrics & financial stats (Hidden from workers by default)</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-red-50 border border-red-200 transition">
                    <input
                      type="checkbox"
                      name="permInventory"
                      defaultChecked={editingStaff?.permissions.includes('inventory')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-red-700 font-semibold">Superbikes &amp; Luxury Inventory</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Add, edit, or delete limited-stock superbikes, luxury &amp; adventure motorcycles</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-teal-50 border border-teal-200 transition">
                    <input
                      type="checkbox"
                      name="permBudgetBikes"
                      defaultChecked={editingStaff?.permissions.includes('budget_bikes')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-teal-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-teal-700 font-semibold">Budget Bikes Inventory Manager</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Add, edit, or manage commuters, scooters, mid-range &amp; budget bikes separately</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      name="permAccessories"
                      defaultChecked={editingStaff?.permissions.includes('accessories')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-slate-900 font-semibold">Superbike Gear &amp; Accessories</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Manage exhausts, helmets, riding suits &amp; storefront visibility</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      name="permLeads"
                      defaultChecked={editingStaff?.permissions.includes('leads')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-slate-900 font-semibold">Leads CRM</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Manage website buyer enquiries, test-ride bookings & WhatsApp/Calls</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-emerald-50 border border-emerald-200 transition">
                    <input
                      type="checkbox"
                      name="permExchangeLeads"
                      defaultChecked={editingStaff?.permissions.includes('exchange_leads')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-emerald-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-emerald-700 font-semibold">Exchange / Sell Bike Leads Only</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Leads-only inbox for customers selling or exchanging their bike</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-blue-50 border border-blue-200 transition">
                    <input
                      type="checkbox"
                      name="permLoanLeads"
                      defaultChecked={editingStaff?.permissions.includes('loan_leads')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-blue-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-blue-700 font-semibold">Loan &amp; Finance Leads Only</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Leads-only inbox for two-wheeler loans, EMI &amp; bank finance inquiries</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-sky-50 border border-sky-200 transition">
                    <input
                      type="checkbox"
                      name="permServiceLeads"
                      defaultChecked={editingStaff?.permissions.includes('service_leads')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-cyan-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-sky-700 font-semibold">Service &amp; Workshop Leads Only</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Leads-only inbox for bike servicing, dyno tuning &amp; workshop appointments</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-amber-50 border border-amber-200 transition">
                    <input
                      type="checkbox"
                      name="permAccessoriesLeads"
                      defaultChecked={editingStaff?.permissions.includes('accessories_leads')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-amber-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-amber-800 font-semibold">Accessories &amp; Gear Leads Only</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Leads-only inbox for exhausts, riding suits, helmets &amp; accessory orders</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      name="permBilling"
                      defaultChecked={editingStaff?.permissions.includes('billing')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-slate-900 font-semibold">Digital Billing & Invoices</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Generate tax invoices with mandatory reg # & document upload</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      name="permCustomers"
                      defaultChecked={editingStaff?.permissions.includes('customers')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-slate-900 font-semibold">RTO Paper Transfer &amp; Customer Hub</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Track Form 29/30 RC transfers, KYC records &amp; service logs</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      name="permBranches"
                      defaultChecked={editingStaff?.permissions.includes('branches')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-slate-900 font-semibold">Showrooms & Branches</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Dealership location addresses & Google Maps links</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      name="permSettings"
                      defaultChecked={editingStaff?.permissions.includes('settings')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-slate-900 font-semibold">CMS & Social Media Settings</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Top announcement banner & customer phone lines</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      name="permSectionControls"
                      defaultChecked={editingStaff?.permissions.includes('section_controls')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-sm text-slate-900 font-semibold">Website Sections ON/OFF</span>
                      <span className="text-xs text-slate-600 block mt-0.5">Enable or hide live customer storefront sections</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-emerald-100 border border-emerald-200 bg-emerald-50 transition">
                    <input
                      type="checkbox"
                      name="permPnl"
                      defaultChecked={editingStaff?.permissions.includes('pnl')}
                      className="mt-0.5 w-4 h-4 rounded bg-white text-emerald-600 focus:ring-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-sm text-emerald-700 font-bold">Profit & Loss (P&L) Financials</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200 font-mono uppercase font-bold tracking-wider">Owner Confidential</span>
                      </div>
                      <span className="text-xs text-slate-700 block mt-1">Confidential procurement purchase costs, mechanical repairs, net margins & Recharts financial analytics</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStaffModalError('');
                    setShowStaffModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStaff}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-sm disabled:opacity-60 cursor-pointer transition"
                >
                  {isSavingStaff ? 'Checking & Saving...' : 'Save Worker Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. ADD / EDIT OWNER & FAMILY CO-OWNER MODAL (OWNER ONLY) */}
      {showOwnerModal && currentUser.role === 'owner' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {editingOwner ? `Edit Owner Details · ${editingOwner.name}` : 'Add Owner / Family Co-Owner'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Grant full Owner OTP login access to Father, Brother, or Managing Partner &amp; edit personal contact profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOwnerModalError('');
                  setShowOwnerModal(false);
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              key={editingOwner ? `owner-${editingOwner.id}` : 'owner-new'}
              onSubmit={async (e) => {
                e.preventDefault();
                setOwnerModalError('');
                const form = e.target as any;
                const phone10 = cleanPhone(form.ownerPhone.value);
                if (phone10.length !== 10) {
                  const msg = 'Please enter a valid 10-digit OTP mobile number.';
                  setOwnerModalError(msg);
                  showToast(msg);
                  return;
                }

                const dupOwner = ownerAccounts.find(
                  (o) => (!editingOwner || String(o.id) !== String(editingOwner.id)) && cleanPhone(o.phone) === phone10
                );
                if (dupOwner) {
                  const msg = `Phone number +91 ${phone10} already exists for owner "${dupOwner.name}". Duplicate phone numbers are not allowed.`;
                  setOwnerModalError(msg);
                  showToast(msg);
                  return;
                }

                const dupWorker = staff.find((s) => cleanPhone(s.phone) === phone10);
                if (dupWorker) {
                  const msg = `Phone number +91 ${phone10} already exists for worker "${dupWorker.name}". Remove or change that number first.`;
                  setOwnerModalError(msg);
                  showToast(msg);
                  return;
                }

                const nextOwner: OwnerAccount = {
                  id: editingOwner ? editingOwner.id : `owner_${Date.now()}`,
                  name: form.ownerName.value.trim(),
                  phone: phone10,
                  relation: form.ownerRelation.value.trim() || 'Family Co-Owner',
                  email: form.ownerEmail?.value?.trim() || '',
                  altPhone: form.ownerAltPhone?.value?.trim() || '',
                  address: form.ownerAddress?.value?.trim() || '',
                  personalNotes: form.ownerNotes?.value?.trim() || '',
                  status: (form.ownerStatus?.value === 'Inactive' ? 'Inactive' : 'Active'),
                  isPrimary: editingOwner ? Boolean(editingOwner.isPrimary) : false,
                };

                const nextList = editingOwner
                  ? ownerAccounts.map((o) => (String(o.id) === String(editingOwner.id) ? nextOwner : o))
                  : [...ownerAccounts, nextOwner];

                setShowOwnerModal(false);
                await persistOwnerAccounts(
                  nextList,
                  editingOwner
                    ? `Updated Owner profile & contact details for ${nextOwner.name} (${nextOwner.relation} · +91 ${nextOwner.phone})`
                    : `Granted Owner OTP access to ${nextOwner.name} (${nextOwner.relation} · +91 ${nextOwner.phone})`,
                  nextOwner.name,
                  { phone: nextOwner.phone, relation: nextOwner.relation, status: nextOwner.status }
                );
                showToast(
                  editingOwner
                    ? `Updated Owner profile for ${nextOwner.name}!`
                    : `Owner OTP access enabled for ${nextOwner.name} (+91 ${nextOwner.phone})!`
                );
              }}
              className="space-y-4"
            >
              {ownerModalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{ownerModalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Owner / Family Member Name *
                  </label>
                  <input
                    name="ownerName"
                    required
                    defaultValue={editingOwner?.name || ''}
                    placeholder="e.g. Father / Brother Name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Role / Family Relation *
                  </label>
                  <EditableSelect
                    name="ownerRelation"
                    required
                    defaultValue={editingOwner?.relation || 'Brother (Co-Owner)'}
                    manualPlaceholder="Write relation (e.g. Uncle, Partner)..."
                    options={[
                      { value: 'Primary Owner', label: 'Primary Owner' },
                      { value: 'Father (Co-Owner)', label: 'Father (Co-Owner)' },
                      { value: 'Brother (Co-Owner)', label: 'Brother (Co-Owner)' },
                      { value: 'Mother (Co-Owner)', label: 'Mother (Co-Owner)' },
                      { value: 'Managing Partner', label: 'Managing Partner' },
                    ]}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    OTP Login Mobile Number *
                  </label>
                  <input
                    name="ownerPhone"
                    type="tel"
                    required
                    defaultValue={editingOwner?.phone || ''}
                    onChange={() => {
                      if (ownerModalError) setOwnerModalError('');
                    }}
                    placeholder="e.g. 9014540489"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-mono ${
                      ownerModalError ? 'border-red-300 focus:border-red-500' : 'border-amber-300 focus:border-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Alternate / WhatsApp Contact
                  </label>
                  <input
                    name="ownerAltPhone"
                    type="tel"
                    defaultValue={editingOwner?.altPhone || ''}
                    placeholder="e.g. +91 98480..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Personal / Business Email
                  </label>
                  <input
                    name="ownerEmail"
                    type="email"
                    defaultValue={editingOwner?.email || ''}
                    placeholder="e.g. owner@adarshmotors.in"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Account Status
                  </label>
                  <EditableSelect
                    name="ownerStatus"
                    defaultValue={editingOwner?.status || 'Active'}
                    manualPlaceholder="Active / Inactive"
                    options={[
                      { value: 'Active', label: 'Active (Full Owner OTP)' },
                      { value: 'Inactive', label: 'Inactive (Paused)' },
                    ]}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Personal / Showroom Office Address
                </label>
                <input
                  name="ownerAddress"
                  defaultValue={editingOwner?.address || ''}
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Personal Notes / Authority Designation
                </label>
                <textarea
                  name="ownerNotes"
                  rows={2}
                  defaultValue={editingOwner?.personalNotes || ''}
                  placeholder="e.g. Managing Director / Co-Owner emergency & finance approval"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOwnerModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer transition"
                >
                  {editingOwner ? 'Save Owner Details' : 'Grant Owner Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. CUSTOMER VEHICLE OWNERSHIP & DOCUMENTS HUB MODAL */}
      {showCustomerHubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <Car className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Customer Vehicle & Ownership Hub</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Live view for vehicle owner: {showCustomerHubModal.customer_name}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCustomerHubModal(null)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vehicle Main Profile Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Ownership
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-2">{showCustomerHubModal.vehicle}</h4>
                <div className="text-xs sm:text-sm text-slate-700 font-mono mt-1">
                  Owner: <span className="text-slate-900 font-bold">{showCustomerHubModal.customer_name}</span> (+91 {showCustomerHubModal.mobile})
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Invoice Ref: <span className="font-mono text-red-600 font-semibold">{showCustomerHubModal.invoice_number}</span> · Purchased: {new Date(showCustomerHubModal.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-red-200 text-red-700 font-mono font-black text-sm uppercase tracking-wider shadow-sm">
                  <span className="text-xs text-blue-700 font-black">IND</span>
                  <span>{showCustomerHubModal.reg_number}</span>
                </div>
                <div className="text-xs sm:text-sm font-mono font-bold mt-2">
                  {Boolean(showCustomerHubModal.show_price_public) && Number(showCustomerHubModal.price || 0) > 0 ? (
                    <span className="text-emerald-600">Price: {formatINR(showCustomerHubModal.price)}</span>
                  ) : (
                    <span className="text-slate-500">Price: Hidden on Public View</span>
                  )}
                </div>
              </div>
            </div>

            {/* E-Charger Specs Card if present */}
            {showCustomerHubModal.has_echarger && (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                  <Zap className="w-4 h-4 text-amber-700" />
                  <span>EV FAST CHARGER & HOME UNIT BUNDLE</span>
                </div>
                <div className="text-xs text-amber-800 font-mono mt-1">
                  {showCustomerHubModal.echarger_details || '7.4kW Fast Home Charging Unit with 3-Year Official Warranty'}
                </div>
              </div>
            )}

            {/* Attached Documents & Handover Photos Section */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Verified Vehicle Documents & Delivery Photos ({showCustomerHubModal.documents?.length || 0})</span>
                </div>

                {/* Staff add document trigger */}
                <label className="text-xs text-sky-700 hover:text-sky-800 font-semibold cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 border border-sky-200 transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document / Photo</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const newDoc: InvoiceDoc = {
                          id: 'doc_' + Date.now(),
                          name: file.name,
                          url: event.target?.result as string,
                          type: 'photo',
                          size: (file.size / 1024).toFixed(1) + ' KB'
                        };
                        const updatedInv = {
                          ...showCustomerHubModal,
                          documents: [...(showCustomerHubModal.documents || []), newDoc]
                        };
                        setInvoices(prev => prev.map(inv => inv.id === updatedInv.id ? updatedInv : inv));
                        setShowCustomerHubModal(updatedInv);
                        const res = await syncInvoiceToSupabase(updatedInv);
                        if (!res.ok) {
                          showToast(`Attached locally — Supabase sync error: ${res.errorMessage}`);
                        } else {
                          showToast(`Attached ${file.name} & synced to Buyer Portal!`);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {showCustomerHubModal.documents && showCustomerHubModal.documents.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {showCustomerHubModal.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewDocModal(doc)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-red-300 cursor-pointer transition flex flex-col justify-between group"
                    >
                      {doc.url.startsWith('data:image') || doc.url.startsWith('http') || doc.url.startsWith('/assets') || doc.url.startsWith('/public') ? (
                        <div className="relative overflow-hidden rounded-lg mb-2 h-20 bg-slate-100">
                          <img src={normalizeLocalAssetUrl(doc.url, FALLBACK_SHOWROOM_IMAGE)} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 flex items-center justify-center bg-slate-50 rounded-lg mb-2">
                          <FileText className="w-7 h-7 text-sky-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{doc.name}</div>
                        <div className="flex items-center justify-between text-xs mt-1 text-slate-600">
                          <span className="uppercase text-red-600 font-bold">{doc.type}</span>
                          <span>{doc.size || 'Verified'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs sm:text-sm text-slate-600">
                  No documents attached yet. Staff can click "+ Add Document / Photo" to upload RC papers or handover ceremony images.
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintInvoicePublicMode(true);
                    setShowPrintInvoiceModal(showCustomerHubModal);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>View / Print Delivery Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadInvoice(showCustomerHubModal, true)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-sky-700 border border-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Delivery Note</span>
                </button>
              </div>

              <a
                href={getWhatsAppLink(showCustomerHubModal.mobile, showCustomerHubModal.customer_name, showCustomerHubModal.vehicle)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Customer Support</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 9. DOCUMENT / IMAGE HIGH-RES PREVIEW MODAL */}
      {previewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-lg flex flex-col my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-sm sm:text-base font-bold text-slate-900 truncate">{previewDocModal.name}</span>
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  {previewDocModal.type}
                </span>
              </div>
              <button onClick={() => setPreviewDocModal(null)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden min-h-[300px] max-h-[70vh] p-2">
              {previewDocModal.url.startsWith('data:image') || previewDocModal.url.startsWith('http') || previewDocModal.url.startsWith('/assets') || previewDocModal.url.startsWith('/public') ? (
                <img
                  src={normalizeLocalAssetUrl(previewDocModal.url, FALLBACK_SHOWROOM_IMAGE)}
                  alt={previewDocModal.name}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-16 h-16 text-sky-600 mx-auto" />
                  <div className="text-sm text-slate-900 font-semibold">{previewDocModal.name}</div>
                  <div className="text-xs text-slate-600">PDF / Verified Document Object</div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-600">{previewDocModal.size || 'Verified Showroom Paper'}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocModal.url}
                  download={previewDocModal.name}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </a>
                <button
                  onClick={() => setPreviewDocModal(null)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. STAFF & OWNER ACTIVITY DETAIL MODAL */}
      {selectedAuditLog && (() => {
        const extracted = extractReadableAuditChanges(selectedAuditLog);
        const badge = formatActionBadge(selectedAuditLog.action_type);
        const isOwner = selectedAuditLog.role === 'owner';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-lg flex flex-col my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Full Activity &amp; Change Details
                    </h3>
                    <p className="text-xs text-slate-600 font-mono">
                      {new Date(selectedAuditLog.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(selectedAuditLog.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })}{' '}
                      IST
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAuditLog(null)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                {/* Who Did It + Which Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isOwner ? 'bg-amber-50 border-amber-200' : 'bg-sky-50 border-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        Who Made This Change
                      </span>
                      <span
                        className={`text-[11px] font-black uppercase px-2 py-0.5 rounded border ${
                          isOwner
                            ? 'bg-white text-amber-800 border-amber-200'
                            : 'bg-white text-sky-700 border-sky-200'
                        }`}
                      >
                        {isOwner ? 'Owner' : 'Worker'}
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                      {isOwner ? (
                        <Crown className="w-4 h-4 text-amber-700 shrink-0" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
                      )}
                      <span>{selectedAuditLog.staff_name}</span>
                    </div>
                    <div className="text-xs text-slate-700 font-mono">
                      Phone: +91 {selectedAuditLog.staff_phone}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      Section &amp; Action
                    </div>
                    <div className="text-base font-extrabold text-slate-900">
                      {selectedAuditLog.module}
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg border text-xs font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Activity Description & Edited Item */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    What Happened
                  </div>
                  <div className="text-slate-900 font-semibold leading-relaxed text-sm sm:text-base">
                    {selectedAuditLog.description}
                  </div>
                  {selectedAuditLog.target_name && (
                    <div className="pt-2 border-t border-slate-200 text-xs font-semibold text-sky-700">
                      Edited Item / Record:{' '}
                      <span className="font-bold text-slate-900">{selectedAuditLog.target_name}</span>
                    </div>
                  )}
                </div>

                {/* Clear Field-by-Field Before -> After Diff */}
                {extracted.changes.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" />
                      <span>Exact Changes (Before ➔ After)</span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {extracted.changes.map((ch, idx) => (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
                          <div className="text-xs font-bold text-sky-700">{ch.label}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 break-words">
                              <span className="text-[10px] uppercase font-bold text-red-700 block mb-0.5">
                                Before (Old)
                              </span>
                              {ch.before}
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold break-words">
                              <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">
                                After (New)
                              </span>
                              {ch.after}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Created / Saved Summary */}
                {extracted.changes.length === 0 && extracted.createdSummary.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                      Details Added / Updated
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {extracted.createdSummary.map((entry, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <div className="text-[10px] uppercase font-bold text-slate-500">{entry.label}</div>
                          <div className="text-slate-900 font-semibold break-words mt-0.5">{entry.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context Notes */}
                {extracted.notes && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900">
                    <span className="font-bold text-amber-800">Note: </span>
                    {extracted.notes}
                  </div>
                )}

                {/* Optional Raw Data Accordion */}
                {selectedAuditLog.details && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRawAuditJson((prev) => !prev)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      {showRawAuditJson ? 'Hide Technical Data' : 'View Raw Technical Data'}
                    </button>
                    {showRawAuditJson && (
                      <pre className="mt-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-48">
                        {JSON.stringify(selectedAuditLog.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedAuditLog(null)}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 9. VEHICLE PROCUREMENT, REFURBISHMENT & MARGIN MODAL (OWNER ONLY) */}
      {showProcurementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingProcurementBike ? 'Edit Vehicle Financials & Repairs' : 'Log Vehicle Procurement'}
                  </h3>
                  <span className="text-xs text-emerald-700 font-mono font-bold tracking-wider uppercase">
                    Owner Confidential • Protected Financial Ledger
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProcurementModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const rawTargetId = editingProcurementBike ? editingProcurementBike.id : form.targetBikeId?.value;
                const rawTargetLower = String(rawTargetId || '').trim().toLowerCase();
                const targetBike = bikes.find(
                  b =>
                    String(b.id) === String(rawTargetId) ||
                    (rawTargetLower && String(b.name || '').toLowerCase().includes(rawTargetLower))
                );

                if (!targetBike) {
                  showToast('Please select or type a valid vehicle name');
                  return;
                }

                const purchaseCost = Number(form.purchaseCost.value) || 0;
                const repairCost = Number(form.repairCost.value) || 0;
                const askingPrice = Number(form.askingPrice.value) || targetBike.price || 0;
                const procDate = form.procDate.value || new Date().toISOString().split('T')[0];
                const repairsNote = form.repairsNote.value.trim();
                const vehicleStatus = form.vehicleStatus.value as BikeItem['status'];

                const totalLanded = purchaseCost + repairCost;
                const netProfit = askingPrice - totalLanded;

                const updatedBike: BikeItem = {
                  ...targetBike,
                  purchase_cost: purchaseCost,
                  repair_cost: repairCost,
                  price: askingPrice,
                  procurement_date: procDate,
                  repairs_note: repairsNote,
                  status: vehicleStatus
                };

                setBikes(prev => prev.map(b => String(b.id) === String(targetBike.id) ? updatedBike : b));

                // Audit log
                logAuditAction(
                  'inventory_edit',
                  'Inventory',
                  `Owner updated procurement & margin financials for ${updatedBike.name}`,
                  updatedBike.id,
                  updatedBike.name,
                  {
                    field: 'procurement_financials',
                    before: {
                      purchase: targetBike.purchase_cost,
                      repairs: targetBike.repair_cost,
                      asking: targetBike.price,
                      status: targetBike.status
                    },
                    after: {
                      purchase: purchaseCost,
                      repairs: repairCost,
                      asking: askingPrice,
                      landed: totalLanded,
                      netProfit: netProfit,
                      status: vehicleStatus
                    },
                    notes: repairsNote || 'Procurement adjustment'
                  }
                );

                setShowProcurementModal(false);

                const dbUpdate = {
                  purchase_cost: purchaseCost,
                  repair_cost: repairCost,
                  price: '₹' + askingPrice.toLocaleString('en-IN'),
                  price_raw: askingPrice,
                  procurement_date: procDate,
                  repairs_note: repairsNote,
                  status: vehicleStatus
                };

                try {
                  const { error: errStr } = await supabase
                    .from('bikes')
                    .update(dbUpdate)
                    .eq('id', String(targetBike.id));
                  if (errStr && !isNaN(Number(targetBike.id))) {
                    const { error: errNum } = await supabase
                      .from('bikes')
                      .update(dbUpdate)
                      .eq('id', Number(targetBike.id));
                    if (errNum) {
                      showToast(`Saved locally — Supabase sync error: ${errNum.message}`);
                      return;
                    }
                  } else if (errStr) {
                    showToast(`Saved locally — Supabase sync error: ${errStr.message}`);
                    return;
                  }
                  showToast(`Saved & synced P&L financials for ${updatedBike.name}!`);
                } catch (err: any) {
                  showToast(`Saved locally — Network error: ${err?.message || 'Unable to sync'}`);
                }
              }}
              className="space-y-4"
            >
              {/* Bike Selector if not already editing a specific bike */}
              {!editingProcurementBike ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Select Dealership Vehicle
                  </label>
                  <EditableSelect
                    name="targetBikeId"
                    required
                    defaultValue=""
                    manualPlaceholder="Type bike name or ID..."
                    options={[
                      { value: '', label: '-- Select a bike to log procurement --', disabled: true },
                      ...bikes.map(b => ({
                        value: String(b.id),
                        label: `${b.name} (${b.brand} • ${b.year || '2025'}) — Current Asking: ₹${b.price.toLocaleString('en-IN')}`,
                      })),
                    ]}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  {editingProcurementBike.image_url ? (
                    <img
                      src={editingProcurementBike.image_url}
                      alt={editingProcurementBike.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <Bike className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">{editingProcurementBike.name}</h4>
                    <span className="text-xs text-slate-600 font-mono">
                      {editingProcurementBike.brand} • {editingProcurementBike.category} • Year: {editingProcurementBike.year || 2025}
                    </span>
                  </div>
                </div>
              )}

              {/* Financial Inputs: Purchase Cost & Repair Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Procurement / Buy Cost (₹)
                  </label>
                  <input
                    name="purchaseCost"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    defaultValue={editingProcurementBike?.purchase_cost || 0}
                    placeholder="e.g. 150000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-xs text-slate-600 mt-1 block">Amount paid to seller/exchange</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Mechanical & Refurbish (₹)
                  </label>
                  <input
                    name="repairCost"
                    type="number"
                    min="0"
                    step="500"
                    required
                    defaultValue={editingProcurementBike?.repair_cost || 0}
                    placeholder="e.g. 15000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <span className="text-xs text-slate-600 mt-1 block">Service, parts, tyres, polish</span>
                </div>
              </div>

              {/* Asking Price & Procurement Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Showroom Asking Price (₹)
                  </label>
                  <input
                    name="askingPrice"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    defaultValue={editingProcurementBike?.price || 0}
                    placeholder="e.g. 185000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-amber-800 placeholder-slate-400 font-bold focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-xs text-slate-600 mt-1 block">Final sticker price on website</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Procurement Date
                  </label>
                  <input
                    name="procDate"
                    type="date"
                    required
                    defaultValue={editingProcurementBike?.procurement_date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-xs text-slate-600 mt-1 block">Date unit arrived at showroom</span>
                </div>
              </div>

              {/* Status and Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Inventory Status
                </label>
                <EditableSelect
                  name="vehicleStatus"
                  defaultValue={editingProcurementBike?.status || 'Available'}
                  manualPlaceholder="Write custom status..."
                  options={[
                    { value: 'Available', label: 'Available (In Showroom Stock)' },
                    { value: 'Booked', label: 'Booked (Token Received)' },
                    { value: 'Sold', label: 'Sold (Realized Cash Profit)' },
                    { value: 'Hidden', label: 'Hidden (Off Public Website)' },
                  ]}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Mechanical Job Work & Refurbishment Notes
                </label>
                <textarea
                  name="repairsNote"
                  rows={2}
                  defaultValue={editingProcurementBike?.repairs_note || ''}
                  placeholder="e.g. New clutch plate, front brake pads replaced, full ceramic wash & buffing"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Notice Box */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-700 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">
                  <strong>Zero Worker Leakage:</strong> Purchase and repair records entered here are strictly isolated from normal staff and worker logins. Only you and authorized owners can view this profit data.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProcurementModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Financials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. PRINTABLE P&L EXECUTIVE DEALERSHIP STATEMENT MODAL */}
      {showPrintPnlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl border border-slate-200 p-4 sm:p-8 my-auto max-h-[92vh] overflow-y-auto shadow-lg space-y-6">
            {/* Header with Print and Close Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">ADARSH MOTORS DEALERSHIP NETWORK</h2>
                  <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mt-0.5">
                    Confidential Pre-Owned Superbike Inventory & Margin Performance Statement
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPnlModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Statement Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-600 block text-xs uppercase font-bold">Statement Date</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-xs uppercase font-bold">Reporting Authority</span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentUser ? currentUser.name : 'Managing Director (Owner)'}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-xs uppercase font-bold">Dealership Hub</span>
                <span className="font-bold text-slate-900 text-sm">Madhapur & Gachibowli, Hyderabad</span>
              </div>
            </div>

            {/* Financial Overview Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs uppercase font-bold text-slate-600">Capital Invested</div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 truncate">
                  ₹{pnlTotals.totalLanded.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs uppercase font-bold text-slate-600">Asking Valuation</div>
                <div className="text-base sm:text-lg font-black text-amber-700 font-mono mt-0.5 truncate">
                  ₹{pnlTotals.totalAsking.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs uppercase font-bold text-slate-600">Projected Net Margin</div>
                <div className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5 truncate">
                  +₹{pnlTotals.totalProfit.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs uppercase font-bold text-slate-600">Realized Profit</div>
                <div className="text-base sm:text-lg font-black text-purple-700 font-mono mt-0.5 truncate">
                  ₹{pnlTotals.realizedProfit.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-800 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Vehicle Details</th>
                    <th className="py-2.5 px-2 text-right">Purchase (₹)</th>
                    <th className="py-2.5 px-2 text-right">Repairs (₹)</th>
                    <th className="py-2.5 px-2 text-right">Landed Cost (₹)</th>
                    <th className="py-2.5 px-2 text-right">Asking Price (₹)</th>
                    <th className="py-2.5 px-2 text-right">Net Margin (₹)</th>
                    <th className="py-2.5 px-2 text-center">ROI %</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {bikes.map((bike) => {
                    const pCost = bike.purchase_cost ?? 0;
                    const rCost = bike.repair_cost ?? 0;
                    const landed = pCost + rCost;
                    const asking = bike.price ?? 0;
                    const profit = asking - landed;
                    const marginPercent = landed > 0 ? (profit / landed) * 100 : 0;

                    return (
                      <tr key={bike.id} className={profit < 0 ? 'bg-red-50 text-red-900' : ''}>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                          {bike.name} <span className="text-xs text-slate-600 font-normal">({bike.brand})</span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-700">
                          ₹{pCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-700">
                          ₹{rCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                          ₹{landed.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                          ₹{asking.toLocaleString('en-IN')}
                        </td>
                        <td className={`py-2.5 px-2 text-right font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {profit < 0 ? '-' : '+'}₹{Math.abs(profit).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                          {marginPercent.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase font-sans ${bike.status === 'Sold' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {bike.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signatures & Verification */}
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-xs text-slate-700 border-t border-slate-200">
              <div className="border-t border-dashed border-slate-400 pt-2.5 text-center">
                <span className="font-bold text-slate-900 block">Authorized Dealership Principal / Owner</span>
                <span className="text-xs text-slate-600">Adarsh Motors Management Signatory</span>
              </div>
              <div className="border-t border-dashed border-slate-400 pt-2.5 text-center">
                <span className="font-bold text-slate-900 block">Financial Controller / Auditor</span>
                <span className="text-xs text-slate-600">Ledger Verification & Stamp</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE-SPECIFIC INTERESTED LEADS MODAL */}
      {selectedBikeForLeads && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-col my-auto max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                  <img
                    src={selectedBikeForLeads.image_url}
                    alt={selectedBikeForLeads.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/image_f4045ab9.png';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                      {selectedBikeForLeads.brand}
                    </span>
                    <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {selectedBikeForLeads.year || '2024'}
                    </span>
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedBikeForLeads.status}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight truncate mt-1">
                    {selectedBikeForLeads.name}
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-600 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>Offer Price: <strong className="text-slate-900">{formatINR(selectedBikeForLeads.price)}</strong></span>
                    <span>•</span>
                    <span className="text-red-600 font-bold">
                      {getBikeLeads(selectedBikeForLeads).length} {getBikeLeads(selectedBikeForLeads).length === 1 ? 'Customer Interested' : 'Customers Interested'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedBikeForLeads(null);
                  setShowAddLeadForBike(false);
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header Controls */}
            <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                <Users className="w-4 h-4 text-red-600" />
                <span className="font-semibold">Inquiries & Buyer Leads for this specific model</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadForBike(prev => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddLeadForBike ? 'Cancel' : '+ Add Lead'}</span>
                </button>
                {hasAccess('leads') && (
                  <button
                    type="button"
                    onClick={() => {
                      setLeadsSearch(selectedBikeForLeads.name);
                      setSelectedBikeForLeads(null);
                      setActiveTab('leads');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>Full CRM</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Add Form Dropdown */}
            {showAddLeadForBike && (
              <form onSubmit={handleAddBikeLead} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-red-600" />
                  <span>Record Customer Inquiry for {selectedBikeForLeads.name}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newLeadName}
                      onChange={(e) => setNewLeadName(e.target.value)}
                      placeholder="e.g. Vikram Reddy"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mobile Phone (10 digits) *</label>
                    <input
                      type="tel"
                      required
                      value={newLeadPhone}
                      onChange={(e) => setNewLeadPhone(e.target.value)}
                      placeholder="e.g. 9848012345"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Enquiry / Request Type</label>
                    <EditableSelect
                      value={newLeadServiceType}
                      onChange={(val) => setNewLeadServiceType(val)}
                      manualPlaceholder="Write enquiry type manually..."
                      options={[
                        { value: 'Test Ride & Finance', label: 'Test Ride & Finance' },
                        { value: 'Purchase Booking', label: 'Purchase Booking / Token' },
                        { value: 'Exchange Quotation', label: 'Exchange / Trade-In' },
                        { value: 'Price & EMI Enquiry', label: 'Price & EMI Enquiry' },
                        { value: 'Doorstep Inspection', label: 'Doorstep Inspection' },
                      ]}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Status</label>
                    <EditableSelect
                      value={newLeadStatus}
                      onChange={(val) => setNewLeadStatus(val as any)}
                      manualPlaceholder="Write status manually..."
                      options={[
                        { value: 'New', label: 'New' },
                        { value: 'Contacted', label: 'Contacted' },
                        { value: 'Follow-up', label: 'Follow-up' },
                        { value: 'Closed', label: 'Closed' },
                      ]}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Note / Request Details</label>
                  <input
                    type="text"
                    value={newLeadMessage}
                    onChange={(e) => setNewLeadMessage(e.target.value)}
                    placeholder="e.g. Wants Sunday 4 PM test ride at Jubilee Hills showroom. Ready with 50% token."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddLeadForBike(false)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
                  >
                    Save Lead
                  </button>
                </div>
              </form>
            )}

            {/* Leads List Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {(() => {
                const bLeads = getBikeLeads(selectedBikeForLeads);
                if (bLeads.length === 0) {
                  return (
                    <div className="text-center py-12 px-4">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-600">
                        <Users className="w-6 h-6 text-slate-600" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-1">No Leads Recorded Yet</h4>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mb-4">
                        There are currently no customer inquiries registered for {selectedBikeForLeads.name}.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddLeadForBike(true)}
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Record First Lead for this Bike</span>
                      </button>
                    </div>
                  );
                }

                return bLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base">{lead.customer_name}</span>
                        <span
                          className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                            lead.status === 'New'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : lead.status === 'Contacted'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : lead.status === 'Follow-up'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                        {lead.service_type && (
                          <span className="text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-medium">
                            {lead.service_type}
                          </span>
                        )}
                        <span className="text-xs text-slate-600 font-mono ml-auto sm:ml-0">
                          {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm text-slate-700 font-mono flex items-center gap-2 mb-2">
                        <span>📱 +91 {lead.phone}</span>
                      </div>

                      {lead.message && (
                        <div className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic">
                          "{lead.message}"
                        </div>
                      )}
                    </div>

                    {/* Quick Connect & Status Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                        <a
                          href={getWhatsAppLink(lead.phone, lead.customer_name, selectedBikeForLeads.name)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition"
                          title="WhatsApp Follow-up"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <EditableSelect
                        compact
                        commitManualOnConfirm
                        value={lead.status}
                        onChange={(val) => updateLeadStatus(lead.id, val as any)}
                        containerClassName="w-32"
                        manualPlaceholder="Custom status..."
                        options={[
                          { value: 'New', label: 'New' },
                          { value: 'Contacted', label: 'Contacted' },
                          { value: 'Follow-up', label: 'Follow-up' },
                          { value: 'Closed', label: 'Closed' },
                        ]}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600">
                Direct enquiry tracking active for {selectedBikeForLeads.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedBikeForLeads(null);
                  setShowAddLeadForBike(false);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-lg my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Supabase SQL Schema DDL</h3>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Run this in your Supabase SQL editor to create/update all 8 tables with complete RLS permissions (seamlessly connecting the Customer Website &amp; Admin Panel):
            </p>
            <textarea
              readOnly
              className="w-full h-80 p-3.5 bg-slate-50 font-mono text-xs text-sky-800 rounded-xl border border-slate-200 focus:outline-none resize-none mb-4 leading-relaxed select-all"
              value={UNIFIED_SUPABASE_SCHEMA_SQL}
            />
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(UNIFIED_SUPABASE_SCHEMA_SQL);
                  showToast('Copied full unified SQL script for Customer & Admin panels to clipboard!');
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Full SQL Script</span>
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION DIALOG (Replaces browser confirm() cleanly inside iframes) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                  confirmDialog.tone === 'emerald'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {confirmDialog.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await fn();
                }}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm transition ${
                  confirmDialog.tone === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DEDICATED LIVE CUSTOMER WEBSITE PREVIEW & ARCHITECTURE HUB */}
      <CustomerLiveWebsitePreviewModal
        isOpen={showLiveCustomerWebsiteModal}
        onClose={() => setShowLiveCustomerWebsiteModal(false)}
        customerSiteUrl={settings.customerSiteUrl}
        showToast={showToast}
        supabase={supabase}
        adminSettings={settings}
        adminBikes={bikes}
        adminBranches={branches}
      />

    </div>
  );
}
