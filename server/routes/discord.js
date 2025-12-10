const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to validate Discord IDs
const isValidDiscordId = (id) => {
  return /^\d{17,19}$/.test(id);
};

// Helper function to generate Discord bot invite URL
const getDiscordInviteUrl = (serverId) => {
  const botId = process.env.DISCORD_BOT_ID;
  const permissions = '268435456'; // Administrator permission
  const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI);
  return `https://discord.com/api/oauth2/authorize?client_id=${botId}&permissions=${permissions}&guild_id=${serverId}&scope=bot&redirect_uri=${redirectUri}&response_type=code`;
};

// @route   POST /api/discord/connect
// @desc    Connect Discord Webhook
// @access  Private
router.post('/connect', auth, [
  body('webhookUrl').notEmpty().withMessage('Webhook URL is required')
    .matches(/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/)
    .withMessage('Invalid Discord Webhook URL format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { webhookUrl } = req.body;

    // Verify webhook by sending a test message
    try {
      await axios.post(webhookUrl, {
        content: '✅ Weather App connection successful! You will receive weather notifications here.'
      });
    } catch (webhookError) {
      console.error('Webhook verification failed:', webhookError.response?.data || webhookError.message);
      return res.status(400).json({
        message: 'Could not connect to this Webhook URL. Please check if it is valid.'
      });
    }

    // Update user with Webhook info
    req.user.discord = {
      ...req.user.discord, // Keep existing fields if any
      webhookUrl: webhookUrl,
      subscribed: true, // Auto-subscribe on connect
      connectedAt: new Date()
    };

    // If no notification city is set, use first favorite city or default
    if (!req.user.discord.notificationCity) {
      if (req.user.favoriteCities && req.user.favoriteCities.length > 0) {
        req.user.discord.notificationCity = req.user.favoriteCities[0].name;
      }
    }

    await req.user.save();

    res.json({
      message: 'Discord Webhook connected successfully',
      discord: req.user.discord
    });
  } catch (error) {
    console.error('Discord connect error:', error);
    res.status(500).json({ message: 'Failed to connect Discord Webhook' });
  }
});

// @route   POST /api/discord/subscribe
// @desc    Subscribe to Discord weather notifications
// @access  Private
router.post('/subscribe', auth, [
  body('city').notEmpty().withMessage('City name is required'),
  body('lat').isNumeric().withMessage('Latitude must be a number'),
  body('lon').isNumeric().withMessage('Longitude must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { city, lat, lon } = req.body;

    if (!req.user.discord?.webhookUrl) {
      return res.status(400).json({
        message: 'Discord Webhook not connected. Please connect your Webhook first.'
      });
    }

    // Update user's Discord notification preferences
    req.user.discord.subscribed = true;
    req.user.discord.notificationCity = city;
    req.user.discord.lastNotification = null;

    await req.user.save();

    res.json({
      message: 'Successfully subscribed to Discord weather notifications',
      discord: req.user.discord
    });
  } catch (error) {
    console.error('Discord subscribe error:', error);
    res.status(500).json({ message: 'Failed to subscribe to notifications' });
  }
});

// @route   POST /api/discord/unsubscribe
// @desc    Unsubscribe from Discord weather notifications
// @access  Private
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    if (!req.user.discord?.userId) {
      return res.status(400).json({
        message: 'Discord account not connected'
      });
    }

    // Update user's Discord notification preferences
    req.user.discord.subscribed = false;
    req.user.discord.notificationCity = null;

    await req.user.save();

    res.json({
      message: 'Successfully unsubscribed from Discord weather notifications',
      discord: req.user.discord
    });
  } catch (error) {
    console.error('Discord unsubscribe error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe from notifications' });
  }
});

// @route   GET /api/discord/status
// @desc    Get Discord connection status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const discordStatus = {
      connected: !!req.user.discord?.webhookUrl,
      subscribed: req.user.discord?.subscribed || false,
      notificationCity: req.user.discord?.notificationCity || null,
      lastNotification: req.user.discord?.lastNotification || null
    };

    res.json({
      discord: discordStatus
    });
  } catch (error) {
    console.error('Discord status error:', error);
    res.status(500).json({ message: 'Failed to get Discord status' });
  }
});

// @route   PUT /api/discord/update-city
// @desc    Update notification city
// @access  Private
router.put('/update-city', auth, [
  body('city').notEmpty().withMessage('City name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { city } = req.body;

    if (!req.user.discord?.userId) {
      return res.status(400).json({
        message: 'Discord account not connected'
      });
    }

    if (!req.user.discord.subscribed) {
      return res.status(400).json({
        message: 'Not subscribed to notifications'
      });
    }

    // Update notification city
    req.user.discord.notificationCity = city;
    await req.user.save();

    res.json({
      message: 'Notification city updated successfully',
      discord: req.user.discord
    });
  } catch (error) {
    console.error('Discord update city error:', error);
    res.status(500).json({ message: 'Failed to update notification city' });
  }
});

module.exports = router;
