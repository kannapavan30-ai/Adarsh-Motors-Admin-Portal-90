import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, User, Phone, Mail, MapPin, FileCheck, CheckCircle2, Clock, AlertCircle,
  Plus, Edit2, Trash2, Calendar, ShieldCheck, Wrench, Package, FileText, ChevronRight,
  RefreshCw, Check, ArrowUpRight, IndianRupee, Sparkles, Send, ExternalLink, Filter
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import PublicVisibilityToggle from './PublicVisibilityToggle';
import EditableSelect from './EditableSelect';
import OwnerSectionPhoneControl from './OwnerSectionPhoneControl';

export type PaperTransferStatus = 'Pending' | 'In Progress' | 'Completed';

export interface CustomerBikePurchase {
  id: string;
  vehicle_name: string;
  reg_number: string;
  purchase_date: string;
  amount: number;
  payment_mode: string;
  invoice_number?: string;
  delivery_status: 'Delivered' | 'In Transit' | 'Ready for Pickup';
  notes?: string;
}

export interface CustomerServiceLog {
  id: string;
  service_date: string;
  service_type: string;
  odometer_km: number;
  cost: number;
  technician_name: string;
  notes: string;
  invoice_ref?: string;
}

export interface CustomerAccessoryPurchase {
  id: string;
  accessory_name: string;
  purchase_date: string;
  quantity: number;
  price: number;
  warranty_period: string;
  notes?: string;
}

