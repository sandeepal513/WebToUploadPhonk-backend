const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadProfileImageToSupabase } = require('../services/supabase');

// GET USER PROFILE BY USERNAME OR ID
router.get('/:username', async (req, res) => {
  try {
    const rawUsername = req.params.username.replace('@', '').toLowerCase();

    const [users] = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = ? OR id = ?',
      [rawUsername, rawUsername]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = users[0];
    const [userTracks] = await pool.query(
      'SELECT * FROM tracks WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        username: `@${user.username}`,
        name: user.name,
        bio: user.bio || '',
        avatar: user.avatar || '',
        followers: user.followers_count || 0,
        following: user.following_count || 0,
        tracksCount: userTracks.length,
      },
      tracks: userTracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        subgenre: t.subgenre,
        duration: t.duration,
        durationSec: t.duration_sec,
        plays: `${t.plays}`,
        likesCount: t.likes_count,
        bpm: t.bpm,
        rating: t.rating,
        cover: t.cover_url,
        audioUrl: t.audio_url,
        mood: t.mood,
        featured: Boolean(t.featured),
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

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const current = users[0];
    const newName = name || current.name;
    const newBio = bio !== undefined ? bio : current.bio;
    const newAvatar = avatar || current.avatar;

    await pool.query('UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?', [
      newName,
      newBio,
      newAvatar,
      userId,
    ]);

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: userId,
        username: `@${current.username}`,
        name: newName,
        bio: newBio,
        avatar: newAvatar,
        followers: current.followers_count,
        following: current.following_count,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// UPLOAD PROFILE AVATAR IMAGE (To Supabase phonkhub-profile bucket)
router.post('/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar image file uploaded.' });
    }

    const avatarUrl = await uploadProfileImageToSupabase(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype || 'image/jpeg'
    );

    const userId = req.user.id;
    await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    res.json({
      message: 'Profile picture updated successfully!',
      avatar: avatarUrl,
      user: {
        id: user.id,
        username: `@${user.username}`,
        name: user.name,
        bio: user.bio || '',
        avatar: avatarUrl,
        followers: user.followers_count || 0,
        following: user.following_count || 0,
      },
    });
  } catch (error) {
    console.error('Profile avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture.' });
  }
});

module.exports = router;
