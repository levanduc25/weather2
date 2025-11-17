// Lightweight rule engine for weather suggestions (MVP)
// Input shape: { current, forecast }
const RAIN_TYPES = ['Rain', 'Drizzle', 'Thunderstorm'];

function _isRainyItem(item) {
  if (!item) return false;
  // OpenWeather sometimes provides 'weather' array with main
  const main = item.weather?.[0]?.main || item.weather?.main;
  if (main && RAIN_TYPES.includes(main)) return true;

  // Probability of precipitation (pop) if available
  if (typeof item.pop === 'number' && item.pop >= 0.4) return true;

  // Rain volume fields
  if (item.rain) {
    // could be object like { '1h': 2 }
    if (typeof item.rain === 'object') {
      const keys = Object.keys(item.rain);
      for (const k of keys) {
        if (Number(item.rain[k]) > 0) return true;
      }
    }
    if (Number(item.rain) > 0) return true;
  }

  return false;
}

export function getSuggestions({ current, forecast }) {
  const suggestions = [];

  // Umbrella rule: if any upcoming hourly forecast in next 6 entries indicates rain
  try {
    let hourly = [];

    if (Array.isArray(forecast?.hourly) && forecast.hourly.length) {
      hourly = forecast.hourly;
    } else if (Array.isArray(forecast?.list) && forecast.list.length) {
      // fallback to list (raw OpenWeather forecast.list)
      hourly = forecast.list;
    } else if (Array.isArray(forecast?.daily) && forecast.daily.length) {
      // use daily as last resort
      hourly = forecast.daily;
    }

    const nextItems = hourly.slice(0, 6);
    const rainy = nextItems.some(_isRainyItem);

    if (rainy) {
      // determine severity: if many items rainy -> warning
      const rainyCount = nextItems.filter(_isRainyItem).length;
      const level = rainyCount >= 3 ? 'warning' : 'info';

      suggestions.push({
        id: 'umbrella_01',
        type: 'precipitation',
        level,
        title: 'Mang ô',
        message: 'Có khả năng mưa trong vài giờ tới — nhớ mang ô/áo mưa.',
        icon: 'rain',
        expiresAt: Date.now() + 1000 * 60 * 60 // 1 hour
      });
    }
  } catch (e) {
    // ignore rule errors
    console.warn('Suggestion rule error:', e);
  }

  return suggestions;
}

export default { getSuggestions };
