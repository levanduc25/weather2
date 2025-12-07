const ApiEvent = require('../models/ApiEvent');

// Lightweight metrics middleware
// - Logs basic API events into `apievents` collection for later aggregation
// - Only logs requests under `/api/` to limit noise
// - Works asynchronously and will not block the response

module.exports = function metricsMiddleware(req, res, next) {
  try {
    if (!req.path || !req.path.startsWith('/api/')) return next();

    const userId = req.user && req.user._id ? req.user._id : undefined;
    const meta = {
      method: req.method,
      path: req.path,
      query: req.query && Object.keys(req.query).length ? req.query : undefined,
      // store small snippet of body if present, avoid saving large payloads
      bodySnippet: req.body && typeof req.body === 'object' ? Object.keys(req.body).slice(0,5) : undefined,
      userAgent: req.get('User-Agent') || undefined
    };

    // derive a higher-level action for some routes to support metrics grouping
    // - searches: GET /api/weather/search
    // - add_favorite / remove_favorite: POST/DELETE /api/user/favorites
    // - discord_notify: POST /api/discord/notify (or similar)
    try {
      const p = req.path.toLowerCase();

      // weather endpoints
      if (p.startsWith('/api/weather/search')) {
        meta.action = 'search';
      } else if (p.startsWith('/api/weather/current')) {
        meta.action = 'weather_current';
      } else if (p.startsWith('/api/weather/forecast')) {
        meta.action = 'weather_forecast';
      } else if (p.startsWith('/api/weather/geolocation')) {
        meta.action = 'weather_geolocation';
      } else if (p.startsWith('/api/weather/historical')) {
        meta.action = 'weather_historical';
      }

      // cccd uploads / register
      else if (p.startsWith('/api/cccd')) {
        if (p.includes('/register')) meta.action = 'cccd_register';
        else meta.action = 'cccd';
      }

      // user favorites and search history
      else if (p.startsWith('/api/user/favorites') && req.method === 'POST') {
        meta.action = 'add_favorite';
      } else if (p.startsWith('/api/user/favorites') && (req.method === 'DELETE' || req.method === 'PUT')) {
        meta.action = 'remove_favorite';
      } else if (p.startsWith('/api/user/search-history') && req.method === 'POST') {
        meta.action = 'user_search_history_add';
      }

      // auth events
      else if (p.startsWith('/api/auth')) {
        if (p.includes('/login')) meta.action = 'auth_login';
        else if (p.includes('/register')) meta.action = 'auth_register';
        else if (p.includes('/me')) meta.action = 'auth_me';
        else meta.action = 'auth';
      }

      // discord events
      else if (p.startsWith('/api/discord') && req.method === 'POST') {
        meta.action = 'discord_event';
      }
    } catch (e) {
      // ignore any errors while deriving action
    }

    // async fire-and-forget; do not await to avoid slowing responses
    ApiEvent.create({ type: 'request', userId, meta, ip: req.ip }).catch(err => {
      // log but don't crash the app if metrics write fails
      console.warn('Metrics write failed:', err && err.message ? err.message : err);
    });
  } catch (err) {
    // swallow errors from metrics
    console.warn('Metrics middleware error', err && err.message ? err.message : err);
  }

  next();
};
