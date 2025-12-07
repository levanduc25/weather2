const mongoose = require('mongoose');

const AdminAuditSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // 'ban', 'unban', 'delete', 'edit', 'search'
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetEmail: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String },
  ts: { type: Date, default: Date.now }
});

AdminAuditSchema.index({ ts: -1 });
AdminAuditSchema.index({ adminId: 1, ts: -1 });
AdminAuditSchema.index({ action: 1, ts: -1 });

module.exports = mongoose.model('AdminAudit', AdminAuditSchema);
