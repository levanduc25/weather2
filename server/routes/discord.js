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
// @desc    Connect Discord account to user and add bot to server
// @access  Private
router.post('/connect', auth, [
  body('discordUserId').notEmpty().withMessage('Discord User ID is required'),
  body('serverId').notEmpty().withMessage('Server ID (Guild ID) is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { discordUserId, serverId } = req.body;

    // Validate Discord IDs format
    if (!isValidDiscordId(discordUserId)) {
      return res.status(400).json({
        message: 'Invalid Discord User ID format. Must be 17-19 digits.'
      });
    }

    if (!isValidDiscordId(serverId)) {
      return res.status(400).json({
        message: 'Invalid Server ID (Guild ID) format. Must be 17-19 digits.'
      });
    }

    // Try to verify the Discord IDs exist by checking with Discord API (optional)
    // This requires a valid Discord bot token
    if (process.env.DISCORD_TOKEN) {
      try {
        // Verify guild/server exists
        const guildResponse = await axios.get(
          `https://discord.com/api/v10/guilds/${serverId}`,
          {
            headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
          }
        );

        if (!guildResponse.data) {
          return res.status(400).json({
            message: 'Server not found. Make sure the bot is already in the server.'
          });
        }
      } catch (apiError) {
        console.warn('Could not verify guild with Discord API:', apiError.message);
        // Continue anyway - validation may fail due to permissions
      }
    }

    // Update user with Discord info
    req.user.discord = {
      userId: discordUserId,
      serverId: serverId,
      subscribed: false,
      connectedAt: new Date()
    };

    await req.user.save();

    // Generate invite URL in case bot needs to be added manually
    const inviteUrl = getDiscordInviteUrl(serverId);

    res.json({
      message: 'Discord account connected successfully',
      discord: req.user.discord,
      inviteUrl: inviteUrl,
      note: 'Make sure the bot is in your Discord server. If not, use the invite link provided.'
    });
  } catch (error) {
    console.error('Discord connect error:', error);
    res.status(500).json({ message: 'Failed to connect Discord account' });
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

    if (!req.user.discord?.userId) {
      return res.status(400).json({
        message: 'Discord account not connected. Please connect your Discord account first.'
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
      connected: !!req.user.discord?.userId,
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
