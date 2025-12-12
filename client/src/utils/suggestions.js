// Lightweight rule engine for weather suggestions (MVP)
// Input shape: { current, forecast }
const RAIN_TYPES = ["Rain", "Drizzle", "Thunderstorm"];

function _isRainyItem(item) {
  if (!item) return false;

  console.log("Kiểm tra item:", item);

  // Kiểm tra weather.main
  if (item.weather?.main && RAIN_TYPES.includes(item.weather.main)) {
    console.log("  -> Có mưa từ weather.main:", item.weather.main);
    return true;
  }

  // Kiểm tra weather array
  if (Array.isArray(item.weather) && item.weather.length > 0) {
    const main = item.weather[0].main;
    if (main && RAIN_TYPES.includes(main)) {
      console.log("  -> Có mưa từ weather[0].main:", main);
      return true;
    }
  }

  // Probability of precipitation (pop) if available
  if (typeof item.pop === "number" && item.pop >= 0.3) {
    console.log("  -> Có mưa từ pop:", item.pop);
    return true;
  }

  // Rain volume fields
  if (item.rain) {
    // could be object like { '1h': 2, '3h': 5 }
    if (typeof item.rain === "object") {
      const keys = Object.keys(item.rain);
      for (const k of keys) {
        if (Number(item.rain[k]) > 0) {
          console.log("  -> Có mưa từ rain object:", item.rain);
          return true;
        }
      }
    }
    if (Number(item.rain) > 0) {
      console.log("  -> Có mưa từ rain number:", item.rain);
      return true;
    }
  }

  return false;
}

export function getSuggestions({ current, forecast }) {
  console.log("=== getSuggestions BẮT ĐẦU ===");
  console.log("Input - current:", current);
  console.log("Input - forecast:", forecast);

  const suggestions = [];

  // Umbrella rule: if any upcoming hourly forecast in next 6 entries indicates rain
  try {
    let hourly = [];

    if (Array.isArray(forecast?.hourly) && forecast.hourly.length) {
      hourly = forecast.hourly;
      console.log("Dùng forecast.hourly, length:", hourly.length);
    } else if (Array.isArray(forecast?.list) && forecast.list.length) {
      hourly = forecast.list;
      console.log("Dùng forecast.list, length:", hourly.length);
    } else if (Array.isArray(forecast?.daily) && forecast.daily.length) {
      hourly = forecast.daily;
      console.log("Dùng forecast.daily, length:", hourly.length);
    }

    console.log("Hourly data:", hourly);

    const nextItems = hourly.slice(0, 6);
    console.log("Kiểm tra 6 items đầu:", nextItems);

    const rainy = nextItems.some(_isRainyItem);
    console.log("Có mưa?", rainy);

    if (rainy) {
      const rainyCount = nextItems.filter(_isRainyItem).length;
      const level = rainyCount >= 3 ? "warning" : "info";

      console.log("Tạo suggestion với level:", level);

      suggestions.push({
        id: "umbrella_01",
        type: "precipitation",
        level,
        title: "Bring an Umbrella",
        message:
          "Rain expected in the next few hours — don't forget your umbrella or raincoat.",
        icon: "rain",
        expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour
      });
    } else {
      console.log("Không phát hiện mưa trong forecast");
    }

    // Check current weather for rain
    if (current?.weather?.main && RAIN_TYPES.includes(current.weather.main)) {
      console.log("Hiện tại đang mưa!");
      if (suggestions.length === 0) {
        suggestions.push({
          id: "umbrella_02",
          type: "precipitation",
          level: "warning",
          title: "It's Raining",
          message: "Currently raining — grab your umbrella before heading out.",
          icon: "rain",
          expiresAt: Date.now() + 1000 * 60 * 60,
        });
      }
    }

    // Temperature-based suggestions
    const temp = current?.main?.temp || current?.temp;
    if (temp) {
      if (temp >= 35) {
        suggestions.push({
          id: "heat_01",
          type: "temperature",
          level: "warning",
          title: "Extreme Heat",
          message:
            "Very hot weather today. Stay hydrated and avoid prolonged sun exposure.",
          icon: "alert",
          expiresAt: Date.now() + 1000 * 60 * 60 * 3,
        });
      } else if (temp >= 30) {
        suggestions.push({
          id: "heat_02",
          type: "temperature",
          level: "info",
          title: "Hot Weather",
          message: "It's quite warm today. Remember to drink plenty of water.",
          icon: "sun",
          expiresAt: Date.now() + 1000 * 60 * 60 * 3,
        });
      } else if (temp <= 10) {
        suggestions.push({
          id: "cold_01",
          type: "temperature",
          level: "info",
          title: "Cold Weather",
          message:
            "Chilly temperatures today. Wear warm clothing and layer up.",
          icon: "snowflake",
          expiresAt: Date.now() + 1000 * 60 * 60 * 3,
        });
      }
    }

    // Wind speed suggestions
    const windSpeed = current?.wind?.speed;
    if (windSpeed && windSpeed >= 10) {
      suggestions.push({
        id: "wind_01",
        type: "wind",
        level: windSpeed >= 15 ? "warning" : "info",
        title: "Windy Conditions",
        message:
          "Strong winds expected. Secure loose items and be cautious outdoors.",
        icon: "wind",
        expiresAt: Date.now() + 1000 * 60 * 60 * 2,
      });
    }

    // Humidity suggestions
    const humidity = current?.main?.humidity || current?.humidity;
    if (humidity && humidity >= 80) {
      suggestions.push({
        id: "humidity_01",
        type: "humidity",
        level: "info",
        title: "High Humidity",
        message:
          "Very humid conditions. You may feel warmer than the actual temperature.",
        icon: "droplet",
        expiresAt: Date.now() + 1000 * 60 * 60 * 3,
      });
    }

    // UV/Sunny day suggestions
    const weather =
      current?.weather?.main ||
      (Array.isArray(current?.weather) ? current.weather[0]?.main : null);
    if (weather === "Clear" && temp && temp >= 25) {
      suggestions.push({
        id: "sunny_01",
        type: "uv",
        level: "info",
        title: "Sunny Day",
        message:
          "Clear skies and sunshine. Apply sunscreen if you'll be outside for long.",
        icon: "sun",
        expiresAt: Date.now() + 1000 * 60 * 60 * 4,
      });
    }

    // Pleasant weather suggestion (fallback)
    if (suggestions.length === 0) {
      console.log("Không có suggestion nào, tạo suggestion test");

      // Check if weather is actually pleasant
      if (temp && temp >= 18 && temp <= 28 && humidity && humidity < 70) {
        suggestions.push({
          id: "pleasant_01",
          type: "info",
          level: "info",
          title: "Perfect Weather",
          message:
            "Beautiful weather today! Great time for outdoor activities.",
          icon: "sun",
          expiresAt: Date.now() + 1000 * 60 * 60,
        });
      } else {
        // Generic fallback
        suggestions.push({
          id: "default_01",
          type: "info",
          level: "info",
          title: "Weather Update",
          message: "Weather conditions are stable. Have a great day!",
          icon: "sun",
          expiresAt: Date.now() + 1000 * 60 * 60,
        });
      }
    }
  } catch (e) {
    console.error("Lỗi khi tạo suggestion:", e);
  }

  console.log("Suggestions cuối cùng:", suggestions);
  console.log("=== getSuggestions KẾT THÚC ===");
  return suggestions;
}

export default { getSuggestions };
