const mongoose = require('mongoose');

const guestAccountSchema = new mongoose.Schema(
  {
    guestToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    guestName: {
      type: String,
      default: 'Guest Producer',
    },
    deviceId: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GuestAccount', guestAccountSchema);
