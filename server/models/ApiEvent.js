const mongoose = require('mongoose');

const ApiEventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String },
  ts: { type: Date, default: Date.now }
});

ApiEventSchema.index({ ts: 1 });
ApiEventSchema.index({ type: 1, ts: -1 });

module.exports = mongoose.model('ApiEvent', ApiEventSchema);
