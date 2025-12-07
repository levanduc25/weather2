const express = require('express');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');
const ApiEvent = require('../models/ApiEvent');

const router = express.Router();

// GET /api/admin/user-analytics/:userId
// Get detailed analytics for a specific user
router.get('/:userId', auth, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user info
    const user = await User.findById(userId).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get user's API activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userEvents = await ApiEvent.countDocuments({ userId, ts: { $gte: thirtyDaysAgo } });

    // Get user's search history
    const searches = (user.searchHistory || []).slice(0, 20);

    // Get user's favorite cities
    const favorites = (user.favoriteCities || []).slice(0, 20);

    // Activity breakdown by action type (last 30 days)
    const activityBreakdown = await ApiEvent.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId), ts: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$meta.action', count: { $sum: 1 } } }
    ]);

    // Recent searches (last 10 days)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const recentSearches = user.searchHistory ? user.searchHistory.filter(s => new Date(s.searchedAt) >= tenDaysAgo) : [];

    res.json({
      user,
      userEvents,
      searches,
      favorites,
      activityBreakdown,
      recentSearches
    });
  } catch (err) {
    console.error('User analytics error', err);
    res.status(500).json({ message: 'Failed to load user analytics' });
  }
});

module.exports = router;
