export interface ParsedGoogleMapsLocation {
  rawInput: string;
  normalizedUrl: string;
  embedUrl: string;
  lat: number | null;
  lng: number | null;
  placeLabel: string;
  cityHint: string;
  isShortLink: boolean;
  isValidMapInput: boolean;
}

const KNOWN_INDIAN_CITIES = [
  'Hyderabad',
  'Secunderabad',
  'Bengaluru',
  'Bangalore',
  'Mumbai',
  'Pune',
  'Delhi',
  'New Delhi',
  'Gurugram',
  'Noida',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
  'Chandigarh',
  'Surat',
  'Nagpur',
  'Indore',
  'Visakhapatnam',
  'Vijayawada',
];

function decodePlaceSlug(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return raw.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function detectCityHint(text: string): string {
  const lower = text.toLowerCase();
  for (const city of KNOWN_INDIAN_CITIES) {
    if (lower.includes(city.toLowerCase())) {
      return city === 'Bangalore' ? 'Bengaluru' : city;
    }
  }
  return '';
}

export function parseGoogleMapsLocation(
  rawInput?: string | null,
  fallbackText?: string
): ParsedGoogleMapsLocation {
  const input = String(rawInput || '').trim();
  const fallback = String(fallbackText || '').trim();

  if (!input) {
    const query = fallback || 'Adarsh Motors Hyderabad';
    return {
      rawInput: '',
      normalizedUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`,
      lat: null,
      lng: null,
      placeLabel: '',
      cityHint: detectCityHint(query),
      isShortLink: false,
      isValidMapInput: false,
    };
  }

  let lat: number | null = null;
  let lng: number | null = null;
  let placeLabel = '';

  const isShortLink = /(?:maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(input);
  const isUrl = /^https?:\/\//i.test(input);

  // 1. Direct "lat, lng" coordinate input
  const rawCoordMatch = input.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
  if (rawCoordMatch) {
    lat = parseFloat(rawCoordMatch[1]);
    lng = parseFloat(rawCoordMatch[2]);
    placeLabel = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const normalizedUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    return {
      rawInput: input,
      normalizedUrl,
      embedUrl: `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`,
      lat,
      lng,
      placeLabel,
      cityHint: '',
      isShortLink: false,
      isValidMapInput: true,
    };
  }

  // 2. Exact pin coordinates inside Google Maps data parameter (!3dLAT!4dLNG)
  const dataPinMatch = input.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataPinMatch) {
    lat = parseFloat(dataPinMatch[1]);
    lng = parseFloat(dataPinMatch[2]);
  }

  // 3. Viewport center coordinates (@LAT,LNG)
  if (lat === null || lng === null) {
    const atMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }
  }

  // 4. Place name from /maps/place/<place>/
  const placeMatch = input.match(/\/maps\/place\/([^/?#]+)/i);
  if (placeMatch?.[1]) {
    placeLabel = decodePlaceSlug(placeMatch[1]);
  }

  // 5. Query parameters (?q=..., ?query=..., ?ll=..., ?center=..., ?destination=...)
  if (isUrl) {
    try {
      const urlObj = new URL(input);
      const qParam =
        urlObj.searchParams.get('q') ||
        urlObj.searchParams.get('query') ||
        urlObj.searchParams.get('destination') ||
        urlObj.searchParams.get('ll') ||
        urlObj.searchParams.get('center') ||
        '';

      if (qParam) {
        const qCoords = qParam.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
        if (qCoords) {
          if (lat === null || lng === null) {
            lat = parseFloat(qCoords[1]);
            lng = parseFloat(qCoords[2]);
          }
          if (!placeLabel) {
            placeLabel = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          }
        } else if (!placeLabel) {
          placeLabel = decodePlaceSlug(qParam);
        }
      }
    } catch {
      // ignore malformed URL object and use string fallbacks below
    }
  } else {
    // Plain query string (e.g. "Adarsh+Motors+Jubilee+Hills+Hyderabad")
    placeLabel = decodePlaceSlug(input);
  }

  const normalizedUrl = isUrl
    ? input
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeLabel || input)}`;

  let embedQuery = '';
  if (lat !== null && lng !== null) {
    embedQuery = `${lat},${lng}`;
  } else if (placeLabel && !isShortLink) {
    embedQuery = placeLabel;
  } else if (fallback) {
    embedQuery = fallback;
  } else {
    embedQuery = 'Hyderabad';
  }

  return {
    rawInput: input,
    normalizedUrl,
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(embedQuery)}&z=15&output=embed`,
    lat,
    lng,
    placeLabel: placeLabel || (lat !== null && lng !== null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : ''),
    cityHint: detectCityHint(`${placeLabel} ${fallback}`),
    isShortLink,
    isValidMapInput: isUrl || isShortLink || (lat !== null && lng !== null) || Boolean(placeLabel),
  };
}
