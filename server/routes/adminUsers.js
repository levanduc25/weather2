const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');
const AdminAudit = require('../models/AdminAudit');

const router = express.Router();

// Log admin audit action helper
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

// GET /api/admin/users
// query: page, limit, q (search by username/email/fullName), status (banned|active)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit || '20', 10)));
    const q = req.query.q ? String(req.query.q).trim() : null;
    const status = req.query.status || null;

    const filter = {};
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [ { username: regex }, { email: regex }, { fullName: regex } ];
    }
    if (status === 'banned') filter.banned = true;
    if (status === 'active') filter.banned = { $ne: true };

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -verificationToken -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ total, page, perPage: limit, users });
  } catch (err) {
    console.error('Admin users list error', err);
    res.status(500).json({ message: 'Failed to list users' });
  }
});

// GET /api/admin/users/:id
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Admin get user error', err);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// PUT /api/admin/users/:id - update user fields (safe subset)
router.put('/:id', auth, isAdmin, [
  body('fullName').optional().isLength({ max: 100 }),
  body('email').optional().isEmail(),
  body('isVerified').optional().isBoolean(),
  body('preferences').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const allowed = {};
    if (req.body.fullName !== undefined) allowed.fullName = req.body.fullName;
    if (req.body.email !== undefined) allowed.email = req.body.email;
    if (req.body.isVerified !== undefined) allowed.isVerified = req.body.isVerified;
    if (req.body.preferences !== undefined) allowed.preferences = req.body.preferences;

    const user = await User.findByIdAndUpdate(req.params.id, { $set: allowed }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Log audit
    await logAdminAudit(req.user._id, 'edit_user', req.params.id, { changes: Object.keys(allowed) }, req.ip);

    res.json({ message: 'User updated', user });
  } catch (err) {
    console.error('Admin update user error', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// POST /api/admin/users/:id/ban - set ban/unban
router.post('/:id/ban', auth, isAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'ban' or 'unban'
    if (!['ban', 'unban'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

    const banned = action === 'ban';
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { banned } }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Log audit
    await logAdminAudit(req.user._id, action === 'ban' ? 'ban_user' : 'unban_user', req.params.id, {}, req.ip);

    res.json({ message: `User ${banned ? 'banned' : 'unbanned'}`, user });
  } catch (err) {
    console.error('Admin ban/unban error', err);
    res.status(500).json({ message: 'Failed to update user ban status' });
  }
});

// DELETE /api/admin/users/:id - delete user
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Log audit
    await logAdminAudit(req.user._id, 'delete_user', req.params.id, { email: user.email }, req.ip);

    res.json({ message: 'User deleted', user });
  } catch (err) {
    console.error('Admin delete user error', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;

