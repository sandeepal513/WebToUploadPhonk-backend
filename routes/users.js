const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Track = require('../models/Track');
const { verifyToken } = require('../middleware/auth');

// GET USER PROFILE BY USERNAME OR ID
router.get('/:username', async (req, res) => {
  try {
    const rawUsername = req.params.username.replace('@', '').toLowerCase();

    let user = await User.findOne({ username: rawUsername });
    if (!user && rawUsername.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(rawUsername);
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userTracks = await Track.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json({
      user: {
        id: user._id.toString(),
        username: `@${user.username}`,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followersCount,
        following: user.followingCount,
        tracksCount: userTracks.length,
      },
      tracks: userTracks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        artist: t.artist,
        album: t.album,
        subgenre: t.subgenre,
        duration: t.duration,
        durationSec: t.durationSec,
        plays: `${t.plays}`,
        likesCount: t.likesCount,
        bpm: t.bpm,
        rating: t.rating,
        cover: t.coverUrl,
        audioUrl: t.audioUrl,
        mood: t.mood,
        featured: t.featured,
        description: t.description,
      })),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// UPDATE PROFILE (Requires Auth)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id.toString(),
        username: `@${user.username}`,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followersCount,
        following: user.followingCount,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

module.exports = router;
