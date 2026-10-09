const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    album: {
      type: String,
      default: 'SINGLE',
    },
    subgenre: {
      type: String,
      default: 'Drift Phonk',
      index: true,
    },
    duration: {
      type: String,
      default: '2:45',
    },
    durationSec: {
      type: Number,
      default: 165,
    },
    plays: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    bpm: {
      type: Number,
      default: 150,
    },
    rating: {
      type: Number,
      default: 5,
    },
    coverUrl: {
      type: String,
      default: '/assets/phonkimg/drift.jpg',
    },
    audioUrl: {
      type: String,
      default: 'synth:drift',
    },
    downloadUrl: {
      type: String,
      default: null,
    },
    mood: {
      type: String,
      default: 'Aggressive',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Track', trackSchema);
