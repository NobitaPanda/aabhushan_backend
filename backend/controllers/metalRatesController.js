const { success, error } = require('../utils/apiResponse');

const PUBLIC_GOLD_API_BASE_URL = 'https://api.gold-api.com/price';
const FRANKFURTER_RATE_BASE_URL = 'https://api.frankfurter.dev/v2/rate';
const SOURCE_LINKS = [
  'https://gold-api.com/docs',
  'https://frankfurter.dev/docs'
];
const TROY_OUNCE_IN_GRAMS = 31.1034768;
const DEFAULT_CACHE_MS = 15 * 60 * 1000;

let cache = {
  expiresAt: 0,
  payload: null
};

const parseMs = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const roundMoney = (value) => Number(Number(value).toFixed(2));

const formatTimestamp = (timestamp) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(timestamp));

const parseDateTimestampMs = (value) => {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with status ${response.status}.`);
  }

  return payload;
};

const fetchPublicGoldApiSymbol = async (symbol) => {
  const payload = await fetchJson(`${PUBLIC_GOLD_API_BASE_URL}/${symbol}`);

  if (!Number.isFinite(Number(payload?.price))) {
    throw new Error(`Public Gold API returned an invalid price for ${symbol}.`);
  }

  return payload;
};

const fetchUsdFxRate = async (currency = 'INR') => {
  if (currency === 'USD') {
    return {
      rate: 1,
      timestamp: Date.now()
    };
  }

  const payload = await fetchJson(`${FRANKFURTER_RATE_BASE_URL}/USD/${currency}`);
  const rate = Number(payload?.rate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Frankfurter FX returned an invalid rate for USD/${currency}.`);
  }

  return {
    rate,
    timestamp: parseDateTimestampMs(payload?.date)
  };
};

const buildRatesPayload = async () => {
  const currency = 'INR';
  const [gold, silver, fx] = await Promise.all([
    fetchPublicGoldApiSymbol('XAU'),
    fetchPublicGoldApiSymbol('XAG'),
    fetchUsdFxRate(currency)
  ]);

  const timestamp = Math.max(
    parseDateTimestampMs(gold?.updatedAt),
    parseDateTimestampMs(silver?.updatedAt),
    fx.timestamp
  );
  const gold24 = (Number(gold.price) * fx.rate) / TROY_OUNCE_IN_GRAMS;
  const silver999 = (Number(silver.price) * fx.rate) / TROY_OUNCE_IN_GRAMS;

  return {
    updatedAt: `Live via Gold API Public | ${formatTimestamp(timestamp)}`,
    note: 'Rates are served from the backend live-price service.',
    sourceLabel: 'Live provider',
    sourceLinks: SOURCE_LINKS,
    fetchedAt: new Date(timestamp).toISOString(),
    isLive: true,
    liveConfigured: true,
    provider: 'Gold API Public',
    stale: false,
    lastError: '',
    items: [
      {
        metal: 'Gold 24K',
        price: roundMoney(gold24),
        unit: 'per gram',
        trend: 'Fresh live pull'
      },
      {
        metal: 'Gold 22K',
        price: roundMoney(gold24 * (22 / 24)),
        unit: 'per gram',
        trend: 'Fresh live pull'
      },
      {
        metal: 'Gold 18K',
        price: roundMoney(gold24 * (18 / 24)),
        unit: 'per gram',
        trend: 'Fresh live pull'
      },
      {
        metal: 'Silver 999',
        price: roundMoney(silver999),
        unit: 'per gram',
        trend: 'Fresh live pull'
      }
    ]
  };
};

exports.getMetalRates = async (req, res) => {
  try {
    const forceRefresh = req.query.force === '1';
    const cacheMs = parseMs(process.env.METAL_RATES_CACHE_MS, DEFAULT_CACHE_MS);

    if (!forceRefresh && cache.payload && Date.now() < cache.expiresAt) {
      return success(res, 200, 'Metal rates fetched successfully', { rates: cache.payload });
    }

    const rates = await buildRatesPayload();
    cache = {
      payload: rates,
      expiresAt: Date.now() + cacheMs
    };

    return success(res, 200, 'Metal rates fetched successfully', { rates });
  } catch (err) {
    return error(res, 503, err.message || 'Unable to fetch live metal rates');
  }
};