export interface PaperTransferTimelineEntry {
  id: string;
  timestamp: string;
  updated_by: string;
  status: PaperTransferStatus;
  note: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  alt_phone?: string;
  address?: string;
  city?: string;
  kyc_status: 'Verified' | 'Pending' | 'Documents Required' | (string & {});
  paper_transfer_status: PaperTransferStatus;
  paper_transfer_notes: string;
  rto_application_no?: string;
  rto_office?: string;
  form_29_30_date?: string;
  transfer_completion_date?: string;
  timeline: PaperTransferTimelineEntry[];
  bike_purchases: CustomerBikePurchase[];
  service_logs: CustomerServiceLog[];
  accessory_purchases: CustomerAccessoryPurchase[];
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export const SEED_CUSTOMERS: CustomerRecord[] = [
  {
    id: "cust_1",
    name: "Ananya Deshmukh",
    mobile: "9123456789",
    email: "ananya.deshmukh@gmail.com",
    alt_phone: "9849011223",
    address: "Flat 402, Signature Towers, Madhapur, Hyderabad",
    city: "Hyderabad",
    kyc_status: "Verified",
    paper_transfer_status: "In Progress",
    paper_transfer_notes: "Form 29 & 30 physically submitted at RTO Kondapur (TS-07). Fee slip uploaded. Waiting for inspector sign-off.",
    rto_application_no: "TS07/TR/2026/89410",
    rto_office: "TS-07 (Serilingampally / Kondapur)",
    form_29_30_date: "2026-10-29",
    transfer_completion_date: "2026-11-10",
    timeline: [
      {
        id: "tl_1",
        timestamp: "2026-10-28T10:30:00Z",
        updated_by: "Ramesh Naidu (Staff)",
        status: "Pending",
        note: "Customer documents received (Aadhar, PAN, Delivery receipt). Prepared Form 29 & 30."
      },
      {
        id: "tl_2",
        timestamp: "2026-10-29T14:15:00Z",
        updated_by: "Ramesh Naidu (Staff)",
        status: "In Progress",
        note: "Biometric appointment verified at TS-07 RTO Kondapur. Awaiting vehicle physical verification approval."
      }
    ],
    bike_purchases: [
      {
        id: "bp_1",
        vehicle_name: "Honda Activa 6G Premium (Matte Axis Grey)",
        reg_number: "TS 09 EQ 4200",
        purchase_date: "2026-10-27",
        amount: 85000,
        payment_mode: "UPI",
        invoice_number: "AM-2026-101",
        delivery_status: "Delivered",
        notes: "Full payment received. Delivery kit & 3.3kW portable charger included."
      }
    ],
    service_logs: [
      {
        id: "sl_1",
        service_date: "2026-10-27",
        service_type: "Pre-Delivery Inspection (PDI)",
        odometer_km: 15,
        cost: 0,
        technician_name: "Rajendra Prasad",
        notes: "50-point PDI completed. Battery health 100%, tire pressure set to 32 PSI.",
        invoice_ref: "PDI-101"
      }
    ],
    accessory_purchases: [
      {
        id: "ap_1",
        accessory_name: "Studds Ninja Elite Flip-up Helmet (Matt Black)",
        purchase_date: "2026-10-27",
        quantity: 1,
        price: 2400,
        warranty_period: "1 Year Manufacturer Warranty",
        notes: "Size Medium, ISI certified."
      },
      {
        id: "ap_2",
        accessory_name: "Activa Smart Fast Charger (3.3kW Portable Kit)",
        purchase_date: "2026-10-27",
        quantity: 1,
        price: 0,
        warranty_period: "3 Years Dealership Warranty",
        notes: "Complimentary EV charging kit bundle."
      }
    ],
    internal_notes: "VIP customer referred by Dr. Deshmukh. Fast-track RTO smart card handover.",
    created_at: "2026-10-27T08:00:00Z",
    updated_at: "2026-10-29T14:15:00Z"
  },
  {
    id: "cust_2",
    name: "Rajesh Goud",
    mobile: "9440122334",
    email: "rajesh.goud.re@outlook.com",
    alt_phone: "9121098765",
    address: "House 12-4/A, Jubilee Enclave, Road No. 36, Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    kyc_status: "Verified",
    paper_transfer_status: "Completed",
    paper_transfer_notes: "Smart card RC successfully printed and delivered to customer with original invoice and NOC.",
    rto_application_no: "TS09/TR/2026/44120",
    rto_office: "TS-09 (Khairatabad / Banjara Hills)",
    form_29_30_date: "2026-10-14",
    transfer_completion_date: "2026-10-24",
    timeline: [
      {
        id: "tl_3",
        timestamp: "2026-10-14T09:00:00Z",
        updated_by: "Suresh Kumar (Staff)",
        status: "Pending",
        note: "Received physical RC copy from original registered owner. NOC generated."
      },
      {
        id: "tl_4",
        timestamp: "2026-10-18T11:45:00Z",
        updated_by: "Suresh Kumar (Staff)",
        status: "In Progress",
        note: "Application approved by Assistant RTO Khairatabad. Smart RC card queued for printing."
      },
      {
        id: "tl_5",
        timestamp: "2026-10-24T16:20:00Z",
        updated_by: "Pavan Kumar (Owner)",
        status: "Completed",
        note: "Digital RC updated on mParivahan. Physical Smart Card handed over to Rajesh Goud at showroom."
      }
    ],
    bike_purchases: [
      {
        id: "bp_2",
        vehicle_name: "Royal Enfield Hunter 350 Dapper Ash",
        reg_number: "TS 07 HK 1122",
        purchase_date: "2026-10-12",
        amount: 175000,
        payment_mode: "Bank Transfer",
        invoice_number: "AM-2026-102",
        delivery_status: "Delivered",
        notes: "Full RTGS clearance received from Axis Bank."
      }
    ],
    service_logs: [
      {
        id: "sl_2",
        service_date: "2026-10-12",
        service_type: "Pre-Delivery Full Checkup",
        odometer_km: 120,
        cost: 1500,
        technician_name: "Mahesh Babu Technics",
        notes: "Oil flushed with Motul 15W50 semi-synthetic, brake pads cleaned."
      }
    ],
    accessory_purchases: [
      {
        id: "ap_3",
        accessory_name: "Royal Enfield Bar End Mirrors & Black Sump Guard",
        purchase_date: "2026-10-12",
        quantity: 1,
        price: 6500,
        warranty_period: "2 Years Royal Enfield Warranty",
        notes: "Fitted during delivery by workshop staff."
      }
    ],
    internal_notes: "Prompt payor. Looking to upgrade to Continental GT 650 later this year.",
    created_at: "2026-10-12T10:00:00Z",
    updated_at: "2026-10-24T16:20:00Z"
  },
  {
    id: "cust_3",
    name: "Gautam Kashyap",
    mobile: "9849556677",
    email: "gautam.kashyap@kashyaptech.in",
    alt_phone: "9988776655",
    address: "Villa 18, Palm Meadows, Financial District, Nanakramguda, Hyderabad",
    city: "Hyderabad",
    kyc_status: "Verified",
    paper_transfer_status: "Pending",
    paper_transfer_notes: "Awaiting HDFC Two Wheeler loan hypothecation NOC endorsement copy from bank before RTO submission.",
    rto_application_no: "TS08/TR/2026/00192",
    rto_office: "TS-08 (Uppal / Secunderabad)",
    form_29_30_date: "2026-10-31",
    transfer_completion_date: "2026-11-15",
    timeline: [
      {
        id: "tl_6",
        timestamp: "2026-10-31T15:00:00Z",
        updated_by: "Ramesh Naidu (Staff)",
        status: "Pending",
        note: "HDFC bank finance sanctioned. Awaiting Form 34 HP endorsement stamping from banker."
      }
    ],
    bike_purchases: [
      {
        id: "bp_3",
        vehicle_name: "Kawasaki Ninja 650 KRT Edition",
        reg_number: "TS 08 FJ 8899",
        purchase_date: "2026-10-28",
        amount: 680000,
        payment_mode: "Finance (HDFC Bank)",
        invoice_number: "AM-2026-103",
        delivery_status: "Delivered",
        notes: "HDFC loan sanctioned with 20% down payment."
      }
    ],
    service_logs: [
      {
        id: "sl_3",
        service_date: "2026-10-28",
        service_type: "Superbike Dyno & Pre-Delivery Certification",
        odometer_km: 4200,
        cost: 4500,
        technician_name: "Sanjay Dyno Master",
        notes: "Dyno run confirmed 67.2 hp wheel power. Clear title inspection passed."
      }
    ],
    accessory_purchases: [
      {
        id: "ap_4",
        accessory_name: "Evotech Performance Radiator Guard & Frame Sliders",
        purchase_date: "2026-10-28",
        quantity: 1,
        price: 18500,
        warranty_period: "1 Year Official Evotech Warranty",
        notes: "CNC aircraft aluminum finish."
      }
    ],
    internal_notes: "Bank liaison Ramesh is coordinating with HDFC Jubilee Hills branch for NOC stamping.",
    created_at: "2026-10-28T12:00:00Z",
    updated_at: "2026-10-31T15:00:00Z"
  },
  {
    id: "cust_4",
    name: "Kiran Varma",
    mobile: "9848012345",
    email: "kiran.varma99@gmail.com",
    address: "Banjara Hills Road No. 12, Hyderabad",
    city: "Hyderabad",
    kyc_status: "Pending",
    paper_transfer_status: "Pending",
    paper_transfer_notes: "Initial purchase token booked. Pending customer Aadhaar address update.",
    rto_office: "TS-09 (Khairatabad)",
    timeline: [
      {
        id: "tl_7",
        timestamp: "2026-11-02T10:00:00Z",
        updated_by: "Suresh Kumar (Staff)",
        status: "Pending",
        note: "Customer inquiry converted into vehicle reservation. Awaiting KYC documents."
      }
    ],
    bike_purchases: [],
    service_logs: [],
    accessory_purchases: [],
    created_at: "2026-11-02T10:00:00Z",
    updated_at: "2026-11-02T10:00:00Z"
  }
];

interface Props {
  supabase: SupabaseClient;
  currentUser: { name: string; phone: string; role: 'owner' | 'staff' };
  showToast: (msg: string) => void;
  logAuditAction: (action_type: any, module: any, description: string, target_id?: any, target_name?: string, details?: any) => void;
  isCustomerHubVisible?: boolean;
  onToggleCustomerHubVisibility?: () => void;
  sectionPhone?: string;
  onSaveSectionPhone?: (nextPhone: string) => Promise<boolean> | boolean;
}

export default function CustomerPaperTransferManager({
  supabase,
  currentUser,
  showToast,
  logAuditAction,
  isCustomerHubVisible = true,
  onToggleCustomerHubVisibility,
  sectionPhone = '',
  onSaveSectionPhone,
}: Props) {
  const isOwner = currentUser?.role === 'owner';
  // State for Customer Records
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('adarsh_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SEED_CUSTOMERS;
    } catch {
      return SEED_CUSTOMERS;
    }
  });

  // Hydrate customers from Supabase on mount
  useEffect(() => {
    let active = true;
    const parseJsonArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('updated_at', { ascending: false });
        if (!active) return;
        if (error) {
          console.warn('Supabase customers fetch error:', error);
          return;
        }
        if (Array.isArray(data) && data.length > 0) {
          const normalized: CustomerRecord[] = data.map((row: any) => ({
            id: String(row.id),
            name: String(row.name || 'Customer'),
            mobile: String(row.mobile || ''),
            email: row.email || undefined,
            alt_phone: row.alt_phone || undefined,
            address: row.address || undefined,
            city: row.city || 'Hyderabad',
            kyc_status: row.kyc_status || 'Pending',
            paper_transfer_status: row.paper_transfer_status || 'Pending',
            paper_transfer_notes: row.paper_transfer_notes || '',
            rto_application_no: row.rto_application_no || undefined,
            rto_office: row.rto_office || undefined,
            form_29_30_date: row.form_29_30_date || undefined,
            transfer_completion_date: row.transfer_completion_date || undefined,
            timeline: parseJsonArray(row.timeline),
            bike_purchases: parseJsonArray(row.bike_purchases),
            service_logs: parseJsonArray(row.service_logs),
            accessory_purchases: parseJsonArray(row.accessory_purchases),
            internal_notes: row.internal_notes || undefined,
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || new Date().toISOString()
          }));
          setCustomers(normalized);
          try {
            localStorage.setItem('adarsh_customers', JSON.stringify(normalized));
          } catch {}
        }
      } catch (err) {
        console.warn('Supabase customers fetch exception:', err);
      }
    };
    fetchCustomers();
    return () => {
      active = false;
    };
  }, [supabase]);

  // Selected Customer for Editing & Details View
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return SEED_CUSTOMERS[0].id;
  });

  // Search query (Mobile Number or Name)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaperTransferStatus>('ALL');

  // Active section tab in Customer details
  const [activeCustomerTab, setActiveCustomerTab] = useState<'profile' | 'paper_transfer' | 'bikes' | 'service' | 'accessories'>('paper_transfer');

  // Real-time status update form states
  const [newStatusNote, setNewStatusNote] = useState('');
  const [selectedTransferStatus, setSelectedTransferStatus] = useState<PaperTransferStatus>('In Progress');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modals for sub-entities
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddAccessoryModal, setShowAddAccessoryModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCity, setNewCustCity] = useState('Hyderabad');
  const [newCustRtoOffice, setNewCustRtoOffice] = useState('TS-09 (Khairatabad)');
  const [newCustNotes, setNewCustNotes] = useState('');

  // New Bike Purchase Form State
  const [bikeNameInput, setBikeNameInput] = useState('');
  const [bikeRegInput, setBikeRegInput] = useState('');
  const [bikeDateInput, setBikeDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [bikePriceInput, setBikePriceInput] = useState<number>(350000);
  const [bikePaymentInput, setBikePaymentInput] = useState('Bank Transfer');
  const [bikeInvoiceInput, setBikeInvoiceInput] = useState('');
  const [bikeStatusInput, setBikeStatusInput] = useState<'Delivered' | 'In Transit' | 'Ready for Pickup'>('Delivered');

  // New Service Log Form State
  const [serviceDateInput, setServiceDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [serviceTypeInput, setServiceTypeInput] = useState('Dyno Tuning & Map Update');
  const [serviceKmInput, setServiceKmInput] = useState<number>(3000);
  const [serviceCostInput, setServiceCostInput] = useState<number>(4500);
  const [serviceTechInput, setServiceTechInput] = useState('Rajendra Prasad');
  const [serviceNotesInput, setServiceNotesInput] = useState('');

  // New Accessory Purchase Form State
  const [accNameInput, setAccNameInput] = useState('');
  const [accDateInput, setAccDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [accQtyInput, setAccQtyInput] = useState<number>(1);
  const [accPriceInput, setAccPriceInput] = useState<number>(5500);
  const [accWarrantyInput, setAccWarrantyInput] = useState('1 Year Official Warranty');
  const [accNotesInput, setAccNotesInput] = useState('');

  // Helper to persist customers both locally and to Supabase
  const persistCustomers = async (updatedList: CustomerRecord[], updatedCustomer?: CustomerRecord) => {
    setCustomers(updatedList);
    try {
      localStorage.setItem('adarsh_customers', JSON.stringify(updatedList));
    } catch (e) {
      console.warn("localStorage quota or error", e);
    }

    if (updatedCustomer) {
      try {
        const { error } = await supabase.from('customers').upsert({
          id: updatedCustomer.id,
          name: updatedCustomer.name,
          mobile: updatedCustomer.mobile,
          email: updatedCustomer.email,
          alt_phone: updatedCustomer.alt_phone,
          address: updatedCustomer.address,
          city: updatedCustomer.city,
          kyc_status: updatedCustomer.kyc_status,
          paper_transfer_status: updatedCustomer.paper_transfer_status,
          paper_transfer_notes: updatedCustomer.paper_transfer_notes,
          rto_application_no: updatedCustomer.rto_application_no,
          rto_office: updatedCustomer.rto_office,
          form_29_30_date: updatedCustomer.form_29_30_date,
          transfer_completion_date: updatedCustomer.transfer_completion_date,
          timeline: updatedCustomer.timeline,
          bike_purchases: updatedCustomer.bike_purchases,
          service_logs: updatedCustomer.service_logs,
          accessory_purchases: updatedCustomer.accessory_purchases,
          internal_notes: updatedCustomer.internal_notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        if (error) {
          console.error('Supabase customer sync error:', error);
          showToast(`Saved locally — Supabase customer sync error: ${error.message}`);
        }
      } catch (err: any) {
        console.error("Supabase customer sync error:", err);
        showToast(`Saved locally — Supabase sync error: ${err?.message || 'Network error'}`);
      }
    }
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return customers.filter(c => {
      if (!c) return false;
      const cName = String(c.name || '').toLowerCase();
      const mob = String(c.mobile || '');
      const altPh = String(c.alt_phone || '');
      const rtoApp = String(c.rto_application_no || '').toLowerCase();
      const purchases = Array.isArray(c.bike_purchases) ? c.bike_purchases : [];
      const matchesPurchases = purchases.some(b => 
        String(b?.reg_number || '').toLowerCase().includes(q) || 
        String(b?.vehicle_name || '').toLowerCase().includes(q)
      );

      const matchesSearch = !q ||
        cName.includes(q) ||
        mob.includes(q) ||
        altPh.includes(q) ||
        rtoApp.includes(q) ||
        matchesPurchases;

      const matchesStatus = statusFilter === 'ALL' || c.paper_transfer_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  // Active customer object
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // Sync selected transfer status when customer changes
  React.useEffect(() => {
    if (selectedCustomer) {
      setSelectedTransferStatus(selectedCustomer.paper_transfer_status);
    }
  }, [selectedCustomerId, selectedCustomer]);

  // Mobile layout view switcher ('list' or 'detail')
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'detail'>('list');


  // Update customer state locally without hitting Supabase on every keystroke
  const updateCustomerDraftLocally = (updater: (c: CustomerRecord) => CustomerRecord) => {
    if (!selectedCustomer) return;
    const updated = updater(selectedCustomer);
    const nextList = customers.map((c) => (c.id === updated.id ? updated : c));
    setCustomers(nextList);
    try {
      localStorage.setItem('adarsh_customers', JSON.stringify(nextList));
    } catch {}
  };

  // Handler: Update Customer Profile Data (persists cleanly to Supabase)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const updated: CustomerRecord = {
      ...selectedCustomer,
      updated_at: new Date().toISOString()
    };

    const nextList = customers.map(c => c.id === updated.id ? updated : c);
    await persistCustomers(nextList, updated);
    showToast(`Saved profile & RTO details for ${updated.name} to Supabase!`);
    logAuditAction(
      'lead_status',
      'Leads CRM',
      `${currentUser.name} updated profile details for customer ${updated.name} (${updated.mobile})`,
      updated.id,
      updated.name
    );
  };

  // Handler: Delete Customer Record
  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    const target = customerToDelete;
    const nextList = customers.filter(c => c.id !== target.id);
    setCustomers(nextList);
    try {
      localStorage.setItem('adarsh_customers', JSON.stringify(nextList));
    } catch {}
    if (selectedCustomerId === target.id) {
      setSelectedCustomerId(nextList[0]?.id || '');
      setMobileActiveView('list');
    }
    setCustomerToDelete(null);

    try {
      const { error } = await supabase.from('customers').delete().eq('id', target.id);
      if (error) {
        showToast(`Deleted locally — Supabase delete error: ${error.message}`);
      } else {
        showToast(`Deleted customer record for ${target.name}.`);
      }
    } catch (err: any) {
      showToast(`Deleted locally — Supabase network error: ${err?.message || 'Offline'}`);
    }
  };

  // Handler: Dedicated Paper Transfer Status & Notes Submission
  const handleUpdateTransferStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsUpdatingStatus(true);

    const noteText = newStatusNote.trim() || `Paper transfer status set to "${selectedTransferStatus}".`;
    const newTimelineEntry: PaperTransferTimelineEntry = {
      id: 'tl_' + Date.now(),
      timestamp: new Date().toISOString(),
      updated_by: `${currentUser.name} (${currentUser.role})`,
      status: selectedTransferStatus,
      note: noteText
    };

    const updatedCustomer: CustomerRecord = {
      ...selectedCustomer,
      paper_transfer_status: selectedTransferStatus,
      paper_transfer_notes: noteText,
      timeline: [newTimelineEntry, ...(selectedCustomer.timeline || [])],
      transfer_completion_date: selectedTransferStatus === 'Completed'
        ? (selectedCustomer.transfer_completion_date || new Date().toISOString().slice(0, 10))
        : selectedCustomer.transfer_completion_date,
      updated_at: new Date().toISOString()
    };

    const nextList = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    await persistCustomers(nextList, updatedCustomer);

    setNewStatusNote('');
    setIsUpdatingStatus(false);
    showToast(`Paper transfer marked as "${selectedTransferStatus}"!`);
    logAuditAction(
      'billing_create',
      'Billing',
      `${currentUser.name} updated paper transfer status to "${selectedTransferStatus}" for customer ${updatedCustomer.name}`,
      updatedCustomer.id,
      `${updatedCustomer.name} (RTO: ${updatedCustomer.rto_office || 'General'})`,
      { notes: noteText }
    );
  };

  // Handler: Add New Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustMobile.trim()) {
      showToast('Please enter both name and mobile number.');
      return;
    }

    const cleanMobile = newCustMobile.replace(/\D/g, '').slice(-10);
    const newRecord: CustomerRecord = {
      id: 'cust_' + Date.now(),
      name: newCustName.trim(),
      mobile: cleanMobile,
      email: newCustEmail.trim() || undefined,
      address: newCustAddress.trim() || undefined,
      city: newCustCity.trim() || 'Hyderabad',
      kyc_status: 'Pending',
      paper_transfer_status: 'Pending',
      paper_transfer_notes: newCustNotes.trim() || 'Initial registration. Awaiting documents verification.',
      rto_office: newCustRtoOffice,
      timeline: [
        {
          id: 'tl_' + Date.now(),
          timestamp: new Date().toISOString(),
          updated_by: currentUser.name,
          status: 'Pending',
          note: 'Customer profile registered. RTO paper transfer workflow initialized.'
        }
      ],
      bike_purchases: [],
      service_logs: [],
      accessory_purchases: [],
      internal_notes: newCustNotes.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const nextList = [newRecord, ...customers];
    persistCustomers(nextList, newRecord);
    setSelectedCustomerId(newRecord.id);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustMobile('');
    setNewCustEmail('');
    setNewCustAddress('');
    setNewCustNotes('');
    showToast(`Created new profile for ${newRecord.name}!`);
  };

  // Handler: Add Past Bike Purchase
  const handleAddBikePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!bikeNameInput.trim() || !bikeRegInput.trim()) {
      showToast('Please enter vehicle model and registration number.');
      return;
    }

    const newPurchase: CustomerBikePurchase = {
      id: 'bp_' + Date.now(),
      vehicle_name: bikeNameInput.trim(),
      reg_number: bikeRegInput.trim().toUpperCase(),
      purchase_date: bikeDateInput,
      amount: Number(bikePriceInput) || 0,
      payment_mode: bikePaymentInput,
      invoice_number: bikeInvoiceInput.trim() || `AM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      delivery_status: bikeStatusInput
    };

    const updatedCustomer: CustomerRecord = {
      ...selectedCustomer,
      bike_purchases: [newPurchase, ...(selectedCustomer.bike_purchases || [])],
      updated_at: new Date().toISOString()
    };

    const nextList = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    persistCustomers(nextList, updatedCustomer);
    setShowAddBikeModal(false);
    setBikeNameInput('');
    setBikeRegInput('');
    setBikeInvoiceInput('');
    showToast(`Logged bike purchase (${newPurchase.vehicle_name})!`);
  };

  // Handler: Add Service Log
  const handleAddServiceLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const newLog: CustomerServiceLog = {
      id: 'sl_' + Date.now(),
      service_date: serviceDateInput,
      service_type: serviceTypeInput,
      odometer_km: Number(serviceKmInput) || 0,
      cost: Number(serviceCostInput) || 0,
      technician_name: serviceTechInput.trim() || 'Adarsh Workshop Team',
      notes: serviceNotesInput.trim() || 'Routine workshop inspection and fluid levels checked.'
    };

    const updatedCustomer: CustomerRecord = {
      ...selectedCustomer,
      service_logs: [newLog, ...(selectedCustomer.service_logs || [])],
      updated_at: new Date().toISOString()
    };

    const nextList = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    persistCustomers(nextList, updatedCustomer);
    setShowAddServiceModal(false);
    setServiceNotesInput('');
    showToast(`Added service log record (${newLog.service_type})!`);
  };

  // Handler: Add Accessory Purchase
  const handleAddAccessoryPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!accNameInput.trim()) {
      showToast('Please enter accessory title.');
      return;
    }

    const newAcc: CustomerAccessoryPurchase = {
      id: 'ap_' + Date.now(),
      accessory_name: accNameInput.trim(),
      purchase_date: accDateInput,
      quantity: Number(accQtyInput) || 1,
      price: Number(accPriceInput) || 0,
      warranty_period: accWarrantyInput,
      notes: accNotesInput.trim() || undefined
    };

    const updatedCustomer: CustomerRecord = {
      ...selectedCustomer,
      accessory_purchases: [newAcc, ...(selectedCustomer.accessory_purchases || [])],
      updated_at: new Date().toISOString()
    };

    const nextList = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    persistCustomers(nextList, updatedCustomer);
    setShowAddAccessoryModal(false);
    setAccNameInput('');
    setAccNotesInput('');
    showToast(`Recorded accessory sale (${newAcc.accessory_name})!`);
  };

  // Format currency (Bulletproof for strings and numbers)
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

  // Status Badge Styling Helper
  const getStatusBadge = (status: PaperTransferStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const customerStats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    for (const c of customers) {
      if (c.paper_transfer_status === 'Completed') completed++;
      else if (c.paper_transfer_status === 'In Progress') inProgress++;
      else pending++;
    }
    return {
      total: customers.length,
      pending,
      inProgress,
      completed,
    };
  }, [customers]);

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn pb-6">
      {/* Top Header Banner */}
      <div className="bg-white p-3 sm:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 relative z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                RTO Legal &amp; Ownership
              </span>
              <span className="hidden sm:inline text-xs sm:text-sm text-slate-600 font-mono">Real-Time Supabase Sync</span>
            </div>
            <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
              <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0" />
              <span className="truncate">Customer Paper Transfer &amp; Profile</span>
            </h2>
            <p className="hidden sm:block text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed font-medium">
              Search customer records by mobile number or name. Edit verified profile details, track past bike purchases, monitor service history, and update RTO document transfers live.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            {onToggleCustomerHubVisibility && (
              <PublicVisibilityToggle
                compact
                label="Buyer Portal"
                isVisible={isCustomerHubVisible}
                onToggle={onToggleCustomerHubVisibility}
              />
            )}
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(true)}
              className={`min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer ${
                onToggleCustomerHubVisibility ? '' : 'col-span-2'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Add Customer</span>
              <span className="hidden sm:inline">Add Customer Record</span>
            </button>
          </div>
        </div>

        {/* Owner-Only Inline Call & WhatsApp Helpline Bar (Hidden from Workers) */}
        {isOwner && onSaveSectionPhone && (
          <div className="relative z-10">
            <OwnerSectionPhoneControl
              isOwner={isOwner}
              sectionLabel="RTO & Paper Transfer Call / WhatsApp"
              phoneValue={sectionPhone}
              accentColor="purple"
              onSavePhone={onSaveSectionPhone}
            />
          </div>
        )}
      </div>

      {/* 4 RTO & Customer KPI Summary Cards (Sleek 4-Across Row on Mobile) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-slate-600">
            <span className="truncate sm:hidden">Total</span>
            <span className="truncate hidden sm:inline">Total Customers</span>
            <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">{customerStats.total}</div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Registered vehicle owners</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-amber-700">
            <span className="truncate sm:hidden">Pending</span>
            <span className="truncate hidden sm:inline">Pending RTO</span>
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-amber-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">{customerStats.pending}</div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Awaiting KYC / NOC files</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-sky-700">
            <span className="truncate sm:hidden">In RTO</span>
            <span className="truncate hidden sm:inline">RTO In Progress</span>
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-sky-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">{customerStats.inProgress}</div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Submitted at RTO counter</div>
        </div>

        <div className="p-2 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-emerald-700">
            <span className="truncate sm:hidden">Done</span>
            <span className="truncate hidden sm:inline">Transfers Completed</span>
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-emerald-700 font-mono mt-0.5 sm:mt-1.5 tabular-nums leading-tight">{customerStats.completed}</div>
          <div className="hidden sm:block text-xs text-slate-600 mt-1 truncate">Smart RC card handed over</div>
        </div>
      </div>

      {/* Mobile View Switcher (Visible on < lg screens) */}
      <div className="flex lg:hidden items-center p-1 bg-white rounded-xl border border-slate-200 shadow-sm gap-1">
        <button
          type="button"
          onClick={() => setMobileActiveView('list')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
            mobileActiveView === 'list'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Directory ({filteredCustomers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('detail')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 min-w-0 ${
            mobileActiveView === 'detail'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{selectedCustomer ? selectedCustomer.name : 'Profile Details'}</span>
        </button>
      </div>

      {/* Main Split Grid: Customer Search & List on Left, Active Customer Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* LEFT COLUMN: Customer Search & Directory List (5 cols on lg, 4 cols on xl) */}
        <div className={`lg:col-span-5 xl:col-span-4 space-y-3 sm:space-y-4 ${mobileActiveView === 'detail' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm">
            {/* Search Input Bar */}
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mobile, name, reg no..."
                className="w-full pl-10 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Status Filters with Live Counts */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL' as const, label: 'ALL', count: customerStats.total },
                { id: 'Pending' as const, label: 'Pending', count: customerStats.pending },
                { id: 'In Progress' as const, label: 'In Progress', count: customerStats.inProgress },
                { id: 'Completed' as const, label: 'Completed', count: customerStats.completed },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition text-xs cursor-pointer flex items-center gap-1 ${
                    statusFilter === st.id
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{st.label}</span>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${statusFilter === st.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>{st.count}</span>
                </button>
              ))}
            </div>

            {/* Customer List Feed */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-600 border border-dashed border-slate-200 rounded-xl">
                  <User className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-900">No matching customer found</p>
                  <p className="text-xs text-slate-600 mt-0.5">Try searching with a 10-digit mobile number or customer name</p>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  const primaryBike = cust.bike_purchases[0];

                  return (
                    <div
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setMobileActiveView('detail');
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition text-left group ${
                        isSelected
                          ? 'bg-red-50 border-red-300 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-red-600 transition truncate">
                              {cust.name}
                            </span>
                            {cust.kyc_status === 'Verified' && (
                              <span title="KYC Verified">
                                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm font-mono text-sky-700 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>+91 {cust.mobile}</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(cust.paper_transfer_status)}
                        </div>
                      </div>

                      {primaryBike && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-600">
                          <span className="truncate max-w-[170px] text-slate-900 font-semibold">
                            {primaryBike.vehicle_name}
                          </span>
                          <span className="font-mono text-red-700 font-bold shrink-0">
                            {primaryBike.reg_number}
                          </span>
                        </div>
                      )}

                      <div className="mt-1 text-xs text-slate-600 truncate">
                        RTO: {cust.rto_office || 'General jurisdiction'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* List Footer Counter */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Showing {filteredCustomers.length} of {customers.length} Customers</span>
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-slate-600 hover:text-sky-700 font-semibold transition cursor-pointer"
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Customer Details & Management Submodules */}
        <div className={`lg:col-span-7 xl:col-span-8 space-y-4 ${mobileActiveView === 'list' ? 'hidden lg:block' : 'block'}`}>
          {/* Mobile Back to List Button */}
          <button
            type="button"
            onClick={() => setMobileActiveView('list')}
            className="lg:hidden flex items-center gap-1.5 text-sm text-red-700 hover:text-red-800 font-bold px-3 py-2.5 rounded-xl bg-white border border-red-200 transition shadow-sm w-full justify-center active:scale-95 mb-2"
          >
            <span>← Back to Customer Directory ({filteredCustomers.length})</span>
          </button>

          {selectedCustomer ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              {/* Customer Header Quick Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                    {selectedCustomer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">{selectedCustomer.name}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 border border-slate-200 text-slate-900 shrink-0">
                        KYC: {selectedCustomer.kyc_status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-700 mt-1 font-mono">
                      <span className="flex items-center gap-1 text-sky-700 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        +91 {selectedCustomer.mobile}
                      </span>
                      {selectedCustomer.email && (
                        <span className="flex items-center gap-1 truncate max-w-full">
                          <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="truncate">{selectedCustomer.email}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        {selectedCustomer.city || 'Hyderabad'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={`tel:${selectedCustomer.mobile}`}
                    className="min-h-[38px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/91${selectedCustomer.mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${selectedCustomer.name}, update from Adarsh Motors regarding your vehicle RTO / Paper Transfer (${selectedCustomer.paper_transfer_status}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[38px] px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <div className="sm:text-right pl-1">
                    {getStatusBadge(selectedCustomer.paper_transfer_status)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(selectedCustomer)}
                    className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 transition cursor-pointer flex items-center justify-center"
                    title="Delete Customer Record"
                    aria-label="Delete Customer Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-2 py-3 border-b border-slate-200 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('paper_transfer')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeCustomerTab === 'paper_transfer'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 bg-slate-50 border border-slate-200'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Paper Transfer Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('profile')}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeCustomerTab === 'profile'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 bg-slate-50 border border-slate-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile &amp; KYC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('bikes')}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeCustomerTab === 'bikes'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 bg-slate-50 border border-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Bike Purchases ({selectedCustomer.bike_purchases?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('service')}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeCustomerTab === 'service'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Service Logs ({selectedCustomer.service_logs?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('accessories')}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeCustomerTab === 'accessories'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Accessories ({selectedCustomer.accessory_purchases?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: DEDICATED PAPER TRANSFER STATUS MANAGEMENT TOOL */}
              {activeCustomerTab === 'paper_transfer' && (
                <div className="pt-4 space-y-6">
                  {/* Status Banner & Quick Switcher */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-600" />
                          <span>RTO Ownership Transfer Controller</span>
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                          Change state and append real-time document remarks for showroom staff &amp; customers.
                        </p>
                      </div>

                      {/* Dropdown / Status Toggles */}
                      <div className="flex flex-wrap items-center gap-2">
                        {(['Pending', 'In Progress', 'Completed'] as PaperTransferStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setSelectedTransferStatus(st)}
                            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              selectedTransferStatus === st
                                ? st === 'Completed'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : st === 'In Progress'
                                  ? 'bg-cyan-600 text-white shadow-sm'
                                  : 'bg-amber-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                            }`}
                          >
                            {st === 'Completed' && <Check className="w-4 h-4" />}
                            {st === 'In Progress' && <Clock className="w-4 h-4" />}
                            {st === 'Pending' && <AlertCircle className="w-4 h-4" />}
                            <span>{st}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Transfer Metadata Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          RTO Application / Fee Slip #
                        </label>
                        <input
                          type="text"
                          value={selectedCustomer.rto_application_no || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCustomerDraftLocally((c) => ({ ...c, rto_application_no: val }));
                          }}
                          onBlur={() => persistCustomers(customers, selectedCustomer)}
                          placeholder="e.g. TS09/TR/2026/89410"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-sky-700 placeholder-slate-400 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          RTO Jurisdiction Office
                        </label>
                        <input
                          type="text"
                          value={selectedCustomer.rto_office || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCustomerDraftLocally((c) => ({ ...c, rto_office: val }));
                          }}
                          onBlur={() => persistCustomers(customers, selectedCustomer)}
                          placeholder="e.g. TS-09 Khairatabad / Banjara Hills"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Form 29 / 30 Submission Date
                        </label>
                        <input
                          type="date"
                          value={selectedCustomer.form_29_30_date || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCustomerDraftLocally((c) => ({ ...c, form_29_30_date: val }));
                          }}
                          onBlur={() => persistCustomers(customers, selectedCustomer)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Dedicated Real-Time Status Notes Text Area & Submission Form */}
                    <form onSubmit={handleUpdateTransferStatus} className="mt-4 pt-3 border-t border-slate-200 space-y-2.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Real-Time Document Transfer Status Update &amp; Worker Remarks
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={newStatusNote}
                        onChange={(e) => setNewStatusNote(e.target.value)}
                        placeholder="Write real-time update note (e.g. 'Biometrics completed at RTO counter 4; smart RC card sent for dispatch via India Post tracking #EM492019IN')..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs sm:text-sm text-slate-700">
                          Current status: <strong className="text-slate-900">{selectedTransferStatus}</strong>
                        </div>
                        <button
                          type="submit"
                          disabled={isUpdatingStatus}
                          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isUpdatingStatus ? 'Syncing...' : 'Publish Status Update'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Real-Time Paper Transfer Timeline History */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span>Document Transfer Live Timeline ({selectedCustomer.timeline?.length || 0})</span>
                    </h4>

                    <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {selectedCustomer.timeline && selectedCustomer.timeline.length > 0 ? (
                        selectedCustomer.timeline.map((item, idx) => (
                          <div key={item.id || idx} className="relative pl-8 text-sm">
                            <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-red-500 flex items-center justify-center"></div>
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-900">{item.updated_by}</span>
                                  {getStatusBadge(item.status)}
                                </div>
                                <span className="text-xs text-slate-600 font-mono">
                                  {new Date(item.timestamp).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-900 text-xs sm:text-sm leading-relaxed">{item.note}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="pl-8 text-sm text-slate-600">
                          No timeline entries recorded yet. Submit your first update above.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROFILE & KYC DATA EDITOR */}
              {activeCustomerTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Customer Name
                      </label>
                      <input
                        type="text"
                        required
                        value={selectedCustomer.name}
                        onChange={(e) => updateCustomerDraftLocally((c) => ({ ...c, name: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Primary Mobile Phone (Mandatory)
                      </label>
                      <input
                        type="tel"
                        required
                        value={selectedCustomer.mobile}
                        onChange={(e) => updateCustomerDraftLocally((c) => ({ ...c, mobile: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={selectedCustomer.email || ''}
                        onChange={(e) => updateCustomerDraftLocally((c) => ({ ...c, email: e.target.value }))}
                        placeholder="e.g. name@domain.com"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Alternate / Emergency Phone
                      </label>
                      <input
                        type="tel"
                        value={selectedCustomer.alt_phone || ''}
                        onChange={(e) => updateCustomerDraftLocally((c) => ({ ...c, alt_phone: e.target.value }))}
                        placeholder="e.g. 9849012345"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Registered Residential / Delivery Address
                      </label>
                      <input
                        type="text"
                        value={selectedCustomer.address || ''}
                        onChange={(e) => updateCustomerDraftLocally((c) => ({ ...c, address: e.target.value }))}
                        placeholder="Street, flat/plot number, landmark"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        City &amp; State
                      </label>
                      <input
                        type="text"
                        value={selectedCustomer.city || 'Hyderabad'}
                        onChange={(e) => updateCustomerDraftLocally((c) => ({ ...c, city: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Customer KYC Verification Status
                      </label>
                      <EditableSelect
                        value={selectedCustomer.kyc_status}
                        onChange={(val) => updateCustomerDraftLocally((c) => ({ ...c, kyc_status: val as any }))}
                        manualPlaceholder="Write custom KYC status..."
                        options={[
                          { value: 'Verified', label: 'Verified (Aadhaar & PAN Approved)' },
                          { value: 'Pending', label: 'Pending Verification' },
                          { value: 'Documents Required', label: 'Documents Required' },
                        ]}
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Dealership Internal Notes &amp; Preferences
                      </label>
                      <textarea
                        rows={2}
                        value={selectedCustomer.internal_notes || ''}
                        onChange={(e) => updateCustomerDraftLocally((c) => ({ ...c, internal_notes: e.target.value }))}
                        placeholder="Special VIP considerations, trade-in requests, or delivery preferences..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Profile Data</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: PAST BIKE PURCHASES */}
              {activeCustomerTab === 'bikes' && (
                <div className="pt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Purchased Superbikes &amp; Vehicles</h4>
                      <p className="text-xs sm:text-sm text-slate-600">Past vehicle acquisitions and official registration numbers</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddBikeModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log Bike Purchase</span>
                    </button>
                  </div>

                  {selectedCustomer.bike_purchases && selectedCustomer.bike_purchases.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCustomer.bike_purchases.map((bp) => (
                        <div key={bp.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-base">{bp.vehicle_name}</div>
                            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-700 font-mono">
                              <span className="text-red-700 font-bold bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                                {bp.reg_number}
                              </span>
                              <span>Date: {bp.purchase_date}</span>
                              {bp.invoice_number && <span>Invoice: #{bp.invoice_number}</span>}
                              <span>Mode: {bp.payment_mode}</span>
                            </div>
                            {bp.notes && <div className="text-xs sm:text-sm text-slate-600">{bp.notes}</div>}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-lg font-extrabold text-slate-900 font-mono">{formatINR(bp.amount)}</div>
                            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase mt-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {bp.delivery_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-700 border border-dashed border-slate-200 rounded-xl">
                      <ShieldCheck className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                      <p className="text-sm font-semibold text-slate-900">No vehicle purchases recorded yet</p>
                      <p className="text-xs text-slate-600 mt-0.5">Click &quot;Log Bike Purchase&quot; to record an invoice or delivery</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SERVICE LOGS */}
              {activeCustomerTab === 'service' && (
                <div className="pt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Workshop &amp; Dyno Service Logs</h4>
                      <p className="text-xs sm:text-sm text-slate-600">Chronological mechanical inspections, fluid flushes, and dyno runs</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Service Log</span>
                    </button>
                  </div>

                  {selectedCustomer.service_logs && selectedCustomer.service_logs.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedCustomer.service_logs.map((sl) => (
                        <div key={sl.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm sm:text-base">{sl.service_type}</span>
                              <span className="text-xs font-mono text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                                {sl.odometer_km} KM
                              </span>
                            </div>
                            <div className="text-slate-700 text-xs sm:text-sm">
                              {sl.service_date} · Tech: <strong className="text-slate-900">{sl.technician_name}</strong>
                            </div>
                            {sl.notes && <div className="text-xs sm:text-sm text-slate-600 leading-snug">{sl.notes}</div>}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-bold text-slate-900 font-mono text-base">{formatINR(sl.cost)}</div>
                            <span className="text-xs text-slate-600">Workshop Settled</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-700 border border-dashed border-slate-200 rounded-xl">
                      <Wrench className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                      <p className="text-sm font-semibold text-slate-900">No workshop service logs recorded</p>
                      <p className="text-xs text-slate-600 mt-0.5">Click &quot;Add Service Log&quot; to register maintenance visits</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ACCESSORY PURCHASE RECORDS */}
              {activeCustomerTab === 'accessories' && (
                <div className="pt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Superbike Gear &amp; Accessory Purchases</h4>
                      <p className="text-xs sm:text-sm text-slate-600">Riding suits, helmets, slip-on exhausts, and crash protection</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddAccessoryModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Record Accessory Sale</span>
                    </button>
                  </div>

                  {selectedCustomer.accessory_purchases && selectedCustomer.accessory_purchases.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCustomer.accessory_purchases.map((acc) => (
                        <div key={acc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between text-sm space-y-2">
                          <div>
                            <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug">{acc.accessory_name}</div>
                            <div className="text-xs sm:text-sm text-slate-700 mt-1">
                              Qty: <strong className="text-slate-900">{acc.quantity}</strong> · Purchased: {acc.purchase_date}
                            </div>
                            <div className="text-xs text-sky-700 mt-1 font-medium">
                              🛡️ {acc.warranty_period}
                            </div>
                            {acc.notes && <div className="text-xs text-slate-600 mt-1">{acc.notes}</div>}
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs text-slate-600 uppercase font-semibold">Paid Amount</span>
                            <span className="font-bold text-slate-900 font-mono text-base">{formatINR(acc.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-700 border border-dashed border-slate-200 rounded-xl">
                      <Package className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                      <p className="text-sm font-semibold text-slate-900">No accessory purchases recorded</p>
                      <p className="text-xs text-slate-600 mt-0.5">Click &quot;Record Accessory Sale&quot; to link parts to this customer</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-700">
              <User className="w-12 h-12 mx-auto text-slate-500 mb-3" />
              <h3 className="text-base font-bold text-slate-900">Select a customer from directory</h3>
              <p className="text-sm text-slate-600 mt-1">Search by phone number or name to manage paper transfers and past history</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD NEW CUSTOMER RECORD */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg relative max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-red-600" />
              <span>Register New Customer &amp; Paper Transfer</span>
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter customer contact information to create a centralized profile and RTO workflow.
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Vikramaditya Reddy"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={newCustMobile}
                    onChange={(e) => setNewCustMobile(e.target.value)}
                    placeholder="e.g. 9849055443"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="e.g. vikram@gmail.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Flat/House no, locality, Hyderabad"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RTO Office</label>
                  <EditableSelect
                    value={newCustRtoOffice}
                    onChange={(val) => setNewCustRtoOffice(val)}
                    manualPlaceholder="e.g. TS-11 Medchal / Activa / Custom RTO..."
                    options={[
                      { value: 'TS-09 (Khairatabad / Banjara Hills)', label: 'TS-09 (Khairatabad)' },
                      { value: 'TS-07 (Serilingampally / Kondapur)', label: 'TS-07 (Kondapur / Hitec)' },
                      { value: 'TS-08 (Uppal / Secunderabad)', label: 'TS-08 (Uppal / Secunderabad)' },
                      { value: 'TS-10 (Secunderabad Trimulgherry)', label: 'TS-10 (Secunderabad)' },
                      { value: 'KA-01 (Bengaluru Central)', label: 'KA-01 (Bengaluru Central)' },
                      { value: 'Other Regional RTO', label: 'Other Regional RTO' },
                    ]}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Document / Paperwork Notes</label>
                <textarea
                  rows={2}
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="Form 29/30 status, token payment, delivery schedule..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-sm transition border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm transition cursor-pointer"
                >
                  Create Customer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD BIKE PURCHASE RECORD */}
      {showAddBikeModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-3">
              Add Vehicle Purchase for {selectedCustomer.name}
            </h3>
            <form onSubmit={handleAddBikePurchase} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Superbike / Vehicle Model</label>
                <input
                  type="text"
                  required
                  value={bikeNameInput}
                  onChange={(e) => setBikeNameInput(e.target.value)}
                  placeholder="e.g. Ducati Diavel V4"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Registration # (Plate)</label>
                  <input
                    type="text"
                    required
                    value={bikeRegInput}
                    onChange={(e) => setBikeRegInput(e.target.value)}
                    placeholder="e.g. TS 09 EQ 4200"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 font-mono uppercase text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={bikeDateInput}
                    onChange={(e) => setBikeDateInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={bikePriceInput}
                    onChange={(e) => setBikePriceInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Mode</label>
                  <EditableSelect
                    value={bikePaymentInput}
                    onChange={(val) => setBikePaymentInput(val)}
                    manualPlaceholder="Write custom payment mode..."
                    options={[
                      { value: 'UPI', label: 'UPI' },
                      { value: 'Bank Transfer', label: 'Bank Transfer (RTGS/NEFT)' },
                      { value: 'Finance', label: 'Bank Finance' },
                      { value: 'Cheque', label: 'Demand Draft / Cheque' },
                    ]}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddBikeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  Save Bike Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD SERVICE LOG RECORD */}
      {showAddServiceModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-3">
              Add Workshop Service Log for {selectedCustomer.name}
            </h3>
            <form onSubmit={handleAddServiceLog} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Type</label>
                <EditableSelect
                  value={serviceTypeInput}
                  onChange={(val) => setServiceTypeInput(val)}
                  manualPlaceholder="Write custom service type..."
                  options={[
                    { value: 'Dyno Tuning & Map Update', label: 'Dyno Tuning & Map Update' },
                    { value: '1st Free Inspection', label: '1st Free Inspection' },
                    { value: 'Chain Lubing & Fluid Flush', label: 'Chain Lubing & Fluid Flush (Motul 300V)' },
                    { value: 'Brake Overhaul & Pad Replacement', label: 'Brake Overhaul & Pad Replacement' },
                    { value: 'Annual Periodic Maintenance', label: 'Annual Periodic Maintenance' },
                    { value: 'Laser Wheel Alignment', label: 'Laser Wheel Alignment' },
                  ]}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Date</label>
                  <input
                    type="date"
                    required
                    value={serviceDateInput}
                    onChange={(e) => setServiceDateInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Odometer (KM)</label>
                  <input
                    type="number"
                    required
                    value={serviceKmInput}
                    onChange={(e) => setServiceKmInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Charge (INR)</label>
                  <input
                    type="number"
                    required
                    value={serviceCostInput}
                    onChange={(e) => setServiceCostInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Technician Name</label>
                  <input
                    type="text"
                    required
                    value={serviceTechInput}
                    onChange={(e) => setServiceTechInput(e.target.value)}
                    placeholder="e.g. Rajendra Prasad"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Notes &amp; Parts Replaced</label>
                <textarea
                  rows={2}
                  value={serviceNotesInput}
                  onChange={(e) => setServiceNotesInput(e.target.value)}
                  placeholder="Engine oil replaced, brake bleeding completed, chain tensioned..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD ACCESSORY SALE */}
      {showAddAccessoryModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg max-h-[92vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-3">
              Record Accessory Sale for {selectedCustomer.name}
            </h3>
            <form onSubmit={handleAddAccessoryPurchase} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Accessory / Gear Title</label>
                <input
                  type="text"
                  required
                  value={accNameInput}
                  onChange={(e) => setAccNameInput(e.target.value)}
                  placeholder="e.g. Akrapovič Slip-On Exhaust or Dainese Leather Jacket"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sale Date</label>
                  <input
                    type="date"
                    required
                    value={accDateInput}
                    onChange={(e) => setAccDateInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={accQtyInput}
                    onChange={(e) => setAccQtyInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={accPriceInput}
                    onChange={(e) => setAccPriceInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Warranty Term</label>
                  <input
                    type="text"
                    value={accWarrantyInput}
                    onChange={(e) => setAccWarrantyInput(e.target.value)}
                    placeholder="e.g. 1 Year Official Warranty"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Serial Number or Fitment Notes</label>
                <textarea
                  rows={2}
                  value={accNotesInput}
                  onChange={(e) => setAccNotesInput(e.target.value)}
                  placeholder="Installed at showroom workshop..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddAccessoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  Save Accessory Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CUSTOMER CONFIRMATION */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Delete Customer Record?</h3>
            <p className="text-sm text-slate-600 mt-1.5 mb-5 leading-relaxed">
              Delete <strong className="text-slate-900">{customerToDelete.name}</strong> (+91 {customerToDelete.mobile}) and their RTO timeline?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-sm border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm cursor-pointer"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: RESET DEMO DATA CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-center">
            <h3 className="text-lg font-extrabold text-slate-900">Reset Local Demo Records?</h3>
            <p className="text-sm text-slate-600 mt-1.5 mb-5 leading-relaxed">
              This reloads the 4 showroom sample customer records in local cache.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-sm border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('adarsh_customers', JSON.stringify(SEED_CUSTOMERS));
                    setCustomers(SEED_CUSTOMERS);
                    showToast('Reset customer directory to sample showroom records.');
                  } catch {}
                  setShowResetConfirm(false);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
