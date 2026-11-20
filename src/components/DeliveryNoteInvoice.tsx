import React from 'react';
import { InvoiceItem } from '../App';

export interface DeliveryNoteDetails {
  note_no?: string;
  delivery_time?: string;
  delivery_date?: string;
  vehicle_category?: 'Car' | 'M.Cycle' | 'Scooter' | 'Registered';
  owner_name?: string;
  owner_so?: string;
  owner_ro?: string;
  class_of_vehicle?: string;
  chassis_number?: string;
  engine_number?: string;
  makers_name?: string;
  mfg_month_year?: string;
  body_type?: string;
  colour?: string;
  seller_name?: string;
  seller_so?: string;
  seller_ro?: string;
  seller_phone?: string;
  dealer_name?: string;
  dealer_ms?: string;
  purchaser_name?: string;
  purchaser_so?: string;
  purchaser_address?: string;
  purchaser_time?: string;
  purchaser_date?: string;
}

interface DeliveryNoteSheetProps {
  invoice: InvoiceItem;
  showPriceSection: boolean;
  isPublicView?: boolean;
  showPricePublic?: boolean;
  formatINR: (val: any) => string;
}

export function formatDeliveryDate(isoOrDate?: string): string {
  if (!isoOrDate) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoOrDate)) return isoOrDate;
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDeliveryTime(isoOrTime?: string): string {
  if (!isoOrTime) return '';
  const d = new Date(isoOrTime);
  if (isNaN(d.getTime())) return isoOrTime;
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function DeliveryNoteSheet({
  invoice,
  showPriceSection,
  isPublicView = false,
  showPricePublic = false,
  formatINR,
}: DeliveryNoteSheetProps) {
  const dn = invoice.delivery_note || {};
  const serialNo = dn.note_no || invoice.invoice_number;
  const deliveryDate = dn.delivery_date || formatDeliveryDate(invoice.created_at);
  const deliveryTime = dn.delivery_time || formatDeliveryTime(invoice.created_at);
  const purchaserDate = dn.purchaser_date || deliveryDate;
  const purchaserTime = dn.purchaser_time || deliveryTime;
  const selectedCategory = dn.vehicle_category || 'M.Cycle';
  const ownerName = dn.owner_name || invoice.customer_name || '';
  const purchaserName = dn.purchaser_name || invoice.customer_name || '';

  const canRenderPriceSection = isPublicView ? showPricePublic : showPriceSection;
  const hasPriceValue = Number(invoice.price || 0) > 0;

  const categories: Array<'Car' | 'M.Cycle' | 'Scooter' | 'Registered'> = [
    'Car',
    'M.Cycle',
    'Scooter',
    'Registered',
  ];

  return (
    <div
      id="delivery-note-print-root"
      className="bg-white text-[#1e3a8a] rounded-2xl border-2 border-[#1e40af] overflow-hidden shadow-sm font-sans text-[12px] sm:text-[13px] leading-snug select-text"
    >
      {/* Top Royal Blue Banner */}
      <div className="bg-[#1e40af] text-white text-center py-2.5 px-4 tracking-[0.22em] font-black text-lg sm:text-2xl uppercase">
        ADARSH MOTORS
      </div>

      {/* Subheader: Auto Consultants & SR Nagar Address */}
      <div className="px-4 sm:px-7 pt-2.5 pb-2 text-center text-[#1e40af]">
        <div className="text-base sm:text-xl font-extrabold tracking-wider uppercase leading-tight">
          AUTO CONSULTANTS
        </div>
        <div className="text-[11px] sm:text-xs font-medium mt-0.5 leading-snug">
          Shop No. C-8, Beside M.G. Scooters, Bhanu Enclave, ESI - Hospital, S.R. Nagar,
          <br />
          Hyderabad - 500 038. Ph : 23709972
        </div>
      </div>

      {/* Main Sheet Body */}
      <div className="px-4 sm:px-7 pb-5 space-y-2.5">
        {/* Serial No. + DELIVERY NOTE Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-baseline gap-2.5">
            <span className="font-bold text-sm text-[#1e40af]">No.</span>
            <span className="font-mono font-black text-base sm:text-lg text-red-700 tracking-wider">
              {serialNo}
            </span>
          </div>

          <div className="mx-auto sm:mx-0 sm:mr-14">
            <div className="px-5 py-1 rounded-xl border-2 border-[#1e40af] p-[2px] inline-block">
              <div className="bg-[#1e40af] text-white font-extrabold text-sm sm:text-base tracking-widest uppercase px-4 py-0.5 rounded-lg">
                DELIVERY NOTE
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-16" />
        </div>

        {/* Time & Date Row */}
        <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
          <div className="flex items-end gap-2 min-w-[180px]">
            <span className="font-semibold shrink-0">Time</span>
            <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-mono font-bold text-slate-900 min-w-[120px]">
              {deliveryTime}
            </span>
          </div>
          <div className="flex items-end gap-2 min-w-[180px]">
            <span className="font-semibold shrink-0">Date</span>
            <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-mono font-bold text-slate-900 min-w-[120px]">
              {deliveryDate}
            </span>
          </div>
        </div>

        {/* Declaration Line */}
        <div className="pt-1 text-[11.5px] sm:text-xs font-medium leading-relaxed">
          I / We after satisfying my self / Our service have taken delivery of{' '}
          <span className="inline-flex flex-wrap items-center gap-1 font-semibold">
            {categories.map((cat, idx) => {
              const isSelected = selectedCategory === cat;
              return (
                <React.Fragment key={cat}>
                  <span
                    className={
                      isSelected
                        ? 'px-1.5 py-0.5 rounded border border-red-600 bg-red-50 text-red-700 font-extrabold'
                        : 'text-[#1e40af]/75'
                    }
                  >
                    {cat}
                  </span>
                  {idx < categories.length - 1 && <span>/</span>}
                </React.Fragment>
              );
            })}
          </span>
        </div>

        {/* Owner / S/o / R/o / Registration No. / Model */}
        <div className="space-y-2 pt-0.5">
          <div className="flex items-end gap-2">
            <span className="font-semibold shrink-0">Owner</span>
            <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-bold text-slate-900">
              {ownerName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-end gap-2">
              <span className="font-semibold shrink-0">S/o.</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-semibold text-slate-900 min-h-[20px]">
                {dn.owner_so || ''}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-semibold shrink-0">R/o.</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-semibold text-slate-900 min-h-[20px]">
                {dn.owner_ro || ''}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-end gap-2">
              <span className="font-semibold shrink-0">bearing Registration No.</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-mono font-black text-red-700 uppercase tracking-wider min-h-[20px]">
                {invoice.reg_number}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-semibold shrink-0">Model</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-bold text-slate-900 min-h-[20px]">
                {invoice.vehicle}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Split: 1-7 Technical Specs | Seller & Dealer Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
          {/* Left Column (1-7) */}
          <div className="md:col-span-6 space-y-1.5 md:pr-3 md:border-r md:border-[#1e40af]">
            {[
              { num: '1.', label: 'Class of Vehicle', value: dn.class_of_vehicle || selectedCategory },
              { num: '2.', label: 'Chassis Number', value: dn.chassis_number || '' },
              { num: '3.', label: 'Engine Number', value: dn.engine_number || '' },
              { num: '4.', label: 'Makers Name', value: dn.makers_name || '' },
              { num: '5.', label: 'Month and year of Maf.', value: dn.mfg_month_year || '' },
              { num: '6.', label: 'Type of Body', value: dn.body_type || '' },
              { num: '7.', label: 'Colour', value: dn.colour || '' },
            ].map((row) => (
              <div key={row.num} className="grid grid-cols-12 items-end gap-1.5">
                <div className="col-span-6 font-semibold flex items-center justify-between pr-1 text-[11.5px] sm:text-xs">
                  <span>
                    {row.num} {row.label}
                  </span>
                  <span>:</span>
                </div>
                <div className="col-span-6 border-b border-[#1e40af] px-1.5 pb-0.5 font-mono font-bold text-slate-900 text-xs min-h-[20px] truncate">
                  {row.value}
                </div>
              </div>
            ))}

            <p className="pt-2 text-[11px] sm:text-[11.5px] font-medium leading-relaxed text-[#1e40af]">
              along with the R.C. Book, Transfer letters, Stamped Receipt, Insurance letter and the
              relevant tools and accessories of the said vehicle hence this delivery note passed.
            </p>
          </div>

          {/* Right Column (Seller & Dealer Info) */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-end gap-2">
                <span className="font-semibold shrink-0">Seller&apos;s Name</span>
                <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-bold text-slate-900 min-h-[20px]">
                  {dn.seller_name || ''}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold shrink-0">S/o.</span>
                <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-semibold text-slate-900 min-h-[20px]">
                  {dn.seller_so || ''}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold shrink-0">R/o.</span>
                <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-semibold text-slate-900 min-h-[20px]">
                  {dn.seller_ro || ''}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold shrink-0">Phone :</span>
                <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-mono font-bold text-slate-900 min-h-[20px]">
                  {dn.seller_phone || ''}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold shrink-0">Through Dealer&apos;s Name</span>
                <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-semibold text-slate-900 min-h-[20px]">
                  {dn.dealer_name || 'Adarsh Motors'}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold shrink-0">M/s.</span>
                <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-semibold text-slate-900 min-h-[20px]">
                  {dn.dealer_ms || 'Adarsh Motors Auto Consultants'}
                </span>
              </div>
            </div>

            <div className="pt-5 text-right">
              <div className="inline-block border-t border-dotted border-[#1e40af] pt-1 px-6 text-xs font-bold text-[#1e40af]">
                Signature
              </div>
            </div>
          </div>
        </div>

        {/* PURCHASER'S ADDRESS Section */}
        <div className="pt-2 space-y-2 border-t border-[#1e40af]/30">
          <div className="font-extrabold text-xs tracking-wide uppercase text-[#1e40af]">
            (PURCHASER&apos;S ADDRESS)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-end gap-2">
              <span className="font-semibold shrink-0">Name :</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-bold text-slate-900 min-h-[20px]">
                {purchaserName}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-semibold shrink-0">S/o.</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-semibold text-slate-900 min-h-[20px]">
                {dn.purchaser_so || ''}
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <span className="font-semibold shrink-0">Address :</span>
            <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-semibold text-slate-900 min-h-[20px]">
              {dn.purchaser_address || ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-6 flex items-end gap-2">
              <span className="font-semibold shrink-0">Phone No.</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-mono font-bold text-slate-900 min-h-[20px]">
                {invoice.mobile ? `+91 ${invoice.mobile}` : ''}
              </span>
            </div>
            <div className="sm:col-span-6 flex items-end gap-2">
              <span className="font-semibold shrink-0">Time :</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-mono font-bold text-slate-900 min-h-[20px]">
                {purchaserTime}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
            <div className="flex items-end gap-2 min-w-[200px]">
              <span className="font-semibold shrink-0">Date</span>
              <span className="flex-1 border-b border-[#1e40af] px-2 pb-0.5 font-mono font-bold text-slate-900 min-h-[20px]">
                {purchaserDate}
              </span>
            </div>
            <div className="pt-3">
              <div className="inline-block border-t border-dotted border-[#1e40af] pt-1 px-6 text-xs font-bold text-[#1e40af]">
                Signature
              </div>
            </div>
          </div>
        </div>

        {/* Optional E-Charger / Remarks if present */}
        {(invoice.has_echarger || invoice.notes) && (
          <div className="pt-1.5 text-[11px] text-slate-700 border-t border-dashed border-[#1e40af]/30 flex flex-wrap gap-x-4 gap-y-1">
            {invoice.has_echarger && (
              <span className="font-bold text-amber-800">
                ⚡ E-Charger: {invoice.echarger_details || 'Fast Home Charger Included'}
              </span>
            )}
            {invoice.notes && <span>Remarks: {invoice.notes}</span>}
          </div>
        )}

        {/* PRICE SECTION — Hidden by default; only rendered when Price Visibility is ON */}
        {canRenderPriceSection && (
          <div className="mt-2 p-3 rounded-xl border border-[#1e40af]/60 bg-blue-50/70 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#1e40af]">
                Price Section (Visible)
              </div>
              <div className="text-xs text-slate-700 mt-0.5">
                Payment Mode:{' '}
                <span className="font-bold text-slate-900">{invoice.payment_mode || '—'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-[#1e40af]">
                Agreed Vehicle Price
              </div>
              <div className="text-base sm:text-lg font-mono font-black text-slate-900">
                {hasPriceValue ? formatINR(invoice.price) : '________________'}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Note & Terms */}
        <div className="pt-2 border-t border-[#1e40af]/30 text-[11px] sm:text-xs text-[#1e40af] space-y-0.5">
          <div className="font-semibold">
            <span className="font-extrabold italic">Note :</span> Please Transfer the Vehicle within
            10 days Purchase after that no claims will be Accepted.
          </div>
          <div className="pl-1 space-y-0.5 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-[10px]">♦</span>
              <span>No return No Exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]">♦</span>
              <span>No responsibility after leaving our show room</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]">♦</span>
              <span>We are responsible for Documents</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function generateDeliveryNoteHtml(
  inv: InvoiceItem,
  options: { showPriceSection: boolean }
): string {
  const dn = inv.delivery_note || {};
  const serialNo = dn.note_no || inv.invoice_number;
  const deliveryDate = dn.delivery_date || formatDeliveryDate(inv.created_at);
  const deliveryTime = dn.delivery_time || formatDeliveryTime(inv.created_at);
  const purchaserDate = dn.purchaser_date || deliveryDate;
  const purchaserTime = dn.purchaser_time || deliveryTime;
  const selectedCategory = dn.vehicle_category || 'M.Cycle';
  const ownerName = dn.owner_name || inv.customer_name || '';
  const purchaserName = dn.purchaser_name || inv.customer_name || '';
  const hasPriceValue = Number(inv.price || 0) > 0;
  const priceDisplay = hasPriceValue
    ? `₹${Number(inv.price).toLocaleString('en-IN')}`
    : '________________';

  const esc = (str?: string) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const categoryHtml = (['Car', 'M.Cycle', 'Scooter', 'Registered'] as const)
    .map((cat) =>
      selectedCategory === cat
        ? `<span style="padding:1px 6px;border:1px solid #b91c1c;background:#fef2f2;color:#b91c1c;border-radius:4px;font-weight:800;">${cat}</span>`
        : `<span style="opacity:0.75;">${cat}</span>`
    )
    .join(' / ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Delivery Note - ${esc(serialNo)} - Adarsh Motors</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #1e3a8a; }
    .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border: 2px solid #1e40af; border-radius: 16px; overflow: hidden; }
    .top-bar { background: #1e40af; color: #ffffff; text-align: center; padding: 10px 16px; font-size: 24px; font-weight: 900; letter-spacing: 5px; text-transform: uppercase; }
    .sub-hdr { text-align: center; padding: 10px 24px 6px; color: #1e40af; }
    .sub-hdr h2 { margin: 0; font-size: 18px; letter-spacing: 2px; font-weight: 900; }
    .sub-hdr p { margin: 3px 0 0; font-size: 12px; font-weight: 600; line-height: 1.4; }
    .body { padding: 8px 28px 22px; font-size: 12.5px; }
    .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .serial { font-size: 14px; font-weight: 700; }
    .serial span { font-family: monospace; color: #b91c1c; font-size: 17px; font-weight: 900; margin-left: 8px; }
    .pill-wrap { border: 2px solid #1e40af; border-radius: 12px; padding: 2px; display: inline-block; }
    .pill { background: #1e40af; color: #ffffff; font-weight: 900; font-size: 15px; letter-spacing: 2px; padding: 4px 18px; border-radius: 8px; text-transform: uppercase; }
    .row { display: flex; gap: 14px; margin-bottom: 8px; align-items: flex-end; }
    .field { flex: 1; display: flex; align-items: flex-end; gap: 6px; }
    .label { font-weight: 600; white-space: nowrap; }
    .val { flex: 1; border-bottom: 1px solid #1e40af; padding: 0 6px 2px; font-weight: 700; color: #0f172a; min-height: 18px; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 10px; }
    .left-col { border-right: 1px solid #1e40af; padding-right: 14px; }
    .spec-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; align-items: flex-end; margin-bottom: 6px; }
    .spec-lbl { font-weight: 600; display: flex; justify-content: space-between; font-size: 12px; }
    .spec-val { border-bottom: 1px solid #1e40af; padding: 0 4px 2px; font-family: monospace; font-weight: 700; color: #0f172a; min-height: 17px; }
    .right-col { display: flex; flex-direction: column; justify-content: space-between; }
    .sig { text-align: right; margin-top: 28px; }
    .sig span { border-top: 1px dotted #1e40af; padding: 4px 24px 0; font-weight: 700; font-size: 12px; }
    .purchaser { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(30,64,175,0.3); }
    .price-box { margin-top: 10px; padding: 10px 14px; border: 1px solid rgba(30,64,175,0.6); border-radius: 10px; background: #eff6ff; display: flex; justify-content: space-between; align-items: center; }
    .note-box { margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(30,64,175,0.3); font-size: 11.5px; line-height: 1.5; }
    @media print {
      body { padding: 0; background: #ffffff; }
      .sheet { border-width: 1.5px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-bar">ADARSH MOTORS</div>
    <div class="sub-hdr">
      <h2>AUTO CONSULTANTS</h2>
      <p>Shop No. C-8, Beside M.G. Scooters, Bhanu Enclave, ESI - Hospital, S.R. Nagar,<br/>Hyderabad - 500 038. Ph : 23709972</p>
    </div>
    <div class="body">
      <div class="title-row">
        <div class="serial">No.<span>${esc(serialNo)}</span></div>
        <div class="pill-wrap"><div class="pill">DELIVERY NOTE</div></div>
        <div style="width: 70px;"></div>
      </div>

      <div class="row" style="justify-content: space-between;">
        <div class="field" style="max-width: 240px;"><span class="label">Time</span><span class="val" style="font-family:monospace;">${esc(deliveryTime)}</span></div>
        <div class="field" style="max-width: 240px;"><span class="label">Date</span><span class="val" style="font-family:monospace;">${esc(deliveryDate)}</span></div>
      </div>

      <div style="margin: 8px 0 10px; font-weight: 500; line-height: 1.5;">
        I / We after satisfying my self / Our service have taken delivery of ${categoryHtml}
      </div>

      <div class="row"><div class="field"><span class="label">Owner</span><span class="val">${esc(ownerName)}</span></div></div>
      <div class="row">
        <div class="field"><span class="label">S/o.</span><span class="val">${esc(dn.owner_so)}</span></div>
        <div class="field"><span class="label">R/o.</span><span class="val">${esc(dn.owner_ro)}</span></div>
      </div>
      <div class="row">
        <div class="field"><span class="label">bearing Registration No.</span><span class="val" style="font-family:monospace;color:#b91c1c;text-transform:uppercase;">${esc(inv.reg_number)}</span></div>
        <div class="field"><span class="label">Model</span><span class="val">${esc(inv.vehicle)}</span></div>
      </div>

      <div class="split">
        <div class="left-col">
          <div class="spec-row"><div class="spec-lbl"><span>1. Class of Vehicle</span><span>:</span></div><div class="spec-val">${esc(dn.class_of_vehicle || selectedCategory)}</div></div>
          <div class="spec-row"><div class="spec-lbl"><span>2. Chassis Number</span><span>:</span></div><div class="spec-val">${esc(dn.chassis_number)}</div></div>
          <div class="spec-row"><div class="spec-lbl"><span>3. Engine Number</span><span>:</span></div><div class="spec-val">${esc(dn.engine_number)}</div></div>
          <div class="spec-row"><div class="spec-lbl"><span>4. Makers Name</span><span>:</span></div><div class="spec-val">${esc(dn.makers_name)}</div></div>
          <div class="spec-row"><div class="spec-lbl"><span>5. Month and year of Maf.</span><span>:</span></div><div class="spec-val">${esc(dn.mfg_month_year)}</div></div>
          <div class="spec-row"><div class="spec-lbl"><span>6. Type of Body</span><span>:</span></div><div class="spec-val">${esc(dn.body_type)}</div></div>
          <div class="spec-row"><div class="spec-lbl"><span>7. Colour</span><span>:</span></div><div class="spec-val">${esc(dn.colour)}</div></div>
          <p style="margin: 10px 0 0; font-size: 11px; line-height: 1.45;">
            along with the R.C. Book, Transfer letters, Stamped Receipt, Insurance letter and the relevant tools and accessories of the said vehicle hence this delivery note passed.
          </p>
        </div>

        <div class="right-col">
          <div>
            <div class="row"><div class="field"><span class="label">Seller's Name</span><span class="val">${esc(dn.seller_name)}</span></div></div>
            <div class="row"><div class="field"><span class="label">S/o.</span><span class="val">${esc(dn.seller_so)}</span></div></div>
            <div class="row"><div class="field"><span class="label">R/o.</span><span class="val">${esc(dn.seller_ro)}</span></div></div>
            <div class="row"><div class="field"><span class="label">Phone :</span><span class="val" style="font-family:monospace;">${esc(dn.seller_phone)}</span></div></div>
            <div class="row"><div class="field"><span class="label">Through Dealer's Name</span><span class="val">${esc(dn.dealer_name || 'Adarsh Motors')}</span></div></div>
            <div class="row"><div class="field"><span class="label">M/s.</span><span class="val">${esc(dn.dealer_ms || 'Adarsh Motors Auto Consultants')}</span></div></div>
          </div>
          <div class="sig"><span>Signature</span></div>
        </div>
      </div>

      <div class="purchaser">
        <div style="font-weight: 800; font-size: 12px; margin-bottom: 6px;">(PURCHASER'S ADDRESS)</div>
        <div class="row">
          <div class="field"><span class="label">Name :</span><span class="val">${esc(purchaserName)}</span></div>
          <div class="field"><span class="label">S/o.</span><span class="val">${esc(dn.purchaser_so)}</span></div>
        </div>
        <div class="row"><div class="field"><span class="label">Address :</span><span class="val">${esc(dn.purchaser_address)}</span></div></div>
        <div class="row">
          <div class="field"><span class="label">Phone No.</span><span class="val" style="font-family:monospace;">${inv.mobile ? '+91 ' + esc(inv.mobile) : ''}</span></div>
          <div class="field"><span class="label">Time :</span><span class="val" style="font-family:monospace;">${esc(purchaserTime)}</span></div>
        </div>
        <div class="row" style="justify-content: space-between; margin-top: 8px;">
          <div class="field" style="max-width: 240px;"><span class="label">Date</span><span class="val" style="font-family:monospace;">${esc(purchaserDate)}</span></div>
          <div class="sig" style="margin-top: 12px;"><span>Signature</span></div>
        </div>
      </div>

      ${
        options.showPriceSection
          ? `<div class="price-box">
              <div>
                <div style="font-size:10px;font-weight:800;text-transform:uppercase;">Price Section</div>
                <div style="font-size:12px;color:#334155;">Payment Mode: <strong>${esc(inv.payment_mode || '—')}</strong></div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;">Agreed Vehicle Price</div>
                <div style="font-size:17px;font-family:monospace;font-weight:900;color:#0f172a;">${priceDisplay}</div>
              </div>
            </div>`
          : ''
      }

      <div class="note-box">
        <div><strong style="font-style:italic;">Note :</strong> Please Transfer the Vehicle within 10 days Purchase after that no claims will be Accepted.</div>
        <div>♦ No return No Exchange</div>
        <div>♦ No responsibility after leaving our show room</div>
        <div>♦ We are responsible for Documents</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
