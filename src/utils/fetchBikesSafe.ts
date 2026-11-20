import type { SupabaseClient } from '@supabase/supabase-js';
import { isAccessoryItem } from './sectionVisibilitySync';

const LIGHTWEIGHT_BIKE_COLUMNS = [
  'id',
  'name',
  'brand',
  'category',
  'year',
  'km',
  'engine',
  'hp',
  'price_raw',
  'price',
  'location',
  'badge',
  'fuel',
  'acceleration',
  'tagline',
  'addon_name',
  'addon_price',
  'created_at',
  'fuel_type',
  'displacement_cc',
  'engine_type',
  'max_power',
  'addon_gear_name',
  'addon_gear_price',
  'colorways',
  'warranty_badge',
  'status',
  'purchase_cost',
  'repair_cost',
  'procurement_date',
  'repairs_note',
].join(',');

const MINIMAL_BIKE_COLUMNS =
  'id,name,brand,category,year,km,price_raw,price,location,status,created_at';

export interface FetchBikesSafeOptions {
  excludeAccessories?: boolean;
  includeGalleries?: boolean;
  onProgress?: (rows: any[]) => void;
}

export interface FetchBikesSafeResult {
  data: any[] | null;
  error: { message: string } | null;
}

function sortNewestFirst(rows: any[]): any[] {
  return [...rows].sort((a, b) => {
    const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Fetches all bikes from Supabase without hitting Postgres statement timeouts (57014)
 * caused by large base64 `image_url` / `gallery_urls` blobs on `SELECT *`.
 * 1) Fetches lightweight metadata first (~0.3s)
 * 2) Hydrates primary thumbnails (`image_url`) in small batches
 * 3) Optionally hydrates `gallery_urls` in small batches
 */
export async function fetchAllBikesSafe(
  supabase: SupabaseClient,
  options: FetchBikesSafeOptions = {}
): Promise<FetchBikesSafeResult> {
  const {
    excludeAccessories = true,
    includeGalleries = true,
    onProgress,
  } = options;

  try {
    let { data: metaRows, error: metaErr } = await supabase
      .from('bikes')
      .select(LIGHTWEIGHT_BIKE_COLUMNS);

    if (
      metaErr &&
      (metaErr.code === '42703' ||
        metaErr.code === 'PGRST204' ||
        /column|schema cache/i.test(metaErr.message || ''))
    ) {
      const fallback = await supabase
        .from('bikes')
        .select(MINIMAL_BIKE_COLUMNS);
      metaRows = fallback.data as any;
      metaErr = fallback.error;
    }

    if (metaErr) {
      return { data: null, error: { message: metaErr.message } };
    }

    const filtered = (metaRows || []).filter((row: any) => {
      if (!excludeAccessories) return true;
      return !isAccessoryItem(row);
    });

    let workingRows = sortNewestFirst(filtered);
    if (workingRows.length === 0) {
      onProgress?.([]);
      return { data: [], error: null };
    }

    // Emit instant metadata rows so UI displays real inventory immediately
    onProgress?.(workingRows);

    const rowMap = new Map<string, any>();
    for (const r of workingRows) {
      rowMap.set(String(r.id), { ...r });
    }

    const ids = workingRows.map((r) => r.id);

    // Phase 2: Hydrate primary `image_url` in small batches of 3
    const imageChunks = chunkArray(ids, 3);
    for (const chunk of imageChunks) {
      const { data: imgRows, error: imgErr } = await supabase
        .from('bikes')
        .select('id,image_url')
        .in('id', chunk);

      if (!imgErr && Array.isArray(imgRows)) {
        for (const ir of imgRows) {
          const existing = rowMap.get(String(ir.id));
          if (existing) {
            existing.image_url = ir.image_url;
          }
        }
      } else {
        // Fallback 1-by-1 if a chunk has an unusually large photo
        for (const singleId of chunk) {
          const { data: singleRow } = await supabase
            .from('bikes')
            .select('id,image_url')
            .eq('id', singleId)
            .maybeSingle();
          if (singleRow) {
            const existing = rowMap.get(String(singleRow.id));
            if (existing) existing.image_url = singleRow.image_url;
          }
        }
      }
      workingRows = sortNewestFirst(Array.from(rowMap.values()));
      onProgress?.(workingRows);
    }

    // Phase 3: Hydrate multi-angle `gallery_urls` in small batches of 2
    if (includeGalleries) {
      const galleryChunks = chunkArray(ids, 2);
      for (const chunk of galleryChunks) {
        const { data: galRows, error: galErr } = await supabase
          .from('bikes')
          .select('id,gallery_urls')
          .in('id', chunk);

        if (!galErr && Array.isArray(galRows)) {
          for (const gr of galRows) {
            const existing = rowMap.get(String(gr.id));
            if (existing) {
              existing.gallery_urls = gr.gallery_urls;
            }
          }
        } else {
          for (const singleId of chunk) {
            const { data: singleRow } = await supabase
              .from('bikes')
              .select('id,gallery_urls')
              .eq('id', singleId)
              .maybeSingle();
            if (singleRow) {
              const existing = rowMap.get(String(singleRow.id));
              if (existing) existing.gallery_urls = singleRow.gallery_urls;
            }
          }
        }
      }
      workingRows = sortNewestFirst(Array.from(rowMap.values()));
      onProgress?.(workingRows);
    }

    return { data: workingRows, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: { message: err?.message || 'Failed to load bikes from Supabase' },
    };
  }
}
