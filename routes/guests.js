const express = require('express');
const router = express.Router();
const GuestAccount = require('../models/GuestAccount');
const Track = require('../models/Track');
const Like = require('../models/Like');
const Playlist = require('../models/Playlist');
const crypto = require('crypto');

// -------------------------------------------------------------
// 1. INITIALIZE / FETCH GUEST SESSION
// -------------------------------------------------------------
router.post('/session', async (req, res) => {
  try {
    let { guestToken, deviceId } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let guestAccount = null;

    if (guestToken) {
      guestAccount = await GuestAccount.findOne({ guestToken });
    }

    // If no existing guest account found, generate a new guest account
    if (!guestAccount) {
      guestToken = `guest_${crypto.randomBytes(16).toString('hex')}`;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const guestName = `Guest Drift #${randomNum}`;

      guestAccount = await GuestAccount.create({
        guestToken,
        guestName,
        deviceId: deviceId || null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
        isActive: true,
      });
    } else {
      // Update last active timestamp
      guestAccount.lastActiveAt = new Date();
      await guestAccount.save();
    }

    res.json({
      message: 'Guest session synchronized',
      guestAccount: {
        id: guestAccount._id.toString(),
        guestToken: guestAccount.guestToken,
        guestName: guestAccount.guestName,
        createdAt: guestAccount.createdAt,
      },
    });
  } catch (error) {
    console.error('Guest session error:', error);
    res.status(500).json({ error: 'Failed to initialize guest session.' });
  }
});

// -------------------------------------------------------------
// 2. UPDATE GUEST PROFILE NAME
// -------------------------------------------------------------
router.put('/profile', async (req, res) => {
  try {
    const { guestToken, guestName } = req.body;

    if (!guestToken || !guestName) {
      return res.status(400).json({ error: 'Guest token and new guest name are required.' });
    }

    const updatedGuest = await GuestAccount.findOneAndUpdate(
      { guestToken },
      { guestName: guestName.trim() },
      { new: true }
    );

    if (!updatedGuest) {
      return res.status(404).json({ error: 'Guest account not found.' });
    }

    res.json({
      message: 'Guest profile updated',
      guestAccount: {
        id: updatedGuest._id.toString(),
        guestName: updatedGuest.guestName,
      },
    });
  } catch (error) {
    console.error('Guest update error:', error);
    res.status(500).json({ error: 'Failed to update guest profile.' });
  }
});

// -------------------------------------------------------------
// 3. GET GUEST LIKED TRACKS & UPLOADS
// -------------------------------------------------------------
router.get('/activity/:guestToken', async (req, res) => {
  try {
    const { guestToken } = req.params;

    const guestAccount = await GuestAccount.findOne({ guestToken });
    if (!guestAccount) {
      return res.status(404).json({ error: 'Guest account not found.' });
    }

    const uploadedTracks = await Track.find({ guestAccountId: guestAccount._id }).sort({ createdAt: -1 });
    const likes = await Like.find({ guestAccountId: guestAccount._id }).populate('trackId');
    const playlists = await Playlist.find({ guestAccountId: guestAccount._id });

    res.json({
      guest: {
        id: guestAccount._id.toString(),
        name: guestAccount.guestName,
        uploadedTracks,
        likedTracks: likes.map((l) => l.trackId).filter(Boolean),
        playlists,
      },
    });
  } catch (error) {
    console.error('Guest activity error:', error);
    res.status(500).json({ error: 'Failed to fetch guest activity.' });
  }
});

module.exports = router;
