const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GuestAccount',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

likeSchema.index({ userId: 1, trackId: 1 }, { unique: true, sparse: true });
likeSchema.index({ guestAccountId: 1, trackId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Like', likeSchema);
