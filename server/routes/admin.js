const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');
const ApiEvent = require('../models/ApiEvent');
const AdminAudit = require('../models/AdminAudit');

// Simple in-memory cache for aggregation results (TTL seconds)
const aggCache = new Map();
function cacheGet(key) {
  const rec = aggCache.get(key);
  if (!rec) return null;
  if (Date.now() > rec.expires) {
    aggCache.delete(key);
    return null;
  }
  return rec.value;
}
function cacheSet(key, value, ttl = 30) {
  aggCache.set(key, { value, expires: Date.now() + ttl * 1000 });
}

// Log admin audit action
async function logAdminAudit(adminId, action, targetUserId, meta = {}, ip = null) {
  try {
    const targetUser = targetUserId ? await User.findById(targetUserId).select('email') : null;
    await AdminAudit.create({
      adminId,
      action,
      targetUserId,
      targetEmail: targetUser?.email,
      meta,
      ip
    });
  } catch (err) {
    console.warn('Failed to log admin audit', err.message);
  }
}

// GET /api/admin/stats
// Returns aggregated stats for the admin dashboard
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const cacheKey = 'admin:stats:all';
    const cached = cacheGet(cacheKey);
    if (cached) return res.json({ cached: true, ...cached });

    const usersCount = await User.countDocuments();
    const bannedCount = await User.countDocuments({ banned: true });

    // Active users (7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const active7d = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const eventsToday = await ApiEvent.countDocuments({ ts: { $gte: startOfToday } });
    const totalEvents = await ApiEvent.countDocuments();

    // Discord connections
    const discordConnections = await User.countDocuments({ 'discord.userId': { $exists: true, $ne: null } });
    const discordSubscribed = await User.countDocuments({ 'discord.subscribed': true });

    // Top searched cities (today)
    const topCities = await ApiEvent.aggregate([
      { $match: { ts: { $gte: startOfToday }, 'meta.action': 'search' } },
      { $group: { _id: '$meta.query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const stats = {
      usersCount,
      bannedCount,
      active7d,
      eventsToday,
      totalEvents,
      discordConnections,
      discordSubscribed,
      topCities
    };

    cacheSet(cacheKey, stats, 30);
    res.json(stats);
  } catch (err) {
    console.error('Admin stats error', err);
    res.status(500).json({ message: 'Failed to load admin stats' });
  }
});

// GET /api/admin/metrics
// Query params:
// - metric: 'api_events'|'searches'|'new_users'|'discord_notifications' (default 'api_events')
// - days: number of days back from now (default 7)
// - bucket: 'hour'|'day' (default 'day')
// Returns time-bucketed counts
router.get('/metrics', auth, isAdmin, async (req, res) => {
  try {
    const metric = req.query.metric || 'api_events';
    const days = parseInt(req.query.days || '7', 10);
    const bucket = req.query.bucket === 'hour' ? 'hour' : 'day';

    if (isNaN(days) || days <= 0 || days > 365) return res.status(400).json({ message: 'Invalid days parameter' });

    const now = new Date();
    const start = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    const cacheKey = `metrics:${metric}:${days}:${bucket}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json({ cached: true, data: cached });

    if (metric === 'new_users') {
      // aggregate users by createdAt
      const dateFormat = bucket === 'hour' ? '%Y-%m-%dT%H:00:00' : '%Y-%m-%d';
      const pipeline = [
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ];

      const rows = await User.aggregate(pipeline);
      cacheSet(cacheKey, rows, 20);
      return res.json({ cached: false, data: rows });
    }

    // api_events, searches, discord_notifications
    const dateFormat = bucket === 'hour' ? '%Y-%m-%dT%H:00:00' : '%Y-%m-%d';

    const match = { ts: { $gte: start } };
    if (metric === 'searches') {
      match['meta.action'] = 'search';
    } else if (metric === 'discord_notifications') {
      match['meta.action'] = 'discord_event';
    }

    const pipeline = [
      { $match: match },
      { $group: { _id: { $dateToString: { format: dateFormat, date: '$ts' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ];

    const rows = await ApiEvent.aggregate(pipeline);
    cacheSet(cacheKey, rows, 20);
    res.json({ cached: false, data: rows });
  } catch (err) {
    console.error('Admin metrics error', err);
    res.status(500).json({ message: 'Failed to load metrics' });
  }
});

// GET /api/admin/audit
// View admin actions log
// Query: page, limit, adminId, action, days
router.get('/audit', auth, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit || '50', 10)));
    const days = parseInt(req.query.days || '30', 10);

    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const filter = { ts: { $gte: start } };
    if (req.query.adminId) filter.adminId = req.query.adminId;
    if (req.query.action) filter.action = req.query.action;

    const total = await AdminAudit.countDocuments(filter);
    const audits = await AdminAudit.find(filter)
      .populate('adminId', 'username email')
      .populate('targetUserId', 'username email')
      .sort({ ts: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ total, page, perPage: limit, audits });
  } catch (err) {
    console.error('Admin audit error', err);
    res.status(500).json({ message: 'Failed to load audit log' });
  }
});

module.exports = router;

